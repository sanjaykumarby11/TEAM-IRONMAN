import base64
import binascii
import hashlib
import hmac
import json
import os
import secrets
import threading
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator

app = FastAPI(title="Employee Leave & Task Management API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

DB_FILE = Path(__file__).with_name("db.json")
SESSION_SECRET = os.getenv("SESSION_SECRET", "development-only-change-this-secret").encode()
SESSION_TTL_HOURS = 8
LEAVE_ALLOWANCE_DAYS = 20
DB_LOCK = threading.RLock()
REVOKED_SESSIONS: set[str] = set()
bearer = HTTPBearer(auto_error=False)


class LoginInput(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=200)
    name: str = Field(min_length=1, max_length=120)
    role: Literal["employee", "manager", "admin"] = "employee"


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=2, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    password: str | None = Field(default=None, min_length=8, max_length=200)
    role: Literal["employee", "manager", "admin"] | None = None


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=2000)
    assignee_id: int = Field(gt=0)
    status: Literal["todo", "in-progress", "review", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: date


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    assignee_id: int | None = Field(default=None, gt=0)
    status: Literal["todo", "in-progress", "review", "done"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due_date: date | None = None


class LeaveCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str = Field(min_length=2, max_length=500)

    @field_validator("end_date")
    @classmethod
    def end_date_is_not_before_start(cls, end_date: date, info):
        start_date = info.data.get("start_date")
        if start_date and end_date < start_date:
            raise ValueError("End date must be on or after start date")
        return end_date


class LeaveDecision(BaseModel):
    status: Literal["approved", "rejected"]


def load_db():
    with DB_LOCK:
        if DB_FILE.exists():
            with DB_FILE.open(encoding="utf-8") as source:
                db = json.load(source)
        else:
            db = {"users": [], "tasks": [], "leaves": []}
        for collection in ("users", "tasks", "leaves"):
            db.setdefault(collection, [])
        canonical_users = []
        username_ids = {}
        id_mapping = {}
        changed = False
        for user in db["users"]:
            username_key = user["username"].strip().casefold()
            if username_key in username_ids:
                id_mapping[user["id"]] = username_ids[username_key]
                changed = True
                continue
            user["username"] = user["username"].strip()
            username_ids[username_key] = user["id"]
            id_mapping[user["id"]] = user["id"]
            canonical_users.append(user)
        if changed:
            db["users"] = canonical_users
            for task in db["tasks"]:
                task["assignee_id"] = id_mapping.get(task["assignee_id"], task["assignee_id"])
            for leave in db["leaves"]:
                leave["employee_id"] = id_mapping.get(leave["employee_id"], leave["employee_id"])
                if leave.get("reviewed_by") in id_mapping:
                    leave["reviewed_by"] = id_mapping[leave["reviewed_by"]]
            save_db(db)
        return db


def save_db(db):
    with DB_LOCK:
        temporary_file = DB_FILE.with_suffix(".tmp")
        with temporary_file.open("w", encoding="utf-8") as destination:
            json.dump(db, destination, indent=2)
        temporary_file.replace(DB_FILE)


def public_user(user):
    return {key: value for key, value in user.items() if key not in {"password", "password_hash"}}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 240_000)
    return f"pbkdf2_sha256${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, user: dict) -> bool:
    stored = user.get("password_hash")
    if not stored:
        return hmac.compare_digest(str(user.get("password", "")), password)
    try:
        algorithm, encoded_salt, encoded_digest = stored.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(encoded_salt.encode())
        expected = base64.urlsafe_b64decode(encoded_digest.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 240_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_session(user_id: int) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    session_id = secrets.token_urlsafe(18)
    payload = {
        "sub": user_id,
        "sid": session_id,
        "exp": int((now + timedelta(hours=SESSION_TTL_HOURS)).timestamp()),
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SESSION_SECRET, encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}", session_id


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        encoded, signature = credentials.credentials.split(".", 1)
        expected = hmac.new(SESSION_SECRET, encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        if payload["exp"] <= int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Expired session")
        if payload["sid"] in REVOKED_SESSIONS:
            raise ValueError("Revoked session")
    except (ValueError, KeyError, json.JSONDecodeError, binascii.Error):
        raise HTTPException(status_code=401, detail="Invalid or expired session") from None
    db = load_db()
    user = next((item for item in db["users"] if item["id"] == payload["sub"]), None)
    if not user:
        raise HTTPException(status_code=401, detail="Session user no longer exists")
    return user


def require_roles(*roles):
    def dependency(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action")
        return user
    return dependency


def next_id(items):
    return max((item.get("id", 0) for item in items), default=0) + 1


def leave_days(leave):
    return (date.fromisoformat(leave["end_date"]) - date.fromisoformat(leave["start_date"])).days + 1


@app.get("/")
def read_root():
    return {"message": "Welcome to Employee Leave & Task Management API"}


@app.post("/login")
def login(login_data: LoginInput):
    db = load_db()
    user = next((item for item in db["users"] if item["username"].strip().casefold() == login_data.username.strip().casefold()), None)
    if not user or not verify_password(login_data.password, user):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("password"):
        user["password_hash"] = hash_password(user.pop("password"))
        save_db(db)
    token, _ = create_session(user["id"])
    return {"user": public_user(user), "access_token": token, "token_type": "bearer"}


@app.get("/me")
def get_me(user=Depends(current_user)):
    return public_user(user)


@app.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer), user=Depends(current_user)):
    payload = credentials.credentials.split(".", 1)[0]
    decoded = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    REVOKED_SESSIONS.add(decoded["sid"])
    return {"message": "Signed out successfully"}


@app.get("/users")
def get_users(user=Depends(require_roles("admin", "manager"))):
    db = load_db()
    unique_users = {item["id"]: public_user(item) for item in db["users"]}
    return list(unique_users.values())


@app.post("/users", status_code=201)
def create_user(user_data: UserCreate, user=Depends(require_roles("admin"))):
    db = load_db()
    if any(item["username"].strip().casefold() == user_data.username.strip().casefold() for item in db["users"]):
        raise HTTPException(status_code=409, detail="Username already exists")
    created = user_data.model_dump()
    created["username"] = created["username"].strip()
    created["name"] = created["name"].strip()
    created["id"] = next_id(db["users"])
    created["password_hash"] = hash_password(created.pop("password"))
    db["users"].append(created)
    save_db(db)
    return public_user(created)


@app.put("/users/{user_id}")
def update_user(user_id: int, changes: UserUpdate, actor=Depends(current_user)):
    db = load_db()
    target = next((item for item in db["users"] if item["id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found")
    is_admin = actor["role"] == "admin"
    if actor["id"] != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    updates = changes.model_dump(exclude_unset=True, exclude_none=True)
    if not is_admin and set(updates) - {"name", "password"}:
        raise HTTPException(status_code=403, detail="Only administrators can change usernames or roles")
    if is_admin and actor["id"] == user_id and updates.get("role", actor["role"]) != actor["role"]:
        raise HTTPException(status_code=403, detail="Administrators cannot change their own role")
    if "username" in updates:
        updates["username"] = updates["username"].strip()
        if any(item["id"] != user_id and item["username"].casefold() == updates["username"].casefold() for item in db["users"]):
            raise HTTPException(status_code=409, detail="Username already exists")
    if "name" in updates:
        updates["name"] = updates["name"].strip()
    if "password" in updates:
        target.pop("password", None)
        updates["password_hash"] = hash_password(updates.pop("password"))
    target.update(updates)
    save_db(db)
    return public_user(target)


@app.get("/tasks")
def get_tasks(
    status: str | None = None,
    priority: str | None = None,
    assignee_id: int | None = None,
    search: str | None = None,
    user=Depends(current_user),
):
    db = load_db()
    tasks = db["tasks"]
    if user["role"] == "employee":
        tasks = [task for task in tasks if task["assignee_id"] == user["id"]]
    elif assignee_id is not None:
        tasks = [task for task in tasks if task["assignee_id"] == assignee_id]
    if status:
        tasks = [task for task in tasks if task["status"] == status]
    if priority:
        tasks = [task for task in tasks if task["priority"] == priority]
    if search:
        needle = search.casefold()
        tasks = [task for task in tasks if needle in task["title"].casefold() or needle in task.get("description", "").casefold()]
    return tasks


@app.post("/tasks", status_code=201)
def create_task(task_data: TaskCreate, user=Depends(require_roles("admin", "manager"))):
    db = load_db()
    if not any(item["id"] == task_data.assignee_id for item in db["users"]):
        raise HTTPException(status_code=404, detail="Assignee not found")
    task = task_data.model_dump(mode="json")
    task["id"] = next_id(db["tasks"])
    db["tasks"].append(task)
    save_db(db)
    return task


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, changes: TaskUpdate, actor=Depends(current_user)):
    db = load_db()
    task = next((item for item in db["tasks"] if item["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updates = changes.model_dump(exclude_unset=True, exclude_none=True, mode="json")
    if actor["role"] == "employee":
        if task["assignee_id"] != actor["id"] or set(updates) - {"status"}:
            raise HTTPException(status_code=403, detail="Employees can only update status on their assigned tasks")
    if "assignee_id" in updates and not any(item["id"] == updates["assignee_id"] for item in db["users"]):
        raise HTTPException(status_code=404, detail="Assignee not found")
    task.update(updates)
    save_db(db)
    return task


@app.get("/leaves")
def get_leaves(status: str | None = None, user=Depends(current_user)):
    db = load_db()
    leaves = db["leaves"]
    if user["role"] == "employee":
        leaves = [leave for leave in leaves if leave["employee_id"] == user["id"]]
    if status:
        leaves = [leave for leave in leaves if leave["status"] == status]
    return leaves


@app.get("/leaves/balance/{employee_id}")
def get_leave_balance(employee_id: int, actor=Depends(current_user)):
    if actor["role"] == "employee" and actor["id"] != employee_id:
        raise HTTPException(status_code=403, detail="You can only view your own leave balance")
    db = load_db()
    employee = next((item for item in db["users"] if item["id"] == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    approved = sum(leave_days(item) for item in db["leaves"] if item["employee_id"] == employee_id and item["status"] == "approved")
    reserved = sum(leave_days(item) for item in db["leaves"] if item["employee_id"] == employee_id and item["status"] == "pending")
    return {"employee_id": employee_id, "allowance": LEAVE_ALLOWANCE_DAYS, "used": approved, "pending": reserved, "remaining": LEAVE_ALLOWANCE_DAYS - approved - reserved}


@app.post("/leaves", status_code=201)
def request_leave(leave_data: LeaveCreate, user=Depends(current_user)):
    if user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can submit leave requests")
    if leave_data.start_date < date.today():
        raise HTTPException(status_code=422, detail="Leave cannot start in the past")
    db = load_db()
    requested_days = (leave_data.end_date - leave_data.start_date).days + 1
    existing = [item for item in db["leaves"] if item["employee_id"] == user["id"] and item["status"] != "rejected"]
    if any(leave_data.start_date <= date.fromisoformat(item["end_date"]) and leave_data.end_date >= date.fromisoformat(item["start_date"]) for item in existing):
        raise HTTPException(status_code=409, detail="Leave dates overlap an existing request")
    reserved_days = sum(leave_days(item) for item in existing)
    if reserved_days + requested_days > LEAVE_ALLOWANCE_DAYS:
        raise HTTPException(status_code=422, detail="Request exceeds the remaining leave allowance")
    leave = leave_data.model_dump(mode="json")
    leave.update({"id": next_id(db["leaves"]), "employee_id": user["id"], "status": "pending"})
    db["leaves"].append(leave)
    save_db(db)
    return leave


@app.put("/leaves/{leave_id}/status")
def update_leave_status(leave_id: int, decision: LeaveDecision, user=Depends(require_roles("admin", "manager"))):
    db = load_db()
    leave = next((item for item in db["leaves"] if item["id"] == leave_id), None)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    if leave["status"] != "pending":
        raise HTTPException(status_code=409, detail="Only pending requests can be reviewed")
    if decision.status == "approved":
        approved_days = sum(leave_days(item) for item in db["leaves"] if item["employee_id"] == leave["employee_id"] and item["status"] == "approved")
        if approved_days + leave_days(leave) > LEAVE_ALLOWANCE_DAYS:
            raise HTTPException(status_code=422, detail="Approval exceeds the remaining leave allowance")
    leave["status"] = decision.status
    leave["reviewed_by"] = user["id"]
    save_db(db)
    return {"message": "Leave request updated", "leave": leave}


@app.get("/reports/leaves")
def leave_report(user=Depends(require_roles("admin", "manager"))):
    db = load_db()
    employees = {item["id"]: item for item in db["users"]}
    summaries = {}
    for leave in db["leaves"]:
        employee_id = leave["employee_id"]
        summary = summaries.setdefault(employee_id, {"employee_id": employee_id, "employee_name": employees.get(employee_id, {}).get("name", "Unknown"), "pending": 0, "approved": 0, "rejected": 0, "approved_days": 0})
        summary[leave["status"]] = summary.get(leave["status"], 0) + 1
        if leave["status"] == "approved":
            summary["approved_days"] += leave_days(leave)
    return {"total_requests": len(db["leaves"]), "by_employee": list(summaries.values()), "requests": db["leaves"]}


@app.get("/reports/tasks")
def task_report(user=Depends(require_roles("admin", "manager"))):
    db = load_db()
    employees = {item["id"]: item for item in db["users"]}
    by_status = {status: sum(task["status"] == status for task in db["tasks"]) for status in ("todo", "in-progress", "review", "done")}
    by_assignee = {}
    for task in db["tasks"]:
        summary = by_assignee.setdefault(task["assignee_id"], {"assignee_id": task["assignee_id"], "assignee_name": employees.get(task["assignee_id"], {}).get("name", "Unknown"), "total": 0, "done": 0})
        summary["total"] += 1
        summary["done"] += task["status"] == "done"
    return {"total_tasks": len(db["tasks"]), "by_status": by_status, "by_assignee": list(by_assignee.values()), "tasks": db["tasks"]}

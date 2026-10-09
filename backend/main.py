import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Employee Leave & Task Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "db.json"

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            return json.load(f)
    return {"users": [], "tasks": [], "leaves": []}

def save_db(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)

# Seed initial if empty
db = load_db()
if not db["users"]:
    db["users"] = [
        {"id": 1, "username": "admin", "password": "password", "role": "admin", "name": "Jane Admin"},
        {"id": 2, "username": "alex", "password": "password", "role": "employee", "name": "Alex Mercer"},
        {"id": 3, "username": "sam", "password": "password", "role": "manager", "name": "Sam Smith"},
    ]
    save_db(db)

# --- Models ---
class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: Optional[int] = None
    username: str
    role: str
    name: str

class UserCreate(User):
    password: str

class Task(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    assignee_id: int
    status: str
    priority: str
    due_date: str

class Leave(BaseModel):
    id: Optional[int] = None
    employee_id: int
    start_date: str
    end_date: str
    reason: str
    status: str = "pending"

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to Employee Leave & Task Management API"}

@app.post("/login", response_model=User)
def login(login_data: UserLogin):
    db = load_db()
    for u in db["users"]:
        if u["username"].strip() == login_data.username.strip() and u["password"] == login_data.password:
            return User(**u)
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/users", response_model=List[User])
def get_users():
    db = load_db()
    return [User(**u) for u in db["users"]]

@app.post("/users", response_model=User)
def create_user(user: UserCreate):
    db = load_db()
    user_dict = user.dict()
    user_dict["id"] = len(db["users"]) + 1
    db["users"].append(user_dict)
    save_db(db)
    return User(**user_dict)

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    db = load_db()
    return db["tasks"]

@app.post("/tasks", response_model=Task)
def create_task(task: Task):
    db = load_db()
    task_dict = task.dict()
    task_dict["id"] = len(db["tasks"]) + 1
    db["tasks"].append(task_dict)
    save_db(db)
    return task

@app.get("/leaves", response_model=List[Leave])
def get_leaves():
    db = load_db()
    return db["leaves"]

@app.post("/leaves", response_model=Leave)
def request_leave(leave: Leave):
    db = load_db()
    leave_dict = leave.dict()
    leave_dict["id"] = len(db["leaves"]) + 1
    db["leaves"].append(leave_dict)
    save_db(db)
    return leave

@app.put("/leaves/{leave_id}/status")
def update_leave_status(leave_id: int, status: str):
    db = load_db()
    for leave in db["leaves"]:
        if leave["id"] == leave_id:
            leave["status"] = status
            save_db(db)
            return {"message": "Status updated successfully", "leave": leave}
    raise HTTPException(status_code=404, detail="Leave not found")

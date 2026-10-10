from datetime import date, timedelta

import requests

BASE_URL = "http://localhost:8000"


def signed_in(username):
    session = requests.Session()
    response = session.post(f"{BASE_URL}/login", json={"username": username, "password": "password"})
    response.raise_for_status()
    session.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
    return session


admin = signed_in("admin")
demo_users = [
    {"username": "alex", "password": "password", "role": "employee", "name": "Alex Mercer"},
    {"username": "sam", "password": "password", "role": "manager", "name": "Sam Smith"},
]
employees = admin.get(f"{BASE_URL}/users")
employees.raise_for_status()
employee_ids = {person["username"].casefold(): person["id"] for person in employees.json()}
for person in demo_users:
    key = person["username"].casefold()
    if key not in employee_ids:
        response = admin.post(f"{BASE_URL}/users", json=person)
        response.raise_for_status()
        employee_ids[key] = response.json()["id"]

tasks = [
    {"title": "Design Task Details Screen", "description": "Create a comprehensive view", "status": "in-progress", "priority": "high", "due_date": (date.today() + timedelta(days=1)).isoformat(), "assignee_id": employee_ids["admin"]},
    {"title": "Implement Employee Management View", "description": "Build a directory", "status": "todo", "priority": "medium", "due_date": (date.today() + timedelta(days=5)).isoformat(), "assignee_id": employee_ids["alex"]},
]
existing_tasks = admin.get(f"{BASE_URL}/tasks")
existing_tasks.raise_for_status()
existing_titles = {task["title"] for task in existing_tasks.json()}
for task in tasks:
    if task["title"] not in existing_titles:
        response = admin.post(f"{BASE_URL}/tasks", json=task)
        response.raise_for_status()

alex = signed_in("alex")
existing_leaves = alex.get(f"{BASE_URL}/leaves")
existing_leaves.raise_for_status()
if not any(leave["reason"] == "Vacation" for leave in existing_leaves.json()):
    start_date = date.today() + timedelta(days=10)
    response = alex.post(
        f"{BASE_URL}/leaves",
        json={"start_date": start_date.isoformat(), "end_date": (start_date + timedelta(days=2)).isoformat(), "reason": "Vacation"},
    )
    response.raise_for_status()

print("Demo users, tasks, and leave data are ready.")

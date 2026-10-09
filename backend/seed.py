import requests

BASE_URL = "http://localhost:8000"

users = [
    {"username": "admin", "password": "password", "role": "admin", "name": "Jane Admin"},
    {"username": "alex", "password": "password", "role": "employee", "name": "Alex Mercer"},
    {"username": "sam", "password": "password", "role": "manager", "name": "Sam Smith"}
]

for user in users:
    requests.post(f"{BASE_URL}/users", json=user)

tasks = [
    {"title": "Design Task Details Screen", "description": "Create a comprehensive view", "status": "in-progress", "priority": "high", "due_date": "2026-10-10", "assignee_id": 1},
    {"title": "Implement Employee Management View", "description": "Build a directory", "status": "todo", "priority": "medium", "due_date": "2026-10-15", "assignee_id": 2},
]

for task in tasks:
    requests.post(f"{BASE_URL}/tasks", json=task)

leaves = [
    {"start_date": "2026-10-12", "end_date": "2026-10-14", "reason": "Vacation", "employee_id": 2},
]

for leave in leaves:
    requests.post(f"{BASE_URL}/leaves", json=leave)

print("Database seeded successfully.")

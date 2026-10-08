import sqlite3
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from app.database import get_connection
from app.schemas import TaskInput, TaskStatusUpdate, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])
TASK_SELECT = """
SELECT tasks.*, employees.name AS employee_name, employees.email AS employee_email
FROM tasks
JOIN employees ON employees.id = tasks.employee_id
"""


def get_task_or_404(connection: sqlite3.Connection, task_id: int):
    task = connection.execute(
        TASK_SELECT + " WHERE tasks.id = ?", (task_id,)
    ).fetchone()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return dict(task)


@router.get("")
def list_tasks(
    employee_id: Optional[int] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = None,
):
    query = TASK_SELECT
    filters = []
    parameters = []
    if employee_id is not None:
        filters.append("tasks.employee_id = ?")
        parameters.append(employee_id)
    if priority:
        filters.append("tasks.priority = ?")
        parameters.append(priority)
    if status_filter:
        filters.append("tasks.status = ?")
        parameters.append(status_filter)
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY tasks.deadline ASC, tasks.id DESC"
    with get_connection() as connection:
        return [dict(row) for row in connection.execute(query, parameters).fetchall()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_task(task: TaskInput):
    now = datetime.now().isoformat(timespec="seconds")
    with get_connection() as connection:
        employee = connection.execute(
            "SELECT id FROM employees WHERE id = ?", (task.employee_id,)
        ).fetchone()
        if employee is None:
            raise HTTPException(status_code=400, detail="Please select a valid employee.")
        cursor = connection.execute(
            """
            INSERT INTO tasks
                (title, description, employee_id, priority, deadline, status,
                 created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task.title,
                task.description,
                task.employee_id,
                task.priority.value,
                task.deadline.isoformat(),
                task.status.value,
                now,
                now,
            ),
        )
        return get_task_or_404(connection, cursor.lastrowid)


@router.get("/{task_id}")
def get_task(task_id: int):
    with get_connection() as connection:
        return get_task_or_404(connection, task_id)


@router.put("/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    changes = task.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Provide at least one field to update.")
    for field in ("priority", "status"):
        if field in changes and changes[field] is not None:
            changes[field] = changes[field].value
    if "deadline" in changes and changes["deadline"] is not None:
        changes["deadline"] = changes["deadline"].isoformat()
    if "employee_id" in changes and changes["employee_id"] is not None:
        with get_connection() as connection:
            employee = connection.execute(
                "SELECT id FROM employees WHERE id = ?", (changes["employee_id"],)
            ).fetchone()
            if employee is None:
                raise HTTPException(
                    status_code=400, detail="Please select a valid employee."
                )
    changes["updated_at"] = datetime.now().isoformat(timespec="seconds")
    assignments = ", ".join(f"{field} = ?" for field in changes)
    values = list(changes.values()) + [task_id]
    with get_connection() as connection:
        cursor = connection.execute(
            f"UPDATE tasks SET {assignments} WHERE id = ?", values
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")
        return get_task_or_404(connection, task_id)


@router.delete("/{task_id}")
def delete_task(task_id: int):
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")
    return {"message": "Task deleted successfully."}


@router.patch("/{task_id}/status")
def update_task_status(task_id: int, update: TaskStatusUpdate):
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?",
            (
                update.status.value,
                datetime.now().isoformat(timespec="seconds"),
                task_id,
            ),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")
        return get_task_or_404(connection, task_id)

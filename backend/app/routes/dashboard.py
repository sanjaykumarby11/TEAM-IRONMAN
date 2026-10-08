from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.routes.tasks import TASK_SELECT

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(employee_id: Optional[int] = None):
    with get_connection() as connection:
        if employee_id is not None:
            employee = connection.execute(
                "SELECT id FROM employees WHERE id = ?", (employee_id,)
            ).fetchone()
            if employee is None:
                raise HTTPException(status_code=400, detail="Please select a valid employee.")
        task_filter = " WHERE employee_id = ?" if employee_id is not None else ""
        task_parameters = (employee_id,) if employee_id is not None else ()
        rows = connection.execute(
            "SELECT status, deadline FROM tasks" + task_filter, task_parameters
        ).fetchall()
        totals = {
            "total": len(rows),
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "blocked": 0,
            "overdue": 0,
        }
        status_keys = {
            "Pending": "pending",
            "In Progress": "in_progress",
            "Completed": "completed",
            "Blocked": "blocked",
        }
        today = date.today().isoformat()
        for row in rows:
            totals[status_keys[row["status"]]] += 1
            if row["deadline"] < today and row["status"] != "Completed":
                totals["overdue"] += 1

        recent_query = TASK_SELECT
        if employee_id is not None:
            recent_query += " WHERE tasks.employee_id = ?"
        recent_query += " ORDER BY tasks.updated_at DESC, tasks.id DESC LIMIT 5"
        recent = connection.execute(recent_query, task_parameters).fetchall()
        upcoming_filter = "tasks.deadline >= ? AND tasks.status != 'Completed'"
        upcoming_parameters = [today]
        if employee_id is not None:
            upcoming_filter += " AND tasks.employee_id = ?"
            upcoming_parameters.append(employee_id)
        upcoming = connection.execute(
            TASK_SELECT
            + f" WHERE {upcoming_filter} ORDER BY tasks.deadline ASC LIMIT 5",
            upcoming_parameters,
        ).fetchall()
        return {
            "stats": totals,
            "recent_tasks": [dict(row) for row in recent],
            "upcoming_deadlines": [dict(row) for row in upcoming],
        }

import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from pathlib import Path

from app.models import CREATE_TABLES

DATABASE_PATH = Path(__file__).resolve().parents[1] / "tasks.db"


@contextmanager
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except sqlite3.Error:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_database():
    with get_connection() as connection:
        connection.executescript(CREATE_TABLES)
        employee_count = connection.execute(
            "SELECT COUNT(*) FROM employees"
        ).fetchone()[0]
        if employee_count == 0:
            employees = [
                ("Ashwini R", "ashwini@example.com", "Manager"),
                ("Rahul Kumar", "rahul@example.com", "Employee"),
                ("Priya Sharma", "priya@example.com", "Employee"),
                ("Arjun Kumar", "arjun@example.com", "Employee"),
                ("Sneha Rao", "sneha@example.com", "Employee"),
            ]
            connection.executemany(
                "INSERT INTO employees (name, email, role) VALUES (?, ?, ?)",
                employees,
            )

        task_count = connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
        if task_count == 0:
            today = date.today()
            now = datetime.now().isoformat(timespec="seconds")
            sample_tasks = [
                (
                    "Prepare onboarding checklist",
                    "Create a reusable checklist for new team members.",
                    2,
                    "High",
                    (today + timedelta(days=2)).isoformat(),
                    "In Progress",
                ),
                (
                    "Review quarterly goals",
                    "Collect updates from the team and prepare a short summary.",
                    3,
                    "Medium",
                    (today + timedelta(days=5)).isoformat(),
                    "Pending",
                ),
                (
                    "Update leave policy page",
                    "Check the internal leave policy page for outdated details.",
                    4,
                    "Low",
                    (today - timedelta(days=2)).isoformat(),
                    "Blocked",
                ),
                (
                    "Finalize sprint notes",
                    "Summarize completed work and key decisions from the sprint.",
                    5,
                    "Medium",
                    (today + timedelta(days=1)).isoformat(),
                    "Completed",
                ),
            ]
            connection.executemany(
                """
                INSERT INTO tasks
                    (title, description, employee_id, priority, deadline, status,
                     created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [(*task, now, now) for task in sample_tasks],
            )

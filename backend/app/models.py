"""SQLite table definitions and shared task values."""

CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Manager', 'Employee'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    deadline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Blocked')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

PRIORITIES = ("Low", "Medium", "High")
STATUSES = ("Pending", "In Progress", "Completed", "Blocked")

# 🏢 Employee Leave & Task Management System

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.14-green.svg)
![Flask](https://img.shields.io/badge/Flask-3.1.3-black.svg)
![Architecture](https://img.shields.io/badge/Architecture-RESTful%20%7C%20SPA-violet.svg)

An enterprise-grade, full-stack **Employee Leave & Task Management System** designed to streamline workforce management, leave application tracking, task delegation, team collaboration, and organization productivity analytics.

---

## 🌟 Key Features

### 🔐 1. Employee Authentication & Role-Based Access Control (RBAC)
- **JWT Authorization:** Secure token-based authentication (`Bearer <token>`) with 24-hour expiration.
- **Password Hashing:** Secure password hashing using PBKDF2/SHA256 via `werkzeug.security`.
- **Three User Persona Tiers:**
  - **Administrator:** Complete platform control, user account management, role reassignment, department administration, global leave approvals, and dataset exports.
  - **Manager:** Team workload management, leave approval queue, creating/assigning tasks, setting priorities/deadlines, and reviewing team progress.
  - **Employee:** Self-service portal to apply for time off, monitor leave balances, manage assigned tasks, update work completion percentages (0-100%), and post task comments.

### 📅 2. Leave Management Module
- **Multi-Category Leave Balances:** Tracks **Annual (20d)**, **Sick (10d)**, **Casual (8d)**, **Maternity/Paternity (90d)**, and **Unpaid** leaves per employee.
- **Working-Day Calculator:** Automatic calculation of leave duration based on start and end dates with date validation checks.
- **Manager Approval Queue:** Pending requests filter, quick approval/rejection actions, and reviewer feedback comments.
- **Dynamic Balance Deductions:** Approving leave automatically decrements remaining balances; cancelling restores allocated days.

### 📋 3. Task Workspace & Kanban Board
- **Task Delegation:** Assign tasks with priority levels (`Urgent`, `High`, `Medium`, `Low`), due dates, departments, and descriptions.
- **Dual View Modes:** Interactive **Kanban Board** (`To Do`, `In Progress`, `In Review`, `Completed`) and tabular **List View**.
- **Progress Slider:** Interactive 0–100% completion slider that automatically synchronizes status transitions (`100%` -> `Completed`).
- **Activity Threads:** Real-time comment feeds on each task for team discussion and progress notes.

### 📊 4. Reports & System Analytics
- **Visual Analytics:** Real-time team workforce distribution charts and task completion metrics.
- **Dataset Exports:** One-click CSV and JSON report exports for both Leave records and Task assignments.

---

## 🛠️ Technology Stack

- **Backend API Server:** Python 3, Flask 3, Flask-CORS, PyJWT, Werkzeug.
- **Database Layer:** SQLite3 with relational foreign keys and seed data initializers.
- **Frontend Architecture:** Modern HTML5, Custom Glassmorphic CSS3 (Google Fonts *Inter* & *Outfit*, FontAwesome 6 icons), ES6 JavaScript SPA framework.
- **Test Automation:** Python `unittest` suite covering Auth, Leave, Tasks, and RBAC rules.

---

## 📁 Project Directory Structure

```text
Employee Leave & Task Management System/
├── app.py                # Flask REST API Server & static file routes
├── database.py           # SQLite database schema, initialization & seed data
├── models.py             # User, Leave, Task, Notification & Analytics data access models
├── auth.py               # JWT authentication middleware & RBAC decorators
├── requirements.txt      # Python dependencies
├── README.md             # Master project documentation
├── static/
│   ├── css/
│   │   └── style.css     # Glassmorphic dark design system & responsive styling
│   └── js/
│       ├── api.js        # REST API fetch wrapper & toast notification system
│       ├── auth.js       # Auth handlers, login/register, persona switcher & profile logic
│       ├── leave.js      # Leave balances, application modal, approval queue & history
│       ├── task.js       # Task Kanban board, list view, assignment & progress slider
│       ├── admin.js      # Employee directory table, role modifiers & report exports
│       └── app.js        # Main UI router, notification bell drawer & modal helpers
├── templates/
│   └── index.html        # Single-Page Application container template
├── tests/
│   ├── test_auth.py      # Authentication & RBAC unit tests
│   ├── test_leave.py     # Leave application & balance unit tests
│   ├── test_task.py      # Task assignment & progress update unit tests
│   └── run_tests.py      # Master test runner script
└── docs/
    ├── API_DOCUMENTATION.md  # Full REST API endpoint specification
    ├── TEST_CASES_AND_QA.md  # QA test cases & results matrix
    └── PROJECT_REPORT.md     # Comprehensive project architecture report
```

---

## 🔑 Quick Demo Credentials

For immediate testing, click any of the **Quick Demo Login** persona buttons on the sign-in modal or enter the credentials below:

| Persona | Role | Email | Password |
|---|---|---|---|
| **Administrator** | `admin` | `admin@company.com` | `Admin@123` |
| **Manager** | `manager` | `manager@company.com` | `Manager@123` |
| **Employee** | `employee` | `employee@company.com` | `Employee@123` |

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Navigate to Project Workspace
```bash
cd "Employee Leave & Task Management System"
```

### 2. Activate Virtual Environment & Install Dependencies
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Initialize & Seed Database
```bash
python3 database.py
```

### 4. Start the Application Server
```bash
python3 app.py
```
*The server will start running locally at **`http://127.0.0.1:5050/`**.*

---

## 🧪 Running Automated Tests

To execute the full QA automated unit test suite:

```bash
python3 tests/run_tests.py
```

Expected Output:
```text
test_login_invalid_password (test_auth.AuthTestCase) ... ok
test_login_success (test_auth.AuthTestCase) ... ok
test_register_employee (test_auth.AuthTestCase) ... ok
test_apply_and_review_leave (test_leave.LeaveTestCase) ... ok
test_get_leave_balances (test_leave.LeaveTestCase) ... ok
test_create_and_update_task (test_task.TaskTestCase) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.820s

OK
ALL UNIT TESTS PASSED SUCCESSFULLY! QA VERIFICATION COMPLETE.
```

---

## 📚 Documentation Links

- 📖 [REST API Documentation](docs/API_DOCUMENTATION.md)
- 🧪 [QA Test Cases & Test Matrix](docs/TEST_CASES_AND_QA.md)
- 📄 [Final Project Architecture Report](docs/PROJECT_REPORT.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

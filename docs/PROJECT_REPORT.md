# Final Project Report - Employee Leave & Task Management System

**Project Title:** Employee Leave & Task Management System  
**Framework & Technology:** Python (Flask), SQLite3, Modern HTML5, Custom Glassmorphic CSS3, Vanilla ES6 JavaScript  
**Architecture:** RESTful Web Application with JWT Authentication & Single Page Interface (SPA)

---

## 1. Project Overview

The **Employee Leave & Task Management System** is a unified enterprise platform designed to streamline workforce management, leave tracking, task delegation, and organization productivity analytics.

The system enforces **Role-Based Access Control (RBAC)** across three primary user tiers:
1. **Administrator:** Full administrative control over user accounts, role definitions, department structures, overall leave approvals, task oversight, and CSV/JSON report exports.
2. **Manager:** Team-level management, leave approval queue, creating and assigning tasks to team members, monitoring progress via Kanban board, and posting task updates.
3. **Employee:** Self-service portal to apply for leave, view real-time leave balances (Annual, Sick, Casual, Maternity), track assigned tasks, update work completion percentages (0-100%), and receive instant in-app notifications.

---

## 2. Key Modules & Task Accomplishments

### Task 1: Employee Authentication & Management Module
- Implemented secure JWT-based login/logout endpoints.
- Password hashing with PBKDF2/SHA256 via `werkzeug.security`.
- User registration and profile management (avatar, designation, contact number, password change).
- Role-based middleware (`login_required`, `admin_required`, `manager_or_admin_required`).

### Task 2: Leave Management Module
- Multi-category leave balance tracking (Annual, Sick, Casual, Maternity, Unpaid).
- Leave application form with dynamic working-day calculations and emergency contact.
- Approval workflow with inline reviewer comments.
- Dynamic balance deductions upon approval and balance restorations upon cancellation.

### Task 3: Task Management Module
- Task creation with title, detailed scope, priority rating, assignee selection, and due date.
- Status workflow (`To Do` -> `In Progress` -> `In Review` -> `Completed` -> `Blocked`).
- Interactive progress percentage slider (0% to 100%) and task comment thread feed.

### Task 4 & Task 5: User Interface & Dashboards
- Glassmorphic dark theme built with modern CSS variables, vibrant gradients, and smooth micro-animations.
- Quick Demo Persona Switcher on the sign-in modal for instant demo access.
- Interactive Kanban Board & List View toggles for tasks.
- Employee directory table with inline role/status modifiers.
- Analytics dashboard displaying team distribution and task completion rates.

### Task 6: Testing, QA & Documentation
- Unit test suite (`tests/run_tests.py`) covering auth, leave, tasks, and RBAC.
- One-click CSV and JSON report exports for leaves and tasks.
- Complete API documentation and QA test case matrices.

---

## 3. Quick Demo Credentials

For immediate testing, use the built-in demo persona buttons on the sign-in modal or enter the credentials below:

| Role | Email | Default Password |
|---|---|---|
| **Administrator** | `admin@company.com` | `Admin@123` |
| **Manager** | `manager@company.com` | `Manager@123` |
| **Employee** | `employee@company.com` | `Employee@123` |

---

## 4. How to Run Locally

1. **Activate Virtual Environment:**
   ```bash
   source .venv/bin/activate
   ```
2. **Start Backend Web Server:**
   ```bash
   python3 app.py
   ```
3. **Open Web Application:**
   Navigate to `http://127.0.0.1:5050/` in your browser.
4. **Run Automated Test Suite:**
   ```bash
   python3 tests/run_tests.py
   ```

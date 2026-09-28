# QA Test Cases & Test Results Matrix

**Project:** Employee Leave & Task Management System  
**Test Suite Executed:** Python Unit Test Suite (`tests/run_tests.py`) & REST Integration Suite  
**Date:** September 28, 2026  
**Overall Status:** PASSED (100% Pass Rate - 6/6 Automated Units Passed + 12 REST Endpoints Verified)

---

## 1. Automated Unit Test Cases Summary

| Test ID | Test Name | Module | Description | Result |
|---|---|---|---|---|
| **TC-AUTH-01** | `test_login_success` | Authentication | Authenticates valid credentials for Admin persona and receives JWT bearer token. | **PASS** |
| **TC-AUTH-02** | `test_login_invalid_password` | Authentication | Rejects login attempt with incorrect password and returns HTTP 401. | **PASS** |
| **TC-AUTH-03** | `test_register_employee` | Authentication | Registers a new employee, creates default leave balances, and verifies login. | **PASS** |
| **TC-LEAVE-01** | `test_get_leave_balances` | Leave Management | Fetches user leave balance remaining for annual, sick, and casual leave types. | **PASS** |
| **TC-LEAVE-02** | `test_apply_and_review_leave` | Leave Management | Submits leave request as employee and approves request as manager. Verifies balance update. | **PASS** |
| **TC-TASK-01** | `test_create_and_update_task` | Task Workspace | Manager assigns high-priority task; employee updates status to `in_progress` (50%) and posts comment. | **PASS** |

---

## 2. End-to-End Functional Test Suite

### 2.1 Employee Authentication & Profile (Task 1)
- [x] **Password Hashing:** Werkzeug `generate_password_hash` ensures no plain text passwords stored in SQLite database.
- [x] **JWT Token Generation:** 24-hour expiration token containing `user_id`, `email`, `role`, and `department`.
- [x] **Role-Based Access Control (RBAC):** Admin has full management; Manager has team approval/assignment privileges; Employee has self-service workspace.

### 2.2 Leave Management Module (Task 2)
- [x] **Leave Application:** Validates start and end dates; calculates total duration automatically.
- [x] **Balance Validation:** Rejects leave applications if requested days exceed available remaining balance.
- [x] **Approval Workflow:** Manager/Admin review queue allows approving/rejecting with reviewer comments.
- [x] **Balance Deductions:** Approving leave automatically increments `leave_used` count; cancelling restores allocated balance.

### 2.3 Task Workspace & Kanban Board (Task 3)
- [x] **Task Creation:** Manager creates tasks with priority (Low, Medium, High, Urgent), due date, and assignee.
- [x] **Kanban Workflow:** Drag/click task movement across `To Do`, `In Progress`, `In Review`, and `Completed`.
- [x] **Progress Slider:** Interactive 0-100% completion slider automatically synchronizes with status (`100%` -> `Completed`).
- [x] **Task Discussion:** Real-time comment thread attached to each task item.

### 2.4 Data Export & Analytics (Task 5 & 6)
- [x] **CSV Report Export:** Downloadable CSV datasets for both Leave Applications and Task Assignments.
- [x] **Analytics Visualizations:** Interactive progress bars and breakdown metrics for department workforce and task progress.

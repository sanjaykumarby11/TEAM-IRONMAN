# 📖 Backend API Documentation

## Authentication Endpoints (`/api/auth`)
- `POST /api/auth/login` - User login & JWT retrieval.
- `POST /api/auth/register` - User registration.
- `GET /api/auth/me` - Current authenticated user details.
- `PUT /api/auth/profile` - Profile updates.
- `PUT /api/auth/change-password` - Password updates.

## Employee Management (`/api/employees`)
- `GET /api/employees` - List all employees (Manager/Admin).
- `POST /api/employees` - Create employee account (Admin only).
- `PUT /api/employees/<id>` - Update employee role/status (Admin only).

## Leave Management (`/api/leave`)
- `GET /api/leave/balances` - View available leave balances.
- `GET /api/leave/my-requests` - View user leave request history.
- `POST /api/leave/apply` - Submit new leave application.
- `GET /api/leave/all` - List all leave requests (Manager/Admin).
- `PUT /api/leave/<id>/review` - Approve or reject leave request.
- `POST /api/leave/<id>/cancel` - Cancel submitted leave.

## Task Management (`/api/tasks`)
- `GET /api/tasks` - List tasks with status/priority/dept filters.
- `POST /api/tasks` - Create and assign task (Manager/Admin).
- `GET /api/tasks/<id>` - Fetch task details & activity comments.
- `PUT /api/tasks/<id>/status` - Update task progress and status.
- `PUT /api/tasks/<id>` - Edit task details (Manager/Admin).
- `DELETE /api/tasks/<id>` - Delete task (Manager/Admin).
- `POST /api/tasks/<id>/comments` - Add discussion comment to task.

## Notifications (`/api/notifications`)
- `GET /api/notifications` - Fetch user notifications.
- `PUT /api/notifications/<id>/read` - Mark single notification as read.
- `PUT /api/notifications/read-all` - Mark all notifications as read.

## Analytics & Reports (`/api/analytics` & `/api/reports`)
- `GET /api/analytics/dashboard` - Get system performance metrics.
- `GET /api/reports/leave/export` - Export leave records (CSV / JSON).
- `GET /api/reports/task/export` - Export task records (CSV / JSON).

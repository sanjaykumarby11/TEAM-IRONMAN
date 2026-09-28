# API Documentation - Employee Leave & Task Management System

**Version:** 1.0.0  
**Base URL:** `http://127.0.0.1:5050/api`  
**Authentication Standard:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Authentication & Profile Endpoints

### 1.1 Login User
- **HTTP Method:** `POST`
- **Endpoint:** `/auth/login`
- **Access Level:** Public
- **Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Sarah Jenkins",
    "email": "admin@company.com",
    "role": "admin",
    "department": "HR & Management",
    "designation": "Chief HR Officer",
    "phone": "+1 555-0101",
    "avatar_url": "https://..."
  }
}
```

### 1.2 Register Employee
- **HTTP Method:** `POST`
- **Endpoint:** `/auth/register`
- **Access Level:** Public
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "password": "Password@123",
  "role": "employee",
  "department": "Engineering",
  "designation": "Frontend Developer",
  "phone": "+1 555-0199"
}
```

### 1.3 Current User Profile
- **HTTP Method:** `GET`
- **Endpoint:** `/auth/me`
- **Access Level:** Authenticated Users

---

## 2. Employee Management Endpoints

### 2.1 List All Employees
- **HTTP Method:** `GET`
- **Endpoint:** `/employees`
- **Access Level:** Manager, Admin

### 2.2 Create New Employee (Admin Only)
- **HTTP Method:** `POST`
- **Endpoint:** `/employees`
- **Access Level:** Admin

### 2.3 Update Employee Role / Status / Department
- **HTTP Method:** `PUT`
- **Endpoint:** `/employees/<user_id>`
- **Access Level:** Admin

---

## 3. Leave Management Endpoints

### 3.1 Get User Leave Balances
- **HTTP Method:** `GET`
- **Endpoint:** `/leave/balances`
- **Access Level:** Authenticated Users

### 3.2 Apply for Leave
- **HTTP Method:** `POST`
- **Endpoint:** `/leave/apply`
- **Access Level:** Authenticated Users
- **Request Body:**
```json
{
  "leave_type": "annual",
  "start_date": "2026-10-15",
  "end_date": "2026-10-18",
  "total_days": 4,
  "reason": "Family vacation",
  "emergency_contact": "+1 555-9999"
}
```

### 3.3 List All Leave Applications
- **HTTP Method:** `GET`
- **Endpoint:** `/leave/all?status=pending`
- **Access Level:** Manager, Admin

### 3.4 Review / Approve / Decline Leave Request
- **HTTP Method:** `PUT`
- **Endpoint:** `/leave/<leave_id>/review`
- **Access Level:** Manager, Admin
- **Request Body:**
```json
{
  "status": "approved",
  "comments": "Approved. Have a great vacation!"
}
```

---

## 4. Task Management Endpoints

### 4.1 List Tasks
- **HTTP Method:** `GET`
- **Endpoint:** `/tasks?priority=all&scope=all`
- **Access Level:** Authenticated Users

### 4.2 Create & Assign Task
- **HTTP Method:** `POST`
- **Endpoint:** `/tasks`
- **Access Level:** Manager, Admin
- **Request Body:**
```json
{
  "title": "Build JWT Authentication Endpoint",
  "description": "Implement Flask JWT handler with password hashing",
  "assigned_to": 3,
  "priority": "high",
  "due_date": "2026-10-05",
  "department": "Engineering"
}
```

### 4.3 Update Task Status & Progress
- **HTTP Method:** `PUT`
- **Endpoint:** `/tasks/<task_id>/status`
- **Access Level:** Authenticated Users (Assignee/Manager/Admin)
- **Request Body:**
```json
{
  "status": "in_progress",
  "progress_percent": 75
}
```

### 4.4 Add Task Comment
- **HTTP Method:** `POST`
- **Endpoint:** `/tasks/<task_id>/comments`
- **Access Level:** Authenticated Users

---

## 5. System Analytics & Reports

### 5.1 Dashboard Metrics Summary
- **HTTP Method:** `GET`
- **Endpoint:** `/analytics/dashboard`
- **Access Level:** Authenticated Users

### 5.2 Export Leave Data (CSV/JSON)
- **HTTP Method:** `GET`
- **Endpoint:** `/reports/leave/export?format=csv`
- **Access Level:** Manager, Admin

### 5.3 Export Task Data (CSV/JSON)
- **HTTP Method:** `GET`
- **Endpoint:** `/reports/task/export?format=csv`
- **Access Level:** Manager, Admin

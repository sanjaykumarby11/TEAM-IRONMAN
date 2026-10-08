# 🏢 Employee Leave & Task Management System

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.14-green.svg)
![Flask](https://img.shields.io/badge/Flask-3.1.3-black.svg)
![Architecture](https://img.shields.io/badge/Architecture-RESTful%20%7C%20FullStack-violet.svg)

An enterprise-grade, full-stack **Employee Leave & Task Management System** designed with clean, modular architecture separating the backend service (`backend/`) from the frontend application (`frontend/`).

---

## 📁 Repository Directory & Architecture Structure

```
.
├── backend/                      # Python Backend Service
│   ├── app/                      # Application logic (routers, models, schemas, services)
│   │   ├── models/               # Database models (user, leave, task, notification, analytics)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── leave.py
│   │   │   ├── task.py
│   │   │   ├── notification.py
│   │   │   └── analytics.py
│   │   ├── routers/              # REST API endpoints (Auth, Employees, Leave, Tasks, Notifications, Analytics, Reports)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── employees.py
│   │   │   ├── leave.py
│   │   │   ├── tasks.py
│   │   │   ├── notifications.py
│   │   │   ├── analytics.py
│   │   │   └── reports.py
│   │   ├── schemas/              # Request & response validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth_schema.py
│   │   │   ├── leave_schema.py
│   │   │   └── task_schema.py
│   │   ├── services/             # Core business & workflow services
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── leave_service.py
│   │   │   └── task_service.py
│   │   ├── utils/                # Security, JWT, and authorization utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   └── jwt_handler.py
│   │   ├── config.py             # Application configuration & loader
│   │   ├── database.py           # Database connection & session factory
│   │   └── main.py               # Application entry point & CORS configuration
│   ├── tests/                    # Automated test suite (unittest / pytest)
│   │   ├── __init__.py
│   │   ├── run_tests.py
│   │   ├── test_auth.py
│   │   ├── test_leave.py
│   │   └── test_task.py
│   ├── docs/                     # System & API documentation
│   │   ├── API_DOCUMENTATION.md
│   │   ├── PROJECT_REPORT.md
│   │   └── TEST_CASES_AND_QA.md
│   ├── uploads/                  # Storage directory for uploaded assets
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend environment variables template
│   └── run.py                    # Script runner for backend server
│
├── frontend/                     # Modern Web Application
│   ├── public/                   # Static host assets & index.html
│   │   ├── index.html
│   │   └── favicon.ico
│   └── src/                      # Source code
│       ├── components/           # Reusable UI components (Sidebar, Navbar, StatCard, Modal, Toast)
│       │   ├── Navbar.js
│       │   ├── Sidebar.js
│       │   ├── StatCard.js
│       │   ├── Modal.js
│       │   └── Toast.js
│       ├── pages/                # Application pages (Auth, Dashboard, Leave, Task, Admin, Profile)
│       │   ├── AuthPage.js
│       │   ├── DashboardPage.js
│       │   ├── LeavePage.js
│       │   ├── TaskPage.js
│       │   ├── AdminPage.js
│       │   └── ProfilePage.js
│       ├── services/             # API client & HTTP interceptor services
│       │   ├── api.js
│       │   ├── auth.js
│       │   ├── leave.js
│       │   ├── task.js
│       │   └── admin.js
│       ├── App.js                # Main application routing & controller
│       └── App.css               # Design system & styling stylesheet
│   ├── package.json              # Node dependencies & build script specs
│   └── vite.config.js            # Vite dev server & backend reverse-proxy
│
├── .gitignore                    # Unified Git ignore rules
├── LICENSE                       # Open-source MIT License
└── README.md                     # Project documentation & setup instructions
```

---

## 🚀 Quick Start & How to Run

### Task Management module

The Taskspace Employee Task Management module is available in `backend/app/` and `frontend/`.
It uses FastAPI and SQLite for the REST API, with a React/Vite frontend.

Start the API in one terminal:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). The API documentation is at
`http://127.0.0.1:8000/docs`. Sample task and employee data are added automatically on first
startup. For module features and API details, see the Task Management section and route
documentation in the source tree.

### 1. Run the Backend & Application Server
From the project root:
```bash
.venv/bin/python backend/run.py
```
Or:
```bash
python backend/run.py
```

The application will start on **`http://localhost:5050`**.
Opening `http://localhost:5050` in your web browser launches the full-stack web application interface!

### 2. Run Automated Test Suite
To run all automated unit tests:
```bash
.venv/bin/python backend/tests/run_tests.py
```

---

## 🔐 Quick Demo Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@company.com` | `Admin@123` | Full system control, user creation, CSV exports |
| **Manager** | `manager@company.com` | `Manager@123` | Team leave review queue, task delegation |
| **Employee** | `employee@company.com` | `Employee@123` | Apply leave, update task progress, post comments |

---

## 📜 License
This project is open source and released under the [MIT License](LICENSE).

# Employee & Leave Management System

A simple beginner-friendly employee and leave management system built with HTML, CSS, JavaScript, Node.js, Express, and SQLite.

## Features

- Employee and manager login with JWT authentication
- Employee registration
- Employee dashboard with leave statistics
- Leave application with automatic day calculation
- Leave history with status filters
- Employee profile editing
- Manager approval and rejection workflow
- SQLite database storage
- Password hashing with bcrypt
- Responsive dashboard UI

## Project Structure

```text
employee-leave-management/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── employee_leave.db
└── README.md
```

## Install dependencies

Open the backend folder and run:

```bash
cd backend
npm install
```

## Start the backend

```bash
cd backend
npm start
```

The server starts on `http://localhost:3000`.

## Start the frontend

The frontend is served by the Express backend. Open this URL in a browser:

```text
http://localhost:3000
```

## Demo accounts

- Employee: Employee ID or Email: `employee` or `employee@example.com`; Password: `1234`
- Manager: Employee ID or Email: `manager` or `manager@example.com`; Password: `1234`

## How frontend connects to backend

The frontend runs in the browser and uses the JavaScript `fetch()` function to send HTTP requests to the Express API.

- The login form sends credentials to `POST /api/auth/login`.
- The browser stores the JWT in `localStorage`.
- Later requests add the token in the `Authorization` header.
- The server checks the token with authentication middleware before allowing access.
- The frontend uses API responses to update the dashboard, leave history, profile, and manager pages.

The frontend is served from the same Express server, so the API paths use relative URLs such as `/api/dashboard`.

## How SQLite works

SQLite is a file-based relational database. The project stores the database in `backend/employee_leave.db`.

When the server starts, it creates these tables:

- `employees`: employee account information
- `leave_balances`: total and used leave
- `leave_requests`: leave application records

The `sqlite3` Node.js package provides the connection and executes SQL queries. The application uses `INSERT`, `SELECT`, `UPDATE`, and `DELETE` operations to store and read the data.

## Security

- Passwords are hashed with bcrypt before being saved.
- Login returns a JWT.
- Protected API routes check the JWT in an authentication middleware.
- Manager-only routes check the employee role before allowing changes.

## Simple viva explanation

The project has three main parts:

1. The frontend displays pages and collects user input.
2. The Express backend receives requests, verifies users, and performs database operations.
3. SQLite stores the employee, leave balance, and leave request records.

When an employee applies for leave, the frontend sends the request to the backend. The backend checks the available leave balance, saves the request, and marks its status as Pending. A manager later reviews the request and approves or rejects it. If approved, the backend increases the used leave count; if rejected, it leaves the balance unchanged.

## Notes

- The database is automatically created when the backend starts.
- Demo employee and manager accounts are created automatically on first run.
- Attachments are stored in the `backend/uploads` folder.

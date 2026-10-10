# Team Ironman People Operations

Employee, leave, and task management built with React, Vite, and Python FastAPI. The FastAPI backend stores records in `backend/db.json` and serves authenticated JSON APIs; the React frontend runs separately through Vite.

## Features

- Role-aware login, signed expiring sessions, and logout revocation
- Employee directory, profile updates, and administrator-controlled employee creation/roles
- Task assignment, employee status updates, search, and status/priority filters
- Leave submission, overlap and allowance validation, manager/admin review, and leave balance tracking
- Leave and task summaries with CSV exports
- Server-side role enforcement and employee-scoped task/leave visibility
- Password migration from the original plain-text demo records to PBKDF2 hashes at next login
- Responsive dashboard and accessible form/table controls

## Run Locally

Open a terminal in `backend` and install/start the API:

```powershell
python -m pip install -r requirements.txt
$env:SESSION_SECRET = "replace-with-a-long-random-secret"
python -m uvicorn main:app --reload --port 8000
```

In a second terminal, start React:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). FastAPI docs are available at `http://localhost:8000/docs`. Set `VITE_API_URL` if the API is hosted somewhere other than `http://localhost:8000`; set `FRONTEND_ORIGINS` to a comma-separated list of allowed browser origins when deploying.

## Demo Accounts

The existing sample data includes `admin`, `sam` (manager), and `alex` (employee), all with password `password`. The first successful login migrates that account's stored password to a PBKDF2 hash. Replace the demo credentials and set a strong `SESSION_SECRET` outside local development.

## Role Boundaries

- Employees can view their own tasks, leave records, and balance; update their own name/password; and change task status only on tasks assigned to them.
- Managers can view the employee directory, create/assign tasks, review pending leave, and view reports.
- Administrators can do manager operations and create employees or change profile roles.
- Protected API routes enforce these rules; hiding a navigation link is not treated as authorization.

Sessions expire after eight hours. The API verifies the user's current role from the JSON store on each authenticated request. This JSON persistence is intended for this project/demo; use a transactional database before multi-worker or production deployment.

## API and Reports

- `POST /login`, `GET /me`, `POST /logout`
- `GET/POST /users`, `PUT /users/{id}`
- `GET/POST /tasks`, `PATCH /tasks/{id}`
- `GET/POST /leaves`, `PUT /leaves/{id}/status`, `GET /leaves/balance/{employee_id}`
- `GET /reports/leaves`, `GET /reports/tasks`

Leave days are counted inclusively as calendar days. Pending requests reserve balance; approval moves reserved days to used, and rejection releases them. Admin/manager report screens export the current report data as CSV.

## Verification

```powershell
cd backend
python -m unittest -v test_main
```

```powershell
cd frontend
npm run lint
npm run build
```

See [TEST_PLAN.md](TEST_PLAN.md) for scenarios, expected results, acceptance criteria, and defect triage.

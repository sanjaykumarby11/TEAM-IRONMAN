# Team Ironman Test Plan

## Scope and Setup

Validate authentication/access control, employee records, leave workflows and balances, task assignment/tracking, React-to-FastAPI integration, and management reports. Use isolated API data through `backend/test_main.py`; do not run mutation tests against the shared `backend/db.json`.

Start FastAPI on port 8000 and Vite on port 5173 for browser scenarios. Demo users are `admin`, `sam` (manager), and `alex` (employee), password `password`. The API uses bearer sessions returned by `POST /login`.

## Acceptance Criteria

| ID | Acceptance criterion |
| --- | --- |
| AC-01 | Invalid credentials fail; authenticated sessions expire, logout revokes a session, and protected routes reject missing/invalid tokens. |
| AC-02 | Employee actions cannot read another employee's tasks/leaves, change roles, create tasks, or review leave. |
| AC-03 | Employee creation rejects duplicate usernames; profile changes persist without exposing stored credentials. |
| AC-04 | Leave requests reject past/reversed/overlapping dates and requests beyond the 20-day allowance. |
| AC-05 | Pending leave reserves available days; approval moves days from pending to used; rejection restores availability. |
| AC-06 | Managers/admins can create and assign tasks; employees can only update status on their assigned tasks. |
| AC-07 | Search and status/priority filters return only matching, role-visible tasks. |
| AC-08 | Leave/task reports reconcile with source records and CSV exports include report totals/details. |
| AC-09 | React forms call the API, show validation/server errors, refresh after successful mutations, and hide unavailable routes by role. |

## Test Cases

| ID | Scenario | Expected result | Execution |
| --- | --- | --- | --- |
| AUTH-01 | Login with valid admin, manager, employee credentials; inspect response. | Correct role/user returned with bearer token; password/hash absent. | Automated pass |
| AUTH-02 | Wrong password or no token on protected route. | `401`; no protected data returned. | Automated pass |
| AUTH-03 | Employee calls directory/reports/leave decision or attempts role change. | `403`; stored employee role and other records remain unchanged. | Automated pass |
| AUTH-04 | Logout then reuse the same bearer token. | Logout succeeds; subsequent request returns `401`. | Automated pass |
| EMP-01 | Admin creates employee with valid data; repeat username with different casing. | First request creates employee; duplicate returns `409`; no password returned. | Automated pass |
| EMP-02 | Employee updates own name and attempts to edit another profile or own role. | Own profile update persists; prohibited edits return `403`. | Automated pass |
| EMP-03 | Load legacy duplicate usernames with task/leave references. | One canonical account remains and references point to it. | Automated pass |
| LEAVE-01 | Employee submits future leave; another employee requests the same dates. | First request is pending and visible only to owner/manager/admin; second is blocked. | Automated pass |
| LEAVE-02 | Submit past date, reversed range, or overlapping request. | Validation error; no invalid request is persisted. | Automated pass / reversed range schema validation |
| LEAVE-03 | Submit a request exceeding available allowance. | `422`; no request or balance mutation. | Automated pass |
| LEAVE-04 | Manager approves pending request, then attempts to review it again. | Approved days move to used, pending drops, available stays consistent; second review returns `409`. | Automated pass |
| LEAVE-05 | Manager rejects pending request. | Used days stay unchanged and reserved availability is released. | Automated pass |
| TASK-01 | Manager creates task for a valid employee; use missing assignee. | Valid task persists; unknown assignee returns `404`. | Automated pass |
| TASK-02 | Employee updates status on own task and attempts edits/another person's task. | Own status update succeeds; other mutations return `403`. | Automated pass |
| TASK-03 | Filter tasks by status, priority, assignee, and search term. | Each result matches all requested filters and user's access scope. | Automated pass (status/priority/search) |
| INT-01 | Sign in through React as admin and employee; open the major screens. | Requests include bearer token and live API data renders; admin saw 3 directory rows, 2 original tasks, and 1 pending leave; employee saw only 1 assigned task and no directory link. | Browser pass |
| INT-02 | Sign out and navigate back to protected URL. | Session is revoked and user returns to login. | Browser pass |
| RPT-01 | Compare leave report totals and approved days with leave records. | Per-employee and overall totals reconcile. | Automated pass (summary endpoint) and browser render pass |
| RPT-02 | Compare task status/assignee report with tasks and export CSV. | Counts reconcile; downloaded CSV contains the visible report data. | Automated pass for counts and browser render; download event not verifiable in integrated browser harness |

## Executed Checks

| Check | Result |
| --- | --- |
| `python -m unittest -v test_main` from `backend` | 7 tests passed, including auth, employee permissions, task workflows, leave balance, reports, and duplicate migration. |
| `npm run lint` from `frontend` | Passed with no warnings after hook/purity fixes. |
| `npm run build` from `frontend` | Passed; Vite production bundle generated. |
| Integrated browser smoke on `http://127.0.0.1:5173` with FastAPI on port 8000 | Login, dashboard, employee directory, leave review, both report tabs, and logout verified. Initial CORS mismatch was fixed for both localhost origins. |

## Defect Triage

| ID | Severity | Category | Defect | Status / verification |
| --- | --- | --- | --- | --- |
| BUG-01 | High | Authorization | API endpoints allowed anonymous reads/writes and role changes, including administrator self-demotion. | Fixed with signed bearer sessions, server-side role dependencies, and admin self-role protection; covered by AUTH/EMP tests. |
| BUG-02 | High | Business rules | Leave submission/review had no date, overlap, allowance, or pending-only constraints. | Fixed with validation and balance reservation; covered by LEAVE tests. |
| BUG-03 | Medium | Data integrity | Imported seed data contained duplicate accounts; task ownership could point at a duplicate ID. | Fixed by canonicalizing usernames and remapping references; regression test passes. |
| BUG-04 | High | Integration/UI | React exposed placeholder dashboard values and had no task/employee routes; leave approval sent the wrong request shape. | Fixed with API-backed pages and JSON decision payloads; production build and browser smoke pass. |
| BUG-05 | Medium | Reporting | Report controls were placeholders and no report endpoints existed. | Fixed with protected summaries and CSV exports; API summary tests pass, browser download remains to verify. |
| BUG-06 | Medium | Integration/configuration | Browser requests from `127.0.0.1:5173` failed CORS preflight because only `localhost` was allowed. | Fixed by allowing both local Vite origins; browser login and authenticated screens pass. |

## Exit Criteria

All API automated tests, frontend lint, and production build must pass. Before release, complete the pending browser checks INT-01, INT-02, and RPT-02 against the running local services and confirm CSV contents in the target browser.
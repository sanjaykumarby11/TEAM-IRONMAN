# 🧪 QA & Test Suite Documentation

## Automated Tests Overview
The system contains an automated test suite verifying core application endpoints:
1. `test_auth.py` - Validates user login, invalid credential rejection, and employee registration workflow.
2. `test_leave.py` - Verifies leave balance retrieval, leave application submission, and manager review workflow.
3. `test_task.py` - Tests task creation by managers, progress/status updates by employees, and task comment threads.

To run the automated test suite:
```bash
python backend/tests/run_tests.py
```

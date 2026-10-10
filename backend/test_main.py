import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

from fastapi.testclient import TestClient

import main


class ManagementApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        main.DB_FILE = Path(self.temp_dir.name) / "db.json"
        main.REVOKED_SESSIONS.clear()
        main.save_db(
            {
                "users": [
                    {"id": 1, "username": "admin", "password": "password", "role": "admin", "name": "Jane Admin"},
                    {"id": 2, "username": "alex", "password": "password", "role": "employee", "name": "Alex Mercer"},
                    {"id": 3, "username": "sam", "password": "password", "role": "manager", "name": "Sam Smith"},
                    {"id": 4, "username": "lee", "password": "password", "role": "employee", "name": "Lee Chen"},
                ],
                "tasks": [
                    {"id": 1, "title": "Employee task", "description": "Only for Alex", "assignee_id": 2, "status": "todo", "priority": "high", "due_date": date.today().isoformat()},
                    {"id": 2, "title": "Lee task", "description": "Only for Lee", "assignee_id": 4, "status": "done", "priority": "low", "due_date": date.today().isoformat()},
                ],
                "leaves": [],
            }
        )
        self.client = TestClient(main.app)
        self.admin = self.login("admin")
        self.employee = self.login("alex")
        self.other_employee = self.login("lee")
        self.manager = self.login("sam")

    def tearDown(self):
        self.temp_dir.cleanup()

    def login(self, username):
        response = self.client.post("/login", json={"username": username, "password": "password"})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertNotIn("password", body["user"])
        return {"Authorization": f"Bearer {body['access_token']}"}

    def test_authentication_and_logout(self):
        self.assertEqual(self.client.get("/tasks").status_code, 401)
        self.assertEqual(self.client.post("/login", json={"username": "admin", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.client.get("/me", headers=self.employee).json()["role"], "employee")
        self.assertEqual(self.client.post("/logout", headers=self.employee).status_code, 200)
        self.assertEqual(self.client.get("/me", headers=self.employee).status_code, 401)

    def test_employee_directory_permissions_and_profile_integrity(self):
        self.assertEqual(self.client.get("/users", headers=self.employee).status_code, 403)
        created = self.client.post("/users", headers=self.admin, json={"username": "newhire", "password": "strongpass", "name": "New Hire"})
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["role"], "employee")
        duplicate = self.client.post("/users", headers=self.admin, json={"username": "NEWHIRE", "password": "strongpass", "name": "Duplicate"})
        self.assertEqual(duplicate.status_code, 409)
        padded_duplicate = self.client.post("/users", headers=self.admin, json={"username": " newhire ", "password": "strongpass", "name": "Padded Duplicate"})
        self.assertEqual(padded_duplicate.status_code, 409)
        self.assertEqual(self.client.put("/users/1", headers=self.admin, json={"role": "employee"}).status_code, 403)
        self.assertEqual(self.client.put("/users/2", headers=self.employee, json={"role": "admin"}).status_code, 403)
        self.assertEqual(self.client.put("/users/4", headers=self.employee, json={"name": "Intruder"}).status_code, 403)
        self.assertEqual(self.client.put("/users/2", headers=self.employee, json={"name": "Alex M."}).json()["name"], "Alex M.")

    def test_task_creation_assignment_filtering_and_status(self):
        self.assertEqual([task["id"] for task in self.client.get("/tasks", headers=self.employee).json()], [1])
        self.assertEqual(self.client.post("/tasks", headers=self.employee, json={}).status_code, 403)
        created = self.client.post(
            "/tasks",
            headers=self.manager,
            json={"title": "Ship feature", "assignee_id": 2, "due_date": (date.today() + timedelta(days=3)).isoformat()},
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(len(self.client.get("/tasks?status=todo&priority=high", headers=self.manager).json()), 1)
        self.assertEqual(self.client.patch("/tasks/1", headers=self.employee, json={"status": "in-progress"}).status_code, 200)
        self.assertEqual(self.client.patch("/tasks/2", headers=self.employee, json={"status": "done"}).status_code, 403)
        self.assertEqual(self.client.patch("/tasks/1", headers=self.employee, json={"title": "Changed"}).status_code, 403)

    def test_leave_request_approval_balance_and_overlap(self):
        start = date.today() + timedelta(days=5)
        leave_payload = {"start_date": start.isoformat(), "end_date": (start + timedelta(days=2)).isoformat(), "reason": "Family trip"}
        created = self.client.post("/leaves", headers=self.employee, json=leave_payload)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.json()["status"], "pending")
        self.assertEqual(self.client.get("/leaves", headers=self.other_employee).json(), [])
        balance = self.client.get("/leaves/balance/2", headers=self.employee).json()
        self.assertEqual((balance["allowance"], balance["used"], balance["pending"], balance["remaining"]), (20, 0, 3, 17))
        self.assertEqual(self.client.post("/leaves", headers=self.employee, json=leave_payload).status_code, 409)
        self.assertEqual(self.client.put(f"/leaves/{created.json()['id']}/status?status=approved", headers=self.employee).status_code, 403)
        reviewed = self.client.put(f"/leaves/{created.json()['id']}/status", headers=self.manager, json={"status": "approved"})
        self.assertEqual(reviewed.status_code, 200)
        balance = self.client.get("/leaves/balance/2", headers=self.employee).json()
        self.assertEqual((balance["used"], balance["pending"], balance["remaining"]), (3, 0, 17))
        self.assertEqual(self.client.put(f"/leaves/{created.json()['id']}/status", headers=self.manager, json={"status": "rejected"}).status_code, 409)
        report = self.client.get("/reports/leaves", headers=self.manager).json()
        alex_summary = next(item for item in report["by_employee"] if item["employee_id"] == 2)
        self.assertEqual((report["total_requests"], alex_summary["approved"], alex_summary["approved_days"]), (1, 1, 3))

    def test_rejected_leave_does_not_reduce_balance_and_past_is_blocked(self):
        yesterday = date.today() - timedelta(days=1)
        past = {"start_date": yesterday.isoformat(), "end_date": yesterday.isoformat(), "reason": "Past request"}
        self.assertEqual(self.client.post("/leaves", headers=self.employee, json=past).status_code, 422)
        future = date.today() + timedelta(days=10)
        reversed_dates = {"start_date": future.isoformat(), "end_date": (future - timedelta(days=1)).isoformat(), "reason": "Reversed dates"}
        excessive = {"start_date": future.isoformat(), "end_date": (future + timedelta(days=20)).isoformat(), "reason": "Too many days"}
        self.assertEqual(self.client.post("/leaves", headers=self.employee, json=reversed_dates).status_code, 422)
        self.assertEqual(self.client.post("/leaves", headers=self.employee, json=excessive).status_code, 422)
        start = date.today() + timedelta(days=8)
        payload = {"start_date": start.isoformat(), "end_date": start.isoformat(), "reason": "Appointment"}
        leave = self.client.post("/leaves", headers=self.employee, json=payload).json()
        self.client.put(f"/leaves/{leave['id']}/status", headers=self.admin, json={"status": "rejected"})
        balance = self.client.get("/leaves/balance/2", headers=self.employee).json()
        self.assertEqual((balance["used"], balance["pending"], balance["remaining"]), (0, 0, 20))

    def test_management_reports_are_access_controlled_and_consistent(self):
        self.assertEqual(self.client.get("/reports/tasks", headers=self.employee).status_code, 403)
        task_report = self.client.get("/reports/tasks", headers=self.admin).json()
        self.assertEqual(task_report["total_tasks"], 2)
        self.assertEqual(task_report["by_status"]["done"], 1)
        leave_report = self.client.get("/reports/leaves", headers=self.manager).json()
        self.assertEqual(leave_report["total_requests"], 0)

    def test_legacy_duplicate_users_are_collapsed_and_records_remapped(self):
        db = main.load_db()
        db["users"].append({"id": 9, "username": " ALEX ", "password": "password", "role": "employee", "name": "Duplicate Alex"})
        db["tasks"].append({"id": 9, "title": "Preserved task", "description": "", "assignee_id": 9, "status": "todo", "priority": "low", "due_date": date.today().isoformat()})
        main.save_db(db)
        migrated = main.load_db()
        alex_accounts = [item for item in migrated["users"] if item["username"].casefold() == "alex"]
        preserved_task = next(item for item in migrated["tasks"] if item["id"] == 9)
        self.assertEqual(len(alex_accounts), 1)
        self.assertEqual(preserved_task["assignee_id"], 2)


if __name__ == "__main__":
    unittest.main()
import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

TEST_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_system.db'))
os.environ['DB_PATH'] = TEST_DB

from app.main import app
from app.database import init_db

class TaskTestCase(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        self.app = app.test_client()
        self.app.testing = True
        init_db()

        # Register employee first (will get ID 1)
        reg_emp = self.app.post('/api/auth/register', json={
            'name': 'Test Employee',
            'email': 'employee@company.com',
            'password': 'Employee@123',
            'role': 'employee',
            'department': 'Engineering'
        })
        emp_user_id = reg_emp.get_json()['user_id']

        # Register manager (will get ID 2)
        self.app.post('/api/auth/register', json={
            'name': 'Test Manager',
            'email': 'manager@company.com',
            'password': 'Manager@123',
            'role': 'manager',
            'department': 'Engineering'
        })

        res_mgr = self.app.post('/api/auth/login', json={'email': 'manager@company.com', 'password': 'Manager@123'})
        self.mgr_token = res_mgr.get_json()['token']

        res_emp = self.app.post('/api/auth/login', json={'email': 'employee@company.com', 'password': 'Employee@123'})
        self.emp_token = res_emp.get_json()['token']
        self.emp_user_id = emp_user_id

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_create_and_update_task(self):
        create_res = self.app.post('/api/tasks', headers={'Authorization': f'Bearer {self.mgr_token}'}, json={
            'title': 'Test System QA Integration',
            'description': 'Execute full suite unit and integration tests.',
            'assigned_to': self.emp_user_id,
            'priority': 'high',
            'due_date': '2026-10-15',
            'department': 'Engineering'
        })
        self.assertEqual(create_res.status_code, 201)
        task_id = create_res.get_json()['task_id']

        status_res = self.app.put(f'/api/tasks/{task_id}/status', headers={'Authorization': f'Bearer {self.emp_token}'}, json={
            'status': 'in_progress',
            'progress_percent': 50
        })
        self.assertEqual(status_res.status_code, 200)

        comment_res = self.app.post(f'/api/tasks/{task_id}/comments', headers={'Authorization': f'Bearer {self.emp_token}'}, json={
            'comment': 'Test environment configured. Starting execution.'
        })
        self.assertEqual(comment_res.status_code, 201)

if __name__ == '__main__':
    unittest.main()

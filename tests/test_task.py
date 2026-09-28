import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database import init_db

class TaskTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        init_db()

        # Login as manager
        res_mgr = self.app.post('/api/auth/login', json={'email': 'manager@company.com', 'password': 'Manager@123'})
        self.mgr_token = res_mgr.get_json()['token']

        # Login as employee
        res_emp = self.app.post('/api/auth/login', json={'email': 'employee@company.com', 'password': 'Employee@123'})
        self.emp_token = res_emp.get_json()['token']

    def test_create_and_update_task(self):
        # Create task
        create_res = self.app.post('/api/tasks', headers={'Authorization': f'Bearer {self.mgr_token}'}, json={
            'title': 'Test System QA Integration',
            'description': 'Execute full suite unit and integration tests.',
            'assigned_to': 3,
            'priority': 'high',
            'due_date': '2026-10-15',
            'department': 'Engineering'
        })
        self.assertEqual(create_res.status_code, 201)
        task_id = create_res.get_json()['task_id']

        # Employee updates status to in_progress with 50%
        status_res = self.app.put(f'/api/tasks/{task_id}/status', headers={'Authorization': f'Bearer {self.emp_token}'}, json={
            'status': 'in_progress',
            'progress_percent': 50
        })
        self.assertEqual(status_res.status_code, 200)

        # Add comment
        comment_res = self.app.post(f'/api/tasks/{task_id}/comments', headers={'Authorization': f'Bearer {self.emp_token}'}, json={
            'comment': 'Test environment configured. Starting execution.'
        })
        self.assertEqual(comment_res.status_code, 201)

if __name__ == '__main__':
    unittest.main()

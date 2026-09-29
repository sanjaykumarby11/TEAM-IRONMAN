import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

TEST_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_system.db'))
os.environ['DB_PATH'] = TEST_DB

from app.main import app
from app.database import init_db

class LeaveTestCase(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        self.app = app.test_client()
        self.app.testing = True
        init_db()

        # Register employee
        self.app.post('/api/auth/register', json={
            'name': 'Test Employee',
            'email': 'employee@company.com',
            'password': 'Employee@123',
            'role': 'employee',
            'department': 'Engineering'
        })
        res_emp = self.app.post('/api/auth/login', json={'email': 'employee@company.com', 'password': 'Employee@123'})
        self.emp_token = res_emp.get_json()['token']

        # Register manager
        self.app.post('/api/auth/register', json={
            'name': 'Test Manager',
            'email': 'manager@company.com',
            'password': 'Manager@123',
            'role': 'manager',
            'department': 'Engineering'
        })
        res_mgr = self.app.post('/api/auth/login', json={'email': 'manager@company.com', 'password': 'Manager@123'})
        self.mgr_token = res_mgr.get_json()['token']

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_get_leave_balances(self):
        response = self.app.get('/api/leave/balances', headers={'Authorization': f'Bearer {self.emp_token}'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('annual_remaining', data['balances'])

    def test_apply_and_review_leave(self):
        apply_res = self.app.post('/api/leave/apply', headers={'Authorization': f'Bearer {self.emp_token}'}, json={
            'leave_type': 'casual',
            'start_date': '2026-11-10',
            'end_date': '2026-11-11',
            'total_days': 2,
            'reason': 'Attending personal workshop',
            'emergency_contact': '+1 555-0000'
        })
        self.assertEqual(apply_res.status_code, 201)
        leave_id = apply_res.get_json()['leave_id']

        review_res = self.app.put(f'/api/leave/{leave_id}/review', headers={'Authorization': f'Bearer {self.mgr_token}'}, json={
            'status': 'approved',
            'comments': 'Approved by manager test'
        })
        self.assertEqual(review_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()

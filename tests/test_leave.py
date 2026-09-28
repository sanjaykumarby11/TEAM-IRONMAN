import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database import init_db

class LeaveTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        init_db()

        # Login as employee
        res_emp = self.app.post('/api/auth/login', json={'email': 'employee@company.com', 'password': 'Employee@123'})
        self.emp_token = res_emp.get_json()['token']

        # Login as manager
        res_mgr = self.app.post('/api/auth/login', json={'email': 'manager@company.com', 'password': 'Manager@123'})
        self.mgr_token = res_mgr.get_json()['token']

    def test_get_leave_balances(self):
        response = self.app.get('/api/leave/balances', headers={'Authorization': f'Bearer {self.emp_token}'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('annual_remaining', data['balances'])

    def test_apply_and_review_leave(self):
        # Apply leave
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

        # Manager approve leave
        review_res = self.app.put(f'/api/leave/{leave_id}/review', headers={'Authorization': f'Bearer {self.mgr_token}'}, json={
            'status': 'approved',
            'comments': 'Approved by manager test'
        })
        self.assertEqual(review_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()

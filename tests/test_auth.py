import unittest
import os
import sys

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database import get_db, init_db

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        init_db()

    def test_login_success(self):
        response = self.app.post('/api/auth/login', json={
            'email': 'admin@company.com',
            'password': 'Admin@123'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'admin')

    def test_login_invalid_password(self):
        response = self.app.post('/api/auth/login', json={
            'email': 'admin@company.com',
            'password': 'WrongPassword'
        })
        self.assertEqual(response.status_code, 401)

    def test_register_employee(self):
        response = self.app.post('/api/auth/register', json={
            'name': 'Test New Employee',
            'email': 'new.employee@company.com',
            'password': 'Password@123',
            'role': 'employee',
            'department': 'Engineering',
            'designation': 'QA Engineer'
        })
        self.assertEqual(response.status_code, 201)

        # Login with newly registered employee
        login_res = self.app.post('/api/auth/login', json={
            'email': 'new.employee@company.com',
            'password': 'Password@123'
        })
        self.assertEqual(login_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()

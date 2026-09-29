import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

TEST_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_system.db'))
os.environ['DB_PATH'] = TEST_DB

from app.main import app
from app.database import init_db

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        self.app = app.test_client()
        self.app.testing = True
        init_db()

        # Create test admin
        self.app.post('/api/auth/register', json={
            'name': 'Test Admin',
            'email': 'admin@company.com',
            'password': 'Admin@123',
            'role': 'admin',
            'department': 'HR & Management',
            'designation': 'Chief HR Officer'
        })

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

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

        login_res = self.app.post('/api/auth/login', json={
            'email': 'new.employee@company.com',
            'password': 'Password@123'
        })
        self.assertEqual(login_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()

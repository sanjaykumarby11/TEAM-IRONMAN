from app.models.user import UserModel
from app.utils.security import verify_password, hash_password
from app.utils.jwt_handler import generate_token

class AuthService:
    @staticmethod
    def login(email, password):
        user = UserModel.get_by_email(email)
        if not user or not verify_password(user['password_hash'], password):
            return False, "Invalid email or password.", None

        if user['status'] != 'active':
            return False, "Account is inactive. Please contact HR administrator.", None

        token = generate_token(user)
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'department': user['department'],
            'designation': user['designation'],
            'phone': user['phone'],
            'avatar_url': user['avatar_url']
        }
        return True, token, user_data

    @staticmethod
    def register(name, email, password, role='employee', department='General', designation='Staff', phone=''):
        if UserModel.get_by_email(email):
            return False, "An account with this email already exists.", None

        if role not in ['employee', 'manager', 'admin']:
            role = 'employee'

        pw_hash = hash_password(password)
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"
        user_id = UserModel.create(name, email, pw_hash, role, department, designation, phone, avatar)
        return True, "Employee registered successfully", user_id

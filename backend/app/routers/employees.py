from flask import Blueprint, request, jsonify
from app.utils.jwt_handler import admin_required, manager_or_admin_required
from app.utils.security import hash_password
from app.models.user import UserModel

employees_bp = Blueprint('employees', __name__, url_prefix='/api/employees')

@employees_bp.route('', methods=['GET'])
@manager_or_admin_required
def list_employees(current_user):
    users = UserModel.get_all()
    return jsonify({'employees': users}), 200

@employees_bp.route('', methods=['POST'])
@admin_required
def create_employee_admin(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', 'Welcome@123')
    role = data.get('role', 'employee')
    department = data.get('department', 'Engineering')
    designation = data.get('designation', 'Software Engineer')
    phone = data.get('phone', '')
    avatar_url = data.get('avatar_url', f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}")

    if not name or not email:
        return jsonify({'error': 'Name and email are required.'}), 400

    if UserModel.get_by_email(email):
        return jsonify({'error': 'Employee email already exists.'}), 409

    pw_hash = hash_password(password)
    user_id = UserModel.create(name, email, pw_hash, role, department, designation, phone, avatar_url)
    return jsonify({'message': 'Employee created successfully', 'user_id': user_id}), 201

@employees_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_employee_admin(current_user, user_id):
    data = request.get_json() or {}
    role = data.get('role', 'employee')
    status = data.get('status', 'active')
    department = data.get('department', 'General')
    designation = data.get('designation', 'Staff')

    if role not in ['employee', 'manager', 'admin']:
        return jsonify({'error': 'Invalid role specified.'}), 400

    UserModel.update_role_status(user_id, role, status, department, designation)
    return jsonify({'message': 'Employee details updated successfully'}), 200

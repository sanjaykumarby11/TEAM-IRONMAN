from flask import Blueprint, request, jsonify
from app.utils.jwt_handler import login_required
from app.utils.security import hash_password, verify_password
from app.services.auth_service import AuthService
from app.schemas.auth_schema import AuthSchema
from app.models.user import UserModel

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    valid, err_msg = AuthSchema.validate_login(data)
    if not valid:
        return jsonify({'error': err_msg}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    success, token_or_err, user_data = AuthService.login(email, password)
    if not success:
        code = 403 if "inactive" in token_or_err else 401
        return jsonify({'error': token_or_err}), code

    return jsonify({'message': 'Login successful', 'token': token_or_err, 'user': user_data}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    valid, err_msg = AuthSchema.validate_register(data)
    if not valid:
        return jsonify({'error': err_msg}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    department = data.get('department', 'General').strip()
    designation = data.get('designation', 'Employee').strip()
    phone = data.get('phone', '').strip()
    role = data.get('role', 'employee')

    success, msg, user_id = AuthService.register(name, email, password, role, department, designation, phone)
    if not success:
        return jsonify({'error': msg}), 409

    return jsonify({'message': msg, 'user_id': user_id}), 201

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_me(current_user):
    user = UserModel.get_by_id(current_user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user}), 200

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    designation = data.get('designation', '').strip()
    avatar_url = data.get('avatar_url', '').strip()

    if not name:
        return jsonify({'error': 'Name cannot be empty.'}), 400

    UserModel.update_profile(current_user['user_id'], name, phone, designation, avatar_url)
    updated_user = UserModel.get_by_id(current_user['user_id'])
    return jsonify({'message': 'Profile updated successfully', 'user': updated_user}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@login_required
def change_password(current_user):
    data = request.get_json() or {}
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')

    if not current_pw or not new_pw:
        return jsonify({'error': 'Current and new password are required.'}), 400

    user = UserModel.get_by_email(current_user['email'])
    if not verify_password(user['password_hash'], current_pw):
        return jsonify({'error': 'Current password is incorrect.'}), 400

    new_hash = hash_password(new_pw)
    UserModel.update_password(current_user['user_id'], new_hash)
    return jsonify({'message': 'Password updated successfully'}), 200

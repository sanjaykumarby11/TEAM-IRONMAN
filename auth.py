import datetime
import jwt
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

SECRET_KEY = "employee-leave-task-mgmt-system-super-secret-key-2026"

def hash_password(password):
    return generate_password_hash(password)

def verify_password(hashed_password, password):
    return check_password_hash(hashed_password, password)

def generate_token(user):
    payload = {
        'user_id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'role': user['role'],
        'department': user['department'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_from_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    token = parts[1]
    return decode_token(token)

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({'error': 'Authentication required. Missing or invalid token.'}), 401
        return f(current_user=user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        if user['role'] != 'admin':
            return jsonify({'error': 'Forbidden. Administrator privileges required.'}), 403
        return f(current_user=user, *args, **kwargs)
    return decorated

def manager_or_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({'error': 'Authentication required.'}), 401
        if user['role'] not in ['admin', 'manager']:
            return jsonify({'error': 'Forbidden. Manager or Administrator privileges required.'}), 403
        return f(current_user=user, *args, **kwargs)
    return decorated

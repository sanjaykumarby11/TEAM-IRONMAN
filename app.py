import io
import csv
from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
from database import init_db
from auth import (
    hash_password, verify_password, generate_token,
    login_required, admin_required, manager_or_admin_required
)
from models import (
    UserModel, LeaveModel, TaskModel, NotificationModel, AnalyticsModel
)

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Ensure DB is initialized on app startup
init_db()

# --- AUTHENTICATION ENDPOINTS ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = UserModel.get_by_email(email)
    if not user or not verify_password(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    if user['status'] != 'active':
        return jsonify({'error': 'Account is inactive. Please contact HR administrator.'}), 403

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
    return jsonify({'message': 'Login successful', 'token': token, 'user': user_data}), 200


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    department = data.get('department', 'General').strip()
    designation = data.get('designation', 'Employee').strip()
    phone = data.get('phone', '').strip()
    role = data.get('role', 'employee')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if UserModel.get_by_email(email):
        return jsonify({'error': 'An account with this email already exists.'}), 409

    if role not in ['employee', 'manager', 'admin']:
        role = 'employee'

    pw_hash = hash_password(password)
    avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"
    user_id = UserModel.create(name, email, pw_hash, role, department, designation, phone, avatar)

    return jsonify({'message': 'Employee registered successfully', 'user_id': user_id}), 201


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_me(current_user):
    user = UserModel.get_by_id(current_user['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user}), 200


@app.route('/api/auth/profile', methods=['PUT'])
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


@app.route('/api/auth/change-password', methods=['PUT'])
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


# --- EMPLOYEE MANAGEMENT ENDPOINTS ---

@app.route('/api/employees', methods=['GET'])
@manager_or_admin_required
def list_employees(current_user):
    users = UserModel.get_all()
    return jsonify({'employees': users}), 200


@app.route('/api/employees', methods=['POST'])
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


@app.route('/api/employees/<int:user_id>', methods=['PUT'])
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


# --- LEAVE MANAGEMENT ENDPOINTS ---

@app.route('/api/leave/balances', methods=['GET'])
@login_required
def get_leave_balances(current_user):
    balances = LeaveModel.get_balances(current_user['user_id'])
    return jsonify({'balances': balances}), 200


@app.route('/api/leave/my-requests', methods=['GET'])
@login_required
def get_my_leave_requests(current_user):
    history = LeaveModel.get_user_history(current_user['user_id'])
    return jsonify({'leave_requests': history}), 200


@app.route('/api/leave/apply', methods=['POST'])
@login_required
def apply_leave(current_user):
    data = request.get_json() or {}
    leave_type = data.get('leave_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    total_days = data.get('total_days')
    reason = data.get('reason', '').strip()
    emergency_contact = data.get('emergency_contact', '').strip()

    if not leave_type or not start_date or not end_date or not total_days or not reason:
        return jsonify({'error': 'All leave application fields are required.'}), 400

    try:
        total_days = int(total_days)
        if total_days <= 0:
            return jsonify({'error': 'Total leave days must be greater than 0.'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid total days format.'}), 400

    # Check leave balances for annual, sick, casual, maternity
    balances = LeaveModel.get_balances(current_user['user_id'])
    rem_key = f"{leave_type}_remaining"
    if rem_key in balances and balances[rem_key] < total_days:
        return jsonify({'error': f'Insufficient {leave_type} leave balance. Available: {balances[rem_key]} days, Requested: {total_days} days.'}), 400

    req_id = LeaveModel.create_request(
        current_user['user_id'], leave_type, start_date, end_date, total_days, reason, emergency_contact
    )
    return jsonify({'message': 'Leave application submitted successfully', 'leave_id': req_id}), 201


@app.route('/api/leave/all', methods=['GET'])
@manager_or_admin_required
def list_all_leaves(current_user):
    status = request.args.get('status', 'all')
    requests = LeaveModel.get_all_requests(status)
    return jsonify({'leave_requests': requests}), 200


@app.route('/api/leave/<int:leave_id>/review', methods=['PUT'])
@manager_or_admin_required
def review_leave(current_user, leave_id):
    data = request.get_json() or {}
    status = data.get('status')
    comments = data.get('comments', '').strip()

    if status not in ['approved', 'rejected']:
        return jsonify({'error': 'Status must be either approved or rejected.'}), 400

    success, msg = LeaveModel.review_request(leave_id, current_user['user_id'], status, comments)
    if not success:
        return jsonify({'error': msg}), 400

    return jsonify({'message': msg}), 200


@app.route('/api/leave/<int:leave_id>/cancel', methods=['POST'])
@login_required
def cancel_leave(current_user, leave_id):
    success, msg = LeaveModel.cancel_request(leave_id, current_user['user_id'])
    if not success:
        return jsonify({'error': msg}), 400
    return jsonify({'message': msg}), 200


# --- TASK MANAGEMENT ENDPOINTS ---

@app.route('/api/tasks', methods=['GET'])
@login_required
def list_tasks(current_user):
    status = request.args.get('status', 'all')
    priority = request.args.get('priority', 'all')
    department = request.args.get('department', 'all')
    scope = request.args.get('scope', 'all')

    user_filter = None
    if current_user['role'] == 'employee' or scope == 'my_tasks':
        user_filter = current_user['user_id']

    tasks = TaskModel.get_all(department=department, status=status, priority=priority, user_id=user_filter)
    return jsonify({'tasks': tasks}), 200


@app.route('/api/tasks', methods=['POST'])
@manager_or_admin_required
def create_task(current_user):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    assigned_to = data.get('assigned_to')
    priority = data.get('priority', 'medium')
    due_date = data.get('due_date')
    department = data.get('department', current_user.get('department', 'General'))

    if not title or not assigned_to or not due_date:
        return jsonify({'error': 'Title, assigned employee, and due date are required.'}), 400

    try:
        assigned_to = int(assigned_to)
    except ValueError:
        return jsonify({'error': 'Invalid assignee ID.'}), 400

    task_id = TaskModel.create(
        title, description, current_user['user_id'], assigned_to, priority, due_date, department
    )
    return jsonify({'message': 'Task created and assigned successfully', 'task_id': task_id}), 201


@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(current_user, task_id):
    task = TaskModel.get_by_id(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    comments = TaskModel.get_comments(task_id)
    return jsonify({'task': task, 'comments': comments}), 200


@app.route('/api/tasks/<int:task_id>/status', methods=['PUT'])
@login_required
def update_task_status(current_user, task_id):
    data = request.get_json() or {}
    status = data.get('status')
    progress_percent = data.get('progress_percent')

    if not status or progress_percent is None:
        return jsonify({'error': 'Status and progress percentage are required.'}), 400

    try:
        progress_percent = int(progress_percent)
        if progress_percent < 0 or progress_percent > 100:
            return jsonify({'error': 'Progress percentage must be between 0 and 100.'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid progress percent.'}), 400

    success, msg = TaskModel.update_status_progress(task_id, status, progress_percent, current_user['user_id'])
    if not success:
        return jsonify({'error': msg}), 400

    return jsonify({'message': msg}), 200


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@manager_or_admin_required
def update_task_details(current_user, task_id):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    assigned_to = data.get('assigned_to')
    priority = data.get('priority', 'medium')
    status = data.get('status', 'to_do')
    progress_percent = data.get('progress_percent', 0)
    due_date = data.get('due_date')
    department = data.get('department', 'General')

    if not title or not assigned_to or not due_date:
        return jsonify({'error': 'Title, assignee, and due date are required.'}), 400

    TaskModel.update_details(
        task_id, title, description, int(assigned_to), priority, status, int(progress_percent), due_date, department
    )
    return jsonify({'message': 'Task details updated successfully'}), 200


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@manager_or_admin_required
def delete_task(current_user, task_id):
    TaskModel.delete(task_id)
    return jsonify({'message': 'Task deleted successfully'}), 200


@app.route('/api/tasks/<int:task_id>/comments', methods=['POST'])
@login_required
def add_task_comment(current_user, task_id):
    data = request.get_json() or {}
    comment = data.get('comment', '').strip()

    if not comment:
        return jsonify({'error': 'Comment content cannot be empty.'}), 400

    comment_id = TaskModel.add_comment(task_id, current_user['user_id'], comment)
    return jsonify({'message': 'Comment added', 'comment_id': comment_id}), 201


# --- NOTIFICATIONS ENDPOINTS ---

@app.route('/api/notifications', methods=['GET'])
@login_required
def list_notifications(current_user):
    notifications = NotificationModel.get_user_notifications(current_user['user_id'])
    return jsonify({'notifications': notifications}), 200


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(current_user, notification_id):
    NotificationModel.mark_read(notification_id, current_user['user_id'])
    return jsonify({'message': 'Notification marked as read'}), 200


@app.route('/api/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read(current_user):
    NotificationModel.mark_all_read(current_user['user_id'])
    return jsonify({'message': 'All notifications marked as read'}), 200


# --- ANALYTICS & REPORTS ENDPOINTS ---

@app.route('/api/analytics/dashboard', methods=['GET'])
@login_required
def get_analytics(current_user):
    summary = AnalyticsModel.get_system_summary()
    return jsonify({'summary': summary}), 200


@app.route('/api/reports/leave/export', methods=['GET'])
@manager_or_admin_required
def export_leave_report(current_user):
    fmt = request.args.get('format', 'csv')
    requests = LeaveModel.get_all_requests()

    if fmt == 'json':
        return jsonify({'leave_report': requests}), 200

    # CSV Export
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Leave ID', 'Employee Name', 'Email', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Reviewer'])

    for req in requests:
        writer.writerow([
            req['id'], req['employee_name'], req['employee_email'], req['department'],
            req['leave_type'], req['start_date'], req['end_date'], req['total_days'],
            req['status'], req['reason'], req['reviewer_name'] or 'N/A'
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=leave_report.csv'}
    )


@app.route('/api/reports/task/export', methods=['GET'])
@manager_or_admin_required
def export_task_report(current_user):
    fmt = request.args.get('format', 'csv')
    tasks = TaskModel.get_all()

    if fmt == 'json':
        return jsonify({'task_report': tasks}), 200

    # CSV Export
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Task ID', 'Title', 'Assignee', 'Creator', 'Priority', 'Status', 'Progress %', 'Due Date', 'Department'])

    for t in tasks:
        writer.writerow([
            t['id'], t['title'], t['assignee_name'], t['creator_name'],
            t['priority'], t['status'], t['progress_percent'], t['due_date'], t['department']
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=task_report.csv'}
    )


# --- SPA FRONTEND ROUTE ---

@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)

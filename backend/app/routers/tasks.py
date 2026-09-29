from flask import Blueprint, request, jsonify
from app.utils.jwt_handler import login_required, manager_or_admin_required
from app.schemas.task_schema import TaskSchema
from app.services.task_service import TaskService
from app.models.task import TaskModel

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api/tasks')

@tasks_bp.route('', methods=['GET'])
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

@tasks_bp.route('', methods=['POST'])
@manager_or_admin_required
def create_task(current_user):
    data = request.get_json() or {}
    valid, err_msg = TaskSchema.validate_create(data)
    if not valid:
        return jsonify({'error': err_msg}), 400

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    assigned_to = data.get('assigned_to')
    priority = data.get('priority', 'medium')
    due_date = data.get('due_date')
    department = data.get('department', current_user.get('department', 'General'))

    success, task_id = TaskService.create_task(
        title, description, current_user['user_id'], assigned_to, priority, due_date, department
    )
    return jsonify({'message': 'Task created and assigned successfully', 'task_id': task_id}), 201

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@login_required
def get_task(current_user, task_id):
    task = TaskModel.get_by_id(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    comments = TaskModel.get_comments(task_id)
    return jsonify({'task': task, 'comments': comments}), 200

@tasks_bp.route('/<int:task_id>/status', methods=['PUT'])
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

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
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

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@manager_or_admin_required
def delete_task(current_user, task_id):
    TaskModel.delete(task_id)
    return jsonify({'message': 'Task deleted successfully'}), 200

@tasks_bp.route('/<int:task_id>/comments', methods=['POST'])
@login_required
def add_task_comment(current_user, task_id):
    data = request.get_json() or {}
    comment = data.get('comment', '').strip()

    if not comment:
        return jsonify({'error': 'Comment content cannot be empty.'}), 400

    comment_id = TaskModel.add_comment(task_id, current_user['user_id'], comment)
    return jsonify({'message': 'Comment added', 'comment_id': comment_id}), 201

from flask import Blueprint, request, jsonify
from app.utils.jwt_handler import login_required, manager_or_admin_required
from app.schemas.leave_schema import LeaveSchema
from app.services.leave_service import LeaveService
from app.models.leave import LeaveModel

leave_bp = Blueprint('leave', __name__, url_prefix='/api/leave')

@leave_bp.route('/balances', methods=['GET'])
@login_required
def get_leave_balances(current_user):
    balances = LeaveModel.get_balances(current_user['user_id'])
    return jsonify({'balances': balances}), 200

@leave_bp.route('/my-requests', methods=['GET'])
@login_required
def get_my_leave_requests(current_user):
    history = LeaveModel.get_user_history(current_user['user_id'])
    return jsonify({'leave_requests': history}), 200

@leave_bp.route('/apply', methods=['POST'])
@login_required
def apply_leave(current_user):
    data = request.get_json() or {}
    valid, err_msg = LeaveSchema.validate_apply(data)
    if not valid:
        return jsonify({'error': err_msg}), 400

    leave_type = data.get('leave_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    total_days = data.get('total_days')
    reason = data.get('reason', '').strip()
    emergency_contact = data.get('emergency_contact', '').strip()

    success, result = LeaveService.apply_leave(
        current_user['user_id'], leave_type, start_date, end_date, total_days, reason, emergency_contact
    )
    if not success:
        return jsonify({'error': result}), 400

    return jsonify({'message': 'Leave application submitted successfully', 'leave_id': result}), 201

@leave_bp.route('/all', methods=['GET'])
@manager_or_admin_required
def list_all_leaves(current_user):
    status = request.args.get('status', 'all')
    requests = LeaveModel.get_all_requests(status)
    return jsonify({'leave_requests': requests}), 200

@leave_bp.route('/<int:leave_id>/review', methods=['PUT'])
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

@leave_bp.route('/<int:leave_id>/cancel', methods=['POST'])
@login_required
def cancel_leave(current_user, leave_id):
    success, msg = LeaveModel.cancel_request(leave_id, current_user['user_id'])
    if not success:
        return jsonify({'error': msg}), 400
    return jsonify({'message': msg}), 200

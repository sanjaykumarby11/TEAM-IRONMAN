from flask import Blueprint, jsonify
from app.utils.jwt_handler import login_required
from app.models.notification import NotificationModel

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@login_required
def list_notifications(current_user):
    notifications = NotificationModel.get_user_notifications(current_user['user_id'])
    return jsonify({'notifications': notifications}), 200

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(current_user, notification_id):
    NotificationModel.mark_read(notification_id, current_user['user_id'])
    return jsonify({'message': 'Notification marked as read'}), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read(current_user):
    NotificationModel.mark_all_read(current_user['user_id'])
    return jsonify({'message': 'All notifications marked as read'}), 200

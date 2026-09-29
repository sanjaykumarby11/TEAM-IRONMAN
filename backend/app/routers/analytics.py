from flask import Blueprint, jsonify
from app.utils.jwt_handler import login_required
from app.models.analytics import AnalyticsModel

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/dashboard', methods=['GET'])
@login_required
def get_analytics(current_user):
    summary = AnalyticsModel.get_system_summary()
    return jsonify({'summary': summary}), 200

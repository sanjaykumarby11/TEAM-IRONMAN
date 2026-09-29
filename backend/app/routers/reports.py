import io
import csv
from flask import Blueprint, request, jsonify, Response
from app.utils.jwt_handler import manager_or_admin_required
from app.models.leave import LeaveModel
from app.models.task import TaskModel

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/leave/export', methods=['GET'])
@manager_or_admin_required
def export_leave_report(current_user):
    fmt = request.args.get('format', 'csv')
    requests = LeaveModel.get_all_requests()

    if fmt == 'json':
        return jsonify({'leave_report': requests}), 200

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

@reports_bp.route('/task/export', methods=['GET'])
@manager_or_admin_required
def export_task_report(current_user):
    fmt = request.args.get('format', 'csv')
    tasks = TaskModel.get_all()

    if fmt == 'json':
        return jsonify({'task_report': tasks}), 200

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

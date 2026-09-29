from app.routers.auth import auth_bp
from app.routers.employees import employees_bp
from app.routers.leave import leave_bp
from app.routers.tasks import tasks_bp
from app.routers.notifications import notifications_bp
from app.routers.analytics import analytics_bp
from app.routers.reports import reports_bp

__all__ = ['auth_bp', 'employees_bp', 'leave_bp', 'tasks_bp', 'notifications_bp', 'analytics_bp', 'reports_bp']

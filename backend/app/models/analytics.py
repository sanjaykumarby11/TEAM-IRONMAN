from app.database import get_db

class AnalyticsModel:
    @staticmethod
    def get_system_summary():
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users WHERE status = 'active'")
        total_employees = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'")
        pending_leaves = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM leave_requests WHERE status = 'approved'")
        approved_leaves = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'completed'")
        completed_tasks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'in_progress'")
        in_progress_tasks = cursor.fetchone()[0]

        cursor.execute("""
            SELECT department, COUNT(*) as count
            FROM users
            GROUP BY department
        """)
        dept_breakdown = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM tasks
            GROUP BY status
        """)
        task_status_dist = [dict(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT leave_type, COUNT(*) as count
            FROM leave_requests
            GROUP BY leave_type
        """)
        leave_type_dist = [dict(row) for row in cursor.fetchall()]

        conn.close()

        return {
            'total_employees': total_employees,
            'pending_leaves': pending_leaves,
            'approved_leaves': approved_leaves,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'dept_breakdown': dept_breakdown,
            'task_status_dist': task_status_dist,
            'leave_type_dist': leave_type_dist
        }

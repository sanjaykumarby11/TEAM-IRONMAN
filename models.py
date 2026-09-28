from database import get_db
import datetime

class UserModel:
    @staticmethod
    def get_by_email(email):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def get_by_id(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, department, designation, phone, avatar_url, status, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def get_all():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role, u.department, u.designation, u.phone, u.avatar_url, u.status, u.created_at,
                   b.annual_leave_allocated, b.annual_leave_used, b.sick_leave_allocated, b.sick_leave_used
            FROM users u
            LEFT JOIN leave_balances b ON u.id = b.user_id
            ORDER BY u.name ASC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def create(name, email, password_hash, role='employee', department='General', designation='Staff', phone='', avatar_url=''):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role, department, designation, phone, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, email, password_hash, role, department, designation, phone, avatar_url))
        user_id = cursor.lastrowid

        # Initialize leave balance
        cursor.execute("""
            INSERT INTO leave_balances (user_id, annual_leave_allocated, annual_leave_used, sick_leave_allocated, sick_leave_used, casual_leave_allocated, casual_leave_used)
            VALUES (?, 20, 0, 10, 0, 8, 0)
        """, (user_id,))

        conn.commit()
        conn.close()
        return user_id

    @staticmethod
    def update_profile(user_id, name, phone, designation, avatar_url):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users
            SET name = ?, phone = ?, designation = ?, avatar_url = ?
            WHERE id = ?
        """, (name, phone, designation, avatar_url, user_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def update_password(user_id, password_hash):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def update_role_status(user_id, role, status, department, designation):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users
            SET role = ?, status = ?, department = ?, designation = ?
            WHERE id = ?
        """, (role, status, department, designation, user_id))
        conn.commit()
        conn.close()
        return True


class LeaveModel:
    @staticmethod
    def get_balances(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leave_balances WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return {
                'annual_leave_allocated': 20, 'annual_leave_used': 0, 'annual_remaining': 20,
                'sick_leave_allocated': 10, 'sick_leave_used': 0, 'sick_remaining': 10,
                'casual_leave_allocated': 8, 'casual_leave_used': 0, 'casual_remaining': 8,
                'maternity_leave_allocated': 90, 'maternity_leave_used': 0, 'maternity_remaining': 90,
                'unpaid_leave_used': 0
            }
        data = dict(row)
        data['annual_remaining'] = max(0, data['annual_leave_allocated'] - data['annual_leave_used'])
        data['sick_remaining'] = max(0, data['sick_leave_allocated'] - data['sick_leave_used'])
        data['casual_remaining'] = max(0, data['casual_leave_allocated'] - data['casual_leave_used'])
        data['maternity_remaining'] = max(0, data['maternity_leave_allocated'] - data['maternity_leave_used'])
        return data

    @staticmethod
    def create_request(user_id, leave_type, start_date, end_date, total_days, reason, emergency_contact):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, emergency_contact, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (user_id, leave_type, start_date, end_date, total_days, reason, emergency_contact))
        req_id = cursor.lastrowid
        conn.commit()

        # Notify managers/admins
        cursor.execute("SELECT id FROM users WHERE role IN ('admin', 'manager')")
        reviewers = cursor.fetchall()
        for rev in reviewers:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, 'New Leave Request', 'A new leave request requires your review.', 'leave')
            """, (rev['id'],))
        
        conn.commit()
        conn.close()
        return req_id

    @staticmethod
    def get_user_history(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT l.*, r.name as reviewer_name
            FROM leave_requests l
            LEFT JOIN users r ON l.reviewed_by = r.id
            WHERE l.user_id = ?
            ORDER BY l.created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def get_all_requests(status=None):
        conn = get_db()
        cursor = conn.cursor()
        query = """
            SELECT l.*, u.name as employee_name, u.email as employee_email, u.department, u.avatar_url,
                   r.name as reviewer_name
            FROM leave_requests l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN users r ON l.reviewed_by = r.id
        """
        params = []
        if status and status != 'all':
            query += " WHERE l.status = ?"
            params.append(status)
        
        query += " ORDER BY l.created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def review_request(leave_id, reviewer_id, status, comments):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leave_requests WHERE id = ?", (leave_id,))
        leave_req = cursor.fetchone()
        if not leave_req:
            conn.close()
            return False, "Leave request not found"

        leave_req = dict(leave_req)
        prev_status = leave_req['status']

        cursor.execute("""
            UPDATE leave_requests
            SET status = ?, reviewed_by = ?, reviewer_comments = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, reviewer_id, comments, leave_id))

        # Update leave balances if approved
        if status == 'approved' and prev_status != 'approved':
            l_type = leave_req['leave_type']
            days = leave_req['total_days']
            col_map = {
                'annual': 'annual_leave_used',
                'sick': 'sick_leave_used',
                'casual': 'casual_leave_used',
                'maternity': 'maternity_leave_used',
                'unpaid': 'unpaid_leave_used'
            }
            if l_type in col_map:
                col = col_map[l_type]
                cursor.execute(f"UPDATE leave_balances SET {col} = {col} + ? WHERE user_id = ?", (days, leave_req['user_id']))

        # If previously approved and now rejected or cancelled, deduct back used
        elif prev_status == 'approved' and status in ['rejected', 'cancelled']:
            l_type = leave_req['leave_type']
            days = leave_req['total_days']
            col_map = {
                'annual': 'annual_leave_used',
                'sick': 'sick_leave_used',
                'casual': 'casual_leave_used',
                'maternity': 'maternity_leave_used',
                'unpaid': 'unpaid_leave_used'
            }
            if l_type in col_map:
                col = col_map[l_type]
                cursor.execute(f"UPDATE leave_balances SET {col} = MAX(0, {col} - ?) WHERE user_id = ?", (days, leave_req['user_id']))

        # Create notification for employee
        status_msg = f"Your leave request from {leave_req['start_date']} to {leave_req['end_date']} was {status}."
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, 'leave')
        """, (leave_req['user_id'], f"Leave Request {status.capitalize()}", status_msg))

        conn.commit()
        conn.close()
        return True, "Leave request updated successfully"

    @staticmethod
    def cancel_request(leave_id, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leave_requests WHERE id = ? AND user_id = ?", (leave_id, user_id))
        leave_req = cursor.fetchone()
        if not leave_req:
            conn.close()
            return False, "Leave request not found or unauthorized"
        
        leave_req = dict(leave_req)
        if leave_req['status'] not in ['pending', 'approved']:
            conn.close()
            return False, "Only pending or approved leaves can be cancelled"

        if leave_req['status'] == 'approved':
            l_type = leave_req['leave_type']
            days = leave_req['total_days']
            col_map = {
                'annual': 'annual_leave_used',
                'sick': 'sick_leave_used',
                'casual': 'casual_leave_used',
                'maternity': 'maternity_leave_used',
                'unpaid': 'unpaid_leave_used'
            }
            if l_type in col_map:
                col = col_map[l_type]
                cursor.execute(f"UPDATE leave_balances SET {col} = MAX(0, {col} - ?) WHERE user_id = ?", (days, user_id))

        cursor.execute("UPDATE leave_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (leave_id,))
        conn.commit()
        conn.close()
        return True, "Leave request cancelled successfully"


class TaskModel:
    @staticmethod
    def create(title, description, created_by, assigned_to, priority, due_date, department='General'):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (title, description, created_by, assigned_to, priority, status, progress_percent, due_date, department)
            VALUES (?, ?, ?, ?, ?, 'to_do', 0, ?, ?)
        """, (title, description, created_by, assigned_to, priority, due_date, department))
        task_id = cursor.lastrowid

        # Notify assigned employee
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'New Task Assigned', ?, 'task')
        """, (assigned_to, f"You have been assigned a new task: {title}"))

        conn.commit()
        conn.close()
        return task_id

    @staticmethod
    def get_all(department=None, status=None, priority=None, user_id=None):
        conn = get_db()
        cursor = conn.cursor()
        query = """
            SELECT t.*, u_assign.name as assignee_name, u_assign.email as assignee_email, u_assign.avatar_url as assignee_avatar,
                   u_creator.name as creator_name
            FROM tasks t
            JOIN users u_assign ON t.assigned_to = u_assign.id
            JOIN users u_creator ON t.created_by = u_creator.id
            WHERE 1=1
        """
        params = []
        if user_id:
            query += " AND (t.assigned_to = ? OR t.created_by = ?)"
            params.extend([user_id, user_id])
        if status and status != 'all':
            query += " AND t.status = ?"
            params.append(status)
        if priority and priority != 'all':
            query += " AND t.priority = ?"
            params.append(priority)
        if department and department != 'all':
            query += " AND t.department = ?"
            params.append(department)

        query += " ORDER BY t.created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_id(task_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, u_assign.name as assignee_name, u_assign.email as assignee_email, u_assign.avatar_url as assignee_avatar,
                   u_creator.name as creator_name
            FROM tasks t
            JOIN users u_assign ON t.assigned_to = u_assign.id
            JOIN users u_creator ON t.created_by = u_creator.id
            WHERE t.id = ?
        """, (task_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def update_status_progress(task_id, status, progress_percent, updated_by_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        if not task:
            conn.close()
            return False, "Task not found"

        task = dict(task)
        # If progress is 100%, set status to completed automatically
        if progress_percent == 100 and status != 'completed':
            status = 'completed'
        elif status == 'completed' and progress_percent < 100:
            progress_percent = 100

        cursor.execute("""
            UPDATE tasks
            SET status = ?, progress_percent = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, progress_percent, task_id))

        # Notify task creator if someone else updated it
        if task['created_by'] != updated_by_id:
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, 'Task Status Updated', ?, 'task')
            """, (task['created_by'], f"Task '{task['title']}' status updated to {status} ({progress_percent}%)."))

        conn.commit()
        conn.close()
        return True, "Task updated successfully"

    @staticmethod
    def update_details(task_id, title, description, assigned_to, priority, status, progress_percent, due_date, department):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks
            SET title = ?, description = ?, assigned_to = ?, priority = ?, status = ?, progress_percent = ?, due_date = ?, department = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title, description, assigned_to, priority, status, progress_percent, due_date, department, task_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def delete(task_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def add_comment(task_id, user_id, comment):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO task_comments (task_id, user_id, comment)
            VALUES (?, ?, ?)
        """, (task_id, user_id, comment))
        comment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return comment_id

    @staticmethod
    def get_comments(task_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
            FROM task_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC
        """, (task_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]


class NotificationModel:
    @staticmethod
    def get_user_notifications(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 30
        """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def mark_read(notification_id, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notification_id, user_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def mark_all_read(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True


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

        # Breakdown by Department
        cursor.execute("""
            SELECT department, COUNT(*) as count
            FROM users
            GROUP BY department
        """)
        dept_breakdown = [dict(row) for row in cursor.fetchall()]

        # Task Status Distribution
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM tasks
            GROUP BY status
        """)
        task_status_dist = [dict(row) for row in cursor.fetchall()]

        # Leave Status Distribution
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

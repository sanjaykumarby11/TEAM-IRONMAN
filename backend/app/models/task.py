from app.database import get_db

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
        if progress_percent == 100 and status != 'completed':
            status = 'completed'
        elif status == 'completed' and progress_percent < 100:
            progress_percent = 100

        cursor.execute("""
            UPDATE tasks
            SET status = ?, progress_percent = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, progress_percent, task_id))

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

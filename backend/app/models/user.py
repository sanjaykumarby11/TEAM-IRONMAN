from app.database import get_db

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

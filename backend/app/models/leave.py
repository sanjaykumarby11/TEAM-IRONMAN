from app.database import get_db

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

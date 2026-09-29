from app.models.leave import LeaveModel

class LeaveService:
    @staticmethod
    def apply_leave(user_id, leave_type, start_date, end_date, total_days, reason, emergency_contact):
        balances = LeaveModel.get_balances(user_id)
        rem_key = f"{leave_type}_remaining"
        if rem_key in balances and balances[rem_key] < int(total_days):
            return False, f"Insufficient {leave_type} leave balance. Available: {balances[rem_key]} days, Requested: {total_days} days."

        req_id = LeaveModel.create_request(user_id, leave_type, start_date, end_date, int(total_days), reason, emergency_contact)
        return True, req_id

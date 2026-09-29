class LeaveSchema:
    @staticmethod
    def validate_apply(data):
        leave_type = data.get('leave_type')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        total_days = data.get('total_days')
        reason = data.get('reason', '').strip()

        if not leave_type or not start_date or not end_date or not total_days or not reason:
            return False, "All leave application fields are required."

        try:
            total_days = int(total_days)
            if total_days <= 0:
                return False, "Total leave days must be greater than 0."
        except ValueError:
            return False, "Invalid total days format."

        return True, None

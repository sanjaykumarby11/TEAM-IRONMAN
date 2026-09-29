class TaskSchema:
    @staticmethod
    def validate_create(data):
        title = data.get('title', '').strip()
        assigned_to = data.get('assigned_to')
        due_date = data.get('due_date')

        if not title or not assigned_to or not due_date:
            return False, "Title, assigned employee, and due date are required."

        try:
            int(assigned_to)
        except ValueError:
            return False, "Invalid assignee ID."

        return True, None

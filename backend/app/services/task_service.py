from app.models.task import TaskModel

class TaskService:
    @staticmethod
    def create_task(title, description, created_by, assigned_to, priority, due_date, department):
        task_id = TaskModel.create(title, description, created_by, int(assigned_to), priority, due_date, department)
        return True, task_id

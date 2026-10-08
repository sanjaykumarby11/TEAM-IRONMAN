from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Priority(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"


class TaskStatus(str, Enum):
    pending = "Pending"
    in_progress = "In Progress"
    completed = "Completed"
    blocked = "Blocked"


class TaskInput(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=5000)
    employee_id: int = Field(gt=0)
    priority: Priority
    deadline: date
    status: TaskStatus = TaskStatus.pending

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Task title cannot be empty.")
        return value.strip()


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=5000)
    employee_id: Optional[int] = Field(default=None, gt=0)
    priority: Optional[Priority] = None
    deadline: Optional[date] = None
    status: Optional[TaskStatus] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Task title cannot be empty.")
        return value.strip() if value is not None else value


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class Employee(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str

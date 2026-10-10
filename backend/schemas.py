from pydantic import BaseModel
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    role: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: str
    status: str
    priority: str
    due_date: str

class TaskCreate(TaskBase):
    assignee_id: int

class Task(TaskBase):
    id: int
    assignee_id: int
    class Config:
        orm_mode = True

class LeaveBase(BaseModel):
    start_date: str
    end_date: str
    reason: str

class LeaveCreate(LeaveBase):
    employee_id: int

class Leave(LeaveBase):
    id: int
    employee_id: int
    status: str
    class Config:
        orm_mode = True

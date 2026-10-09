from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="employee")
    name = Column(String)
    
    tasks = relationship("Task", back_populates="assignee")
    leaves = relationship("Leave", back_populates="employee")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="todo")
    priority = Column(String, default="medium")
    due_date = Column(String)
    
    assignee_id = Column(Integer, ForeignKey("users.id"))
    assignee = relationship("User", back_populates="tasks")

class Leave(Base):
    __tablename__ = "leaves"
    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(String)
    end_date = Column(String)
    reason = Column(String)
    status = Column(String, default="pending")
    
    employee_id = Column(Integer, ForeignKey("users.id"))
    employee = relationship("User", back_populates="leaves")

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: str
    points: int
    is_visible: bool = True
    expires_at: Optional[datetime] = None
    details: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    is_visible: Optional[bool] = None
    is_completed: Optional[bool] = None
    expires_at: Optional[datetime] = None
    details: Optional[str] = None

class Task(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class SettingsBase(BaseModel):
    logo_url: Optional[str] = None
    offer_text: Optional[str] = None
    showTimer: Optional[bool] = None
    timerTitle: Optional[str] = None
    showWheel: Optional[bool] = None
    showTasks: Optional[bool] = None
    showFooter: Optional[bool] = None

class SettingsUpdate(SettingsBase):
    pass

class SettingsOut(SettingsBase):
    id: int
    class Config:
        orm_mode = True 
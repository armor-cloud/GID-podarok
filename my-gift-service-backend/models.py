from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from database import Base
from datetime import datetime

class Gift(Base):
    __tablename__ = 'gifts'
    id = Column(Integer, primary_key=True, index=True)
    logo = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    isHighlighted = Column(Boolean, default=False)
    isClaimed = Column(Boolean, default=False)
    isHit = Column(Boolean, default=False)
    redirect_url = Column(String, nullable=True)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    points = Column(Integer)
    is_completed = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    details = Column(String, nullable=True)

class Settings(Base):
    __tablename__ = 'settings'
    id = Column(Integer, primary_key=True, index=True)
    logo_url = Column(String, nullable=True)  # Путь к логотипу
    offer_text = Column(Text, nullable=True)  # Текст оферты (можно html)
    showTimer = Column(Boolean, default=True)
    timerTitle = Column(String, nullable=True)
    showWheel = Column(Boolean, default=True)
    showTasks = Column(Boolean, default=True)
    showFooter = Column(Boolean, default=True) 
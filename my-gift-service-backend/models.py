from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from database import Base
from datetime import datetime

class Gift(Base):
    __tablename__ = 'gifts'
    id = Column(Integer, primary_key=True, index=True)
    logo = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    isHighlighted = Column(Boolean, default=False)
    isClaimed = Column(Boolean, default=False)
    isHit = Column(Boolean, default=False)
    redirect_url = Column(String, nullable=True)
    action_type = Column(String, nullable=False, default='redirect')  # 'redirect', 'show_promo', 'collect_email'
    popup_config = Column(JSON, nullable=True)
    utm_config = Column(JSON, nullable=True)

    promo_codes = relationship("PromoCode", back_populates="gift", cascade="all, delete-orphan")
    email_leads = relationship("EmailLead", back_populates="gift", cascade="all, delete-orphan")

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

class PromoCode(Base):
    __tablename__ = 'promo_codes'
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, index=True)
    gift_id = Column(Integer, ForeignKey('gifts.id'), nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    gift = relationship("Gift", back_populates="promo_codes")

class EmailLead(Base):
    __tablename__ = 'email_leads'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    gift_id = Column(Integer, ForeignKey('gifts.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    gift = relationship("Gift", back_populates="email_leads")

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
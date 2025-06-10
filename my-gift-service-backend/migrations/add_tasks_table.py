from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

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

def upgrade():
    engine = create_engine('sqlite:///gifts.db')
    Base.metadata.create_all(bind=engine)

if __name__ == '__main__':
    upgrade() 
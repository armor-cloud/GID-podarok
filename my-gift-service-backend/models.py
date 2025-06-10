from sqlalchemy import Column, Integer, String, Boolean
from database import Base

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
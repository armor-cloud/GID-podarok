from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Settings(Base):
    __tablename__ = 'settings'
    id = Column(Integer, primary_key=True, index=True)
    logo_url = Column(String, nullable=True)
    offer_text = Column(Text, nullable=True)

def upgrade():
    engine = create_engine('sqlite:///gifts.db')
    Base.metadata.create_all(bind=engine)

if __name__ == '__main__':
    upgrade() 
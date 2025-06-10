from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from models import Gift as GiftModel
from database import SessionLocal, engine, Base

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Монтируем статические файлы для логотипов
os.makedirs("static/logos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Создаём таблицы
Base.metadata.create_all(bind=engine)

# Pydantic-схемы
class GiftBase(BaseModel):
    logo: str
    title: str
    description: str
    isHighlighted: bool = False
    isClaimed: bool = False
    isHit: bool = False
    redirect_url: Optional[str] = None

class GiftCreate(GiftBase):
    pass

class GiftUpdate(GiftBase):
    pass

class GiftOut(GiftBase):
    id: int
    class Config:
        orm_mode = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Gift Service Backend!"}

@app.get("/gifts", response_model=List[GiftOut])
def get_gifts(db: Session = Depends(get_db), only_highlighted: bool = False):
    if only_highlighted:
        return db.query(GiftModel).filter(GiftModel.isHighlighted == True).all()
    return db.query(GiftModel).all()

@app.post("/gifts", response_model=GiftOut)
def create_gift(gift: GiftCreate, db: Session = Depends(get_db)):
    db_gift = GiftModel(**gift.dict())
    db.add(db_gift)
    db.commit()
    db.refresh(db_gift)
    return db_gift

@app.put("/gifts/{gift_id}", response_model=GiftOut)
def update_gift(gift_id: int, gift: GiftUpdate, db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    for key, value in gift.dict().items():
        setattr(db_gift, key, value)
    db.commit()
    db.refresh(db_gift)
    return db_gift

@app.delete("/gifts/{gift_id}")
def delete_gift(gift_id: int, db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    db.delete(db_gift)
    db.commit()
    return {"ok": True}

# --- Автоинициализация стартовых подарков ---
def init_gifts():
    mock_gifts = [
        {"logo": "/static/logos/gazprombonus.png", "title": "Газпром Бонус", "description": "800 баллов Плюса за открытие карты ГПБ", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gazprombonus.ru/activate"},
        {"logo": "/static/logos/gid.png", "title": "Скидка на Заправках", "description": "Скидка 5₽ с литра с картой ГПБ", "isHighlighted": True, "isClaimed": False, "redirect_url": "https://gid.ru/fuel"},
        {"logo": "/static/logos/gid.png", "title": "GID Путешествия", "description": "До 10% кешбэка рублями в GID Путешествиях", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gid.ru/travel"},
        {"logo": "/static/logos/premier.png", "title": "PREMIER", "description": "Месяц бесплатной подписки на онлайн-кинотеатр", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://premier.one/activate"},
        {"logo": "/static/logos/rutube.png", "title": "RUTUBE", "description": "Эксклюзивный контент и бонусы для подписчиков", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://rutube.ru/activate"},
        {"logo": "/static/logos/gazprombank.png", "title": "Газпромбанк", "description": "Специальные условия по дебетовой карте", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gazprombank.ru/card"},
    ]
    db = SessionLocal()
    if db.query(GiftModel).count() == 0:
        for gift in mock_gifts:
            db_gift = GiftModel(**gift)
            db.add(db_gift)
        db.commit()
    db.close()

init_gifts()
# --- конец автоинициализации --- 
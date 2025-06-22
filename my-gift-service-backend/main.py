from fastapi import FastAPI, HTTPException, Depends, Cookie, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session, selectinload
from models import Gift as GiftModel, Settings as SettingsModel, PromoCode as PromoCodeModel, EmailLead as EmailLeadModel
from database import SessionLocal, engine, Base
import schemas
import models
from datetime import datetime

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
# BKLG-1: Base.metadata.create_all(bind=engine) is deprecated when using Alembic
# Base.metadata.create_all(bind=engine)

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

# BKLG-1: Use options for eager loading
@app.get("/gifts", response_model=List[schemas.GiftOut])
def get_gifts(db: Session = Depends(get_db), only_highlighted: bool = False, from_admin: bool = False):
    query = db.query(GiftModel).options(selectinload(GiftModel.promo_codes))
    if only_highlighted:
        query = query.filter(GiftModel.isHighlighted == True)
    
    all_gifts = query.all()

    for gift in all_gifts:
        gift.promo_codes_count = sum(1 for pc in gift.promo_codes if not pc.is_used)

    if from_admin:
        return all_gifts

    # Filter out promo gifts without available codes for regular users
    filtered_gifts = [
        gift for gift in all_gifts 
        if not (gift.action_type == 'show_promo' and gift.promo_codes_count == 0)
    ]
    
    return filtered_gifts

@app.post("/gifts", response_model=List[schemas.GiftOut])
def create_gift(gift: schemas.GiftCreate, db: Session = Depends(get_db)):
    db_gift = GiftModel(**gift.dict())
    db.add(db_gift)
    db.commit()
    db.refresh(db_gift)
    # BKLG-1-FIX: Return all gifts to prevent UI errors
    return db.query(GiftModel).options(selectinload(GiftModel.promo_codes)).all()

@app.put("/gifts/{gift_id}", response_model=List[schemas.GiftOut])
def update_gift(gift_id: int, gift: schemas.GiftUpdate, db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    for key, value in gift.dict().items():
        setattr(db_gift, key, value)
    db.commit()
    db.refresh(db_gift)
    # BKLG-1-FIX: Return all gifts to prevent UI errors
    return db.query(GiftModel).options(selectinload(GiftModel.promo_codes)).all()

@app.delete("/gifts/{gift_id}")
def delete_gift(gift_id: int, db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    db.delete(db_gift)
    db.commit()
    return {"ok": True}

# BKLG-1: Endpoint to claim a gift based on action_type
@app.post("/gifts/{gift_id}/claim")
async def claim_gift(gift_id: int, email_lead: Optional[schemas.EmailLeadCreate] = None, db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")

    if db_gift.action_type == 'collect_email':
        if not email_lead or not email_lead.email:
            raise HTTPException(status_code=400, detail="Email is required for this gift type")
        
        new_lead = EmailLeadModel(email=email_lead.email, gift_id=gift_id)
        db.add(new_lead)
        db.commit()
        return {"message": "Email collected successfully. We will contact you shortly."}

    elif db_gift.action_type == 'show_promo':
        promo_code = db.query(PromoCodeModel).filter(
            PromoCodeModel.gift_id == gift_id,
            PromoCodeModel.is_used == False
        ).first()

        if not promo_code:
            raise HTTPException(status_code=404, detail="No available promo codes for this gift.")

        promo_code.is_used = True
        promo_code.used_at = datetime.utcnow()
        db.commit()
        return {"promo_code": promo_code.code}
    
    elif db_gift.action_type == 'redirect':
        return {"redirect_url": db_gift.redirect_url}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid gift action type")

# BKLG-2: Endpoint to upload promo codes from a file
@app.post("/gifts/{gift_id}/promo_codes/upload")
async def upload_promo_codes(gift_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_gift = db.query(GiftModel).filter(GiftModel.id == gift_id).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")

    if file.content_type not in ["text/plain", "text/csv"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .txt or .csv file.")

    content = await file.read()
    lines = content.decode("utf-8").splitlines()

    new_promo_codes = []
    for line in lines:
        code = line.strip()
        if code:
            # Simple validation, more can be added
            if len(code) > 50:
                continue
            # Check for duplicates before adding
            exists = db.query(PromoCodeModel).filter(PromoCodeModel.gift_id == gift_id, PromoCodeModel.code == code).first()
            if not exists:
                new_promo_codes.append(PromoCodeModel(gift_id=gift_id, code=code))
    
    if new_promo_codes:
        db.bulk_save_objects(new_promo_codes)
        db.commit()

    return {"message": f"{len(new_promo_codes)} new promo codes uploaded successfully."}

# --- Автоинициализация стартовых подарков ---
def init_gifts():
    mock_gifts = [
        {"logo": "/static/logos/gazprombonus.png", "title": "Газпром Бонус", "description": "800 баллов Плюса за открытие карты ГПБ", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gazprombonus.ru/activate", "action_type": "redirect"},
        {"logo": "/static/logos/gid.png", "title": "Скидка на Заправках", "description": "Скидка 5₽ с литра с картой ГПБ", "isHighlighted": True, "isClaimed": False, "redirect_url": "https://gid.ru/fuel", "action_type": "redirect"},
        {"logo": "/static/logos/gid.png", "title": "GID Путешествия", "description": "До 10% кешбэка рублями в GID Путешествиях", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gid.ru/travel", "action_type": "redirect"},
        {"logo": "/static/logos/premier.png", "title": "PREMIER", "description": "Месяц бесплатной подписки на онлайн-кинотеатр", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://premier.one/activate", "action_type": "collect_email"},
        {"logo": "/static/logos/rutube.png", "title": "RUTUBE", "description": "Эксклюзивный контент и бонусы для подписчиков", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://rutube.ru/activate", "action_type": "redirect"},
        {"logo": "/static/logos/gazprombank.png", "title": "Газпромбанк", "description": "Специальные условия по дебетовой карте", "isHighlighted": False, "isClaimed": False, "redirect_url": "https://gazprombank.ru/card", "action_type": "collect_email"},
    ]
    db = SessionLocal()
    # BKLG-1-FIX: Make seeding more robust
    if db.query(GiftModel).count() < len(mock_gifts):
        # Get existing titles to avoid duplicates
        existing_titles = {gift.title for gift in db.query(GiftModel).all()}
        
        for gift_data in mock_gifts:
            if gift_data["title"] not in existing_titles:
                db_gift = GiftModel(**gift_data)
                db.add(db_gift)
        db.commit()
    db.close()

init_gifts()
# --- конец автоинициализации ---

# Task endpoints
@app.get("/tasks/", response_model=List[schemas.Task])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()
    return [schemas.Task.from_orm(task) for task in tasks]

@app.get("/tasks/visible/", response_model=List[schemas.Task])
def get_visible_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.is_visible == True).all()
    return [schemas.Task.from_orm(task) for task in tasks]

@app.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

def init_tasks():
    from models import Task as TaskModel
    db = SessionLocal()
    if db.query(TaskModel).count() == 0:
        mock_tasks = [
            {
                "title": "Зарегистрируйся на GID.ru",
                "description": "Создай аккаунт на GID.ru и получи первые баллы!",
                "points": 100,
                "is_visible": True
            },
            {
                "title": "Заполни профиль",
                "description": "Добавь свои данные в личном кабинете GID.ru.",
                "points": 50,
                "is_visible": True
            },
            {
                "title": "Подпишись на Telegram-канал",
                "description": "Подпишись на наш Telegram-канал и будь в курсе акций.",
                "points": 30,
                "is_visible": True
            },
            {
                "title": "Соверши первую покупку",
                "description": "Соверши любую покупку через GID.ru и получи бонусные баллы.",
                "points": 200,
                "is_visible": True
            },
        ]
        for task in mock_tasks:
            db_task = TaskModel(**task)
            db.add(db_task)
        db.commit()
    db.close()

init_tasks()

# --- Автоинициализация настроек ---
def init_settings():
    db = SessionLocal()
    if db.query(SettingsModel).count() == 0:
        default_settings = SettingsModel(
            logo_url="/static/logos/default_logo.png",
            offer_text="""<h2>Пользовательская оферта</h2><p>Текст оферты по умолчанию.</p>""",
            showTimer=True,
            timerTitle="Выберите подарок за 5 минут",
            showWheel=True,
            showTasks=True,
            showFooter=True
        )
        db.add(default_settings)
        db.commit()
    db.close()

init_settings()
# --- конец автоинициализации ---

@app.get("/settings", response_model=schemas.SettingsOut)
@app.get("/api/settings", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@app.put("/settings", response_model=schemas.SettingsOut)
@app.put("/api/settings", response_model=schemas.SettingsOut)
def update_settings(update: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

@app.post("/api/upload_logo")
async def upload_logo(file: UploadFile = File(...)):
    # Проверяем расширение
    allowed_ext = {"png", "jpg", "jpeg", "webp", "gif"}
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail="Недопустимый формат файла")
    # Генерируем уникальное имя
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join("static", "logos", unique_name)
    # Сохраняем файл
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)
    # Возвращаем путь для фронта
    logo_url = f"/static/logos/{unique_name}"
    return {"logo_url": logo_url} 
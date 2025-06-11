from fastapi import FastAPI, HTTPException, Depends, Cookie, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from models import Gift as GiftModel, Settings as SettingsModel
from database import SessionLocal, engine, Base
import schemas
import models

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
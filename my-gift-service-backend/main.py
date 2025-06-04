from fastapi import FastAPI, HTTPException, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import os
from starlette.responses import JSONResponse

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Монтируем статические файлы для логотипов
os.makedirs("static/logos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Модель данных для подарка
class Gift(BaseModel):
    id: int
    logo: str
    title: str
    description: str
    isHighlighted: bool = False
    isClaimed: bool = False
    redirect_url: Optional[str] = None

# Моковые данные подарков
mock_gifts = [
    {
        "id": 1,
        "logo": "/static/logos/gazprombonus.png",
        "title": "Газпром Бонус",
        "description": "800 баллов Плюса за открытие карты ГПБ",
        "isHighlighted": False,
        "isClaimed": False,
        "redirect_url": "https://gazprombonus.ru/activate"
    },
    {
        "id": 2,
        "logo": "/static/logos/gid.png",
        "title": "Скидка на Заправках",
        "description": "Скидка 5₽ с литра с картой ГПБ",
        "isHighlighted": True,
        "isClaimed": False,
        "redirect_url": "https://gid.ru/fuel"
    },
    {
        "id": 3,
        "logo": "/static/logos/gid.png",
        "title": "GID Путешествия",
        "description": "До 10% кешбэка рублями в GID Путешествиях",
        "isHighlighted": False,
        "isClaimed": False,
        "redirect_url": "https://gid.ru/travel"
    },
    {
        "id": 4,
        "logo": "/static/logos/premier.png",
        "title": "PREMIER",
        "description": "Месяц бесплатной подписки на онлайн-кинотеатр",
        "isHighlighted": False,
        "isClaimed": False,
        "redirect_url": "https://premier.one/activate"
    },
    {
        "id": 5,
        "logo": "/static/logos/rutube.png",
        "title": "RUTUBE",
        "description": "Эксклюзивный контент и бонусы для подписчиков",
        "isHighlighted": False,
        "isClaimed": False,
        "redirect_url": "https://rutube.ru/activate"
    },
    {
        "id": 6,
        "logo": "/static/logos/gazprombank.png",
        "title": "Газпромбанк",
        "description": "Специальные условия по дебетовой карте",
        "isHighlighted": False,
        "isClaimed": False,
        "redirect_url": "https://gazprombank.ru/card"
    },
]

# Хранилище активированных подарков (в реальном приложении это будет база данных)
claimed_gifts: Dict[str, List[int]] = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to Gift Service Backend!"}

@app.get("/gifts")
def get_gifts(user_id: Optional[str] = Cookie(None)):
    # Если пользователь не идентифицирован, создаем новый ID
    if not user_id:
        user_id = str(uuid.uuid4())
    
    # Получаем список активированных подарков для пользователя
    user_claimed_gifts = claimed_gifts.get(user_id, [])
    
    # Если у пользователя уже есть активированный подарок, возвращаем пустой список
    if user_claimed_gifts:
        response_data = {"user_id": user_id, "gifts": []}
        response = JSONResponse(content=response_data)
        response.set_cookie(key="user_id", value=user_id, httponly=True, samesite="lax")
        return response
    
    # Копируем подарки и отмечаем активированные
    gifts = []
    for gift in mock_gifts:
        gift_copy = gift.copy()
        gift_copy["isClaimed"] = gift["id"] in user_claimed_gifts
        gifts.append(gift_copy)
    
    response_data = {"user_id": user_id, "gifts": gifts}
    response = JSONResponse(content=response_data)
    response.set_cookie(key="user_id", value=user_id, httponly=True, samesite="lax")
    return response

@app.post("/gifts/claim/{gift_id}")
def claim_gift(gift_id: int, user_id: str = Cookie(None)):
    if not user_id:
        raise HTTPException(status_code=401, detail="User not identified")
    
    # Проверяем, существует ли такой подарок
    gift = next((g for g in mock_gifts if g["id"] == gift_id), None)
    if not gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    # Проверяем, не активирован ли уже подарок
    user_claimed_gifts = claimed_gifts.get(user_id, [])
    if gift_id in user_claimed_gifts:
        raise HTTPException(status_code=400, detail="Gift already claimed")
    
    # Активируем подарок
    if user_id not in claimed_gifts:
        claimed_gifts[user_id] = []
    claimed_gifts[user_id].append(gift_id)
    
    # В реальной логике здесь бы происходила интеграция с партнером
    return {
        "message": f"Подарок {gift_id} успешно активирован!",
        "claimed_gift": {**gift, "isClaimed": True}
    } 
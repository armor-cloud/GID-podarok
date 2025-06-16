# My Gift Service

Современный веб-сервис для создания и управления подарками с интерактивным колесом фортуны и системой заданий.

## 🚀 Технологии

### Frontend
- **React 19** - UI фреймворк
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик проекта
- **React Router v7** - маршрутизация
- **Axios** - HTTP-клиент для API
- **CSS Modules** - изолированные стили
- **ESLint** - линтинг кода
- **Tailwind CSS** - утилитарный CSS фреймворк

### Backend
- **FastAPI** - Python веб-фреймворк
- **SQLAlchemy** - ORM для работы с базой данных
- **SQLite** - легковесная БД
- **Pydantic** - валидация данных
- **Alembic** - миграции базы данных

## 📁 Структура проекта

```
my-gift-service/
├── my-gift-service-frontend/     # React приложение
│   ├── src/
│   │   ├── api/                 # API клиенты и хуки
│   │   ├── assets/             # Статические ресурсы
│   │   ├── components/         # React компоненты
│   │   ├── pages/             # Страницы приложения
│   │   ├── App.tsx            # Корневой компонент
│   │   └── main.tsx           # Точка входа
│   └── package.json
│
└── my-gift-service-backend/     # FastAPI сервер
    ├── static/                 # Статические файлы
    ├── migrations/            # Миграции БД
    ├── main.py               # Основной файл API
    ├── models.py             # Модели БД
    ├── schemas.py            # Pydantic схемы
    └── database.py           # Конфигурация БД
```

## 🎯 Основные функции

- **Личный кабинет**
  - Основные настройки профиля
  - Управление подарками
  - Управление заданиями

- **Колесо фортуны**
  - Интерактивное колесо с подарками
  - Анимация вращения
  - Система выбора случайного подарка

- **Система заданий**
  - Компактные карточки заданий
  - Отслеживание прогресса
  - Награды за выполнение

## 🛠 Установка и запуск

### Frontend

1. Установка зависимостей:
```bash
cd my-gift-service-frontend
npm install
```

2. Запуск в режиме разработки:
```bash
npm run dev
```

3. Сборка для продакшена:
```bash
npm run build
```

### Backend

1. Создание виртуального окружения:
```bash
cd my-gift-service-backend
python -m venv venv
source venv/bin/activate  # для Linux/Mac
# или
.\venv\Scripts\activate  # для Windows
```

2. Установка зависимостей:
```bash
pip install -r requirements.txt
```

3. Применение миграций:
```bash
alembic upgrade head
```

4. Запуск сервера:
```bash
uvicorn main:app --reload
```


## 📝 API Endpoints

### Основные эндпоинты

- `GET /api/gifts` - список подарков
- `POST /api/gifts` - создание подарка
- `GET /api/tasks` - список заданий
- `POST /api/tasks/complete` - завершение задания
- `GET /api/profile` - данные профиля
- `PUT /api/profile` - обновление профиля


## 📄 Лицензия

MIT 
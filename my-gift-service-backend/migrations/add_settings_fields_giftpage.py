from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///my-gift-service-backend/gifts.db')

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE settings ADD COLUMN showTimer BOOLEAN DEFAULT 1'))
    conn.execute(text('ALTER TABLE settings ADD COLUMN timerTitle VARCHAR'))
    conn.execute(text('ALTER TABLE settings ADD COLUMN showWheel BOOLEAN DEFAULT 1'))
    conn.execute(text('ALTER TABLE settings ADD COLUMN showTasks BOOLEAN DEFAULT 1'))
    conn.execute(text('ALTER TABLE settings ADD COLUMN showFooter BOOLEAN DEFAULT 1'))
    print('Миграция для полей GiftPage в settings успешно применена!') 
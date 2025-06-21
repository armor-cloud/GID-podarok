import React from 'react';
import './GiftCard.css'; // Создадим этот файл стилей позже

export interface GiftCardProps {
  id: number; // Добавляем ID, если еще нет
  logo: string; // Путь к логотипу партнера (теперь главная картинка)
  // illustration?: string; // Удаляем, используем logo как основную картинку
  title: string; // Название подарка (теперь часть текста)
  description: string; // Описание подарка (теперь часть текста)
  points?: string; // **ИЗМЕНЕНО** Поле для баллов стало необязательным
  isHit?: boolean;
  isSelected?: boolean; // Выбранная карточка (для подсветки)
  onClick: (id: number) => void; // Обработчик клика
  disabled?: boolean; // Отключенное состояние
  className?: string; // Добавляем опциональное свойство className
}

const GiftCard: React.FC<GiftCardProps> = ({ id, logo, title, description, points, isHit, isSelected, onClick, disabled, className }) => {
  const handleClick = () => {
    if (!disabled) {
      onClick(id);
    }
  };

  return (
    <div 
      className={`gift-card ${isHit ? 'highlighted' : ''} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`}
      onClick={handleClick}
    >
      {/* Метка ХИТ, если есть */}
      {isHit && <span className="highlight-label">ХИТ</span>}
      {/* Контейнер для логотипа (картинка сверху) */}
      <div className="gift-card-image">
        <img src={logo} alt={`${title} logo`} />
      </div>
      <div className="gift-card-text-content">
        <h3>{title}</h3>
        <p>{description}</p>
        {points && <p className="gift-points">{points}</p>}
      </div>
    </div>
  );
};

export default GiftCard; 
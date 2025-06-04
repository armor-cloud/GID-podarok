import React from 'react';
import './GiftDetailsPopup.css';

interface GiftDetailsPopupProps {
  gift: any; // Здесь будут данные выбранного подарка
  onClose: () => void; // Функция для закрытия попапа
  onClaim: () => Promise<void>; // **ДОБАВЛЕНО** Функция для обработки активации подарка
}

const GiftDetailsPopup: React.FC<GiftDetailsPopupProps> = ({ gift, onClose, onClaim }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        {/* Иллюстрация сверху, как в примере */}
        {gift.illustration && (
          <img src={gift.illustration} alt="Gift Illustration" className="gift-illustration" />
        )}

        {/* Заголовок */}
        <h2>Активируйте подарок</h2>

        {/* Поле для ввода промокода (если применимо) */}
        {/* На данном этапе это просто placeholder UI */}
        <div className="promo-input-container">
          <input type="text" placeholder="Введите промокод" className="promo-input" />
          {/* Используем переданную функцию onClaim для кнопки активации */}
          <button className="activate-button" onClick={onClaim}>Активировать</button>
        </div>
        
        {/* Дополнительные элементы, если нужны */}
        {/* Например, ссылка "У меня нет промокода" или текст условий */}
        <p className="no-promo-link">У меня нет промокода</p>
        <p className="terms-text">Нажимая кнопку, вы принимаете условия подписки</p>
      </div>
    </div>
  );
};

export default GiftDetailsPopup; 
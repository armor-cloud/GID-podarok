import React from 'react';
import './ThankYouPage.css';
import { useNavigate } from 'react-router-dom';

// Убедитесь, что путь к изображению правильный относительно папки public
// Если изображение находится в public/images/, то путь будет /images/gift_thanks.jpg
// Если вы предоставили абсолютный путь для локального использования, в сборке может потребоваться относительный путь
const giftImage = '/images/gift_thanks.jpg'; // Предполагаем, что изображение скопировано в public/images

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToGifts = () => {
    navigate('/gifts');
  };

  return (
    <div className="thank-you-container">
      <h1>Оплата прошла успешно!</h1>
      <p>Спасибо за ваш заказ.</p>
      
      {/* Текст над подарком */}
      <p>Нажмите на подарок, чтобы получить его от экосистемы:</p>

      {/* Кликабельный контейнер для изображения 3D подарка */}
      <div className="gift-box-container" onClick={handleGoToGifts}>
        {/* Изображение 3D подарка */}
        <img src={giftImage} alt="Подарок" className="gift-image" />
      </div>
      
      {/* Кнопка удалена */}
    </div>
  );
};

export default ThankYouPage; 
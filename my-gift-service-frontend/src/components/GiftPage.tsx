// ТЕСТ: ЭТО НОВАЯ СТРОКА КОММЕНТАРИЯ ДЛЯ ПРОВЕРКИ
import React, { useState, useEffect, useRef } from 'react';
// Импортируем только сам компонент, не его тип, так как мы определим тип здесь же.
import GiftCard from './GiftCard';
import '../App.css'; // Импортируем стили
import './GiftPage.css'; // Удаляем импорт удаленного файла стилей
// Импортируем только сам компонент, не его тип.
import GiftDetailsPopup from './GiftDetailsPopup'; // Импортируем новый компонент попапа

interface Gift {
  id: number;
  logo: string;
  illustration: string; // Добавляем поле для иллюстрации
  title: string;
  description: string;
  points: string; // Добавляем поле для баллов
  isHighlighted: boolean;
  isClaimed: boolean;
  redirect_url?: string; // Добавляем опциональное поле для URL редиректа
}

// Определяем тип для GiftCardProps, включая points
interface GiftCardProps {
  id: number;
  logo: string;
  title: string;
  description: string;
  points: string; // Добавляем points в типизацию
  isHighlighted: boolean;
  isClaimed: boolean;
  onClick: () => Promise<void>;
  isSelected: boolean;
  className?: string; // Добавляем опциональное свойство className
}

// Определяем тип для GiftDetailsPopupProps, включая onClaim
interface GiftDetailsPopupProps {
  gift: Gift;
  onClose: () => void;
  onClaim: () => Promise<void>; // Добавляем onClaim в типизацию
}

const GiftPage: React.FC = () => {
  // Состояние для списка подарков
  const [gifts, setGifts] = useState<Gift[]>([]);
  // Состояние для таймера (в секундах). 5 минут = 300 секунд.
  const [timeLeft, setTimeLeft] = useState(300);
  // Состояние для выбранного подарка (храним ID)
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  // Состояние загрузки данных
  const [loading, setLoading] = useState(true);
  // Состояние ошибки при загрузке списка подарков
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Состояние загрузки при активации подарка
  const [claimingGift, setClaimingGift] = useState(false);
  // Состояние успешной активации
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  // Состояние ошибки при активации подарка
  const [claimError, setClaimError] = useState<string | null>(null);
  
  // Новые состояния для попапа успешной активации
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupMessage, setSuccessPopupMessage] = useState<string | null>(null);
  const [successfulClaimedGiftUrl, setSuccessfulClaimedGiftUrl] = useState<string | null>(null);

  // Состояния для попапа деталей подарка
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedGiftDetails, setSelectedGiftDetails] = useState<Gift | null>(null);

  // Состояние для управления видимостью секции подарков
  const [showGiftSection, setShowGiftSection] = useState(true);

  // Состояние для хранения user_id
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Новое состояние для отслеживания развернутых карточек заданий
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());

  // Refs для контейнера прокрутки и контента
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Состояние для управления анимацией вращения
  const [isSpinning, setIsSpinning] = useState(false);
  // Ref для хранения ID кадра анимации
  const animationFrameId = useRef<number | null>(null);

  // Refs для хранения состояния анимации (скорость, целевая позиция, фаза)
  const animationState = useRef({
    velocity: 0,
    targetScroll: null as number | null,
    phase: 'idle' as 'idle' | 'accelerate' | 'spin' | 'decelerate',
  });

  // Обработчик ручной прокрутки
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const contentWidth = content.scrollWidth;
    const singleListWidth = contentWidth / 3;

    // Если прокрутили за пределы первой копии, мгновенно перематываем назад
    if (container.scrollLeft >= singleListWidth * 2) {
      container.scrollLeft -= singleListWidth;
    }
    // Если прокрутили назад за пределы второй копии (от конца), мгновенно перематываем вперед
    else if (container.scrollLeft <= 0) {
      container.scrollLeft += singleListWidth;
    }
  };

  // Добавляем обработчик scroll при монтировании компонента
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Эффект для загрузки данных о подарках с бэкенда (оставляем как есть)
  useEffect(() => {
    const fetchGifts = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await fetch(`http://127.0.0.1:8000/gifts`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          setFetchError("Ваши подарки еще в дороге, пожалуйста попробуйте проверить позже");
          return;
        }

        const data = await response.json();
        console.log("Received gifts data:", data);
        setCurrentUserId(data.user_id);
        
        if (data.gifts.length === 0) {
          setShowGiftSection(false);
        } else {
          // Преобразуем данные с бэкенда, добавляя моковые значения для illustration и points
          const giftsWithDetails = data.gifts.map((gift: any) => ({
            ...gift,
            // Временные моковые данные для иллюстраций и баллов.
            // Используем одну и ту же иллюстрацию для всех подарков
            illustration: `/static/illustrations/default_illustration_2.png`,
            points: `до ${Math.floor(Math.random() * 500) + 100} баллов` 
          }));
          setGifts(giftsWithDetails); // Обновляем список подарков с дополнительными полями
        }

      } catch (error) {
        console.error("Ошибка загрузки подарков:", error);
        setFetchError("Ваши подарки еще в дороге, пожалуйста попробуйте проверить позже");
      } finally {
        setLoading(false);
      }
    };

    fetchGifts();
  }, []);

  // Эффект для работы таймера (оставляем как есть)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Форматирование времени для отображения (ММ:СС) (оставляем как есть)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Обработчик клика по карточке подарка (оставляем как есть, но убираем логику прокрутки если была)
  const handleGiftCardClick = async (giftId: number) => {
    // Находим выбранный подарок по ID и открываем попап деталей
    const gift = gifts.find(g => g.id === giftId);
    if (gift) {
      setSelectedGiftDetails(gift);
      setShowDetailsPopup(true);
    }
  };

  // Функция для закрытия попапа успешной активации (оставляем как есть)
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessPopupMessage(null);
    // После закрытия попапа, если есть URL редиректа, перенаправляем пользователя
    if (successfulClaimedGiftUrl) {
      window.open(successfulClaimedGiftUrl, '_blank'); // Открываем в новой вкладке
      setSuccessfulClaimedGiftUrl(null); // Сбрасываем URL
    }
  };

  // Функция для закрытия попапа деталей подарка
  const closeDetailsPopup = () => {
    setShowDetailsPopup(false);
    setSelectedGiftDetails(null);
  };

  // Функция для переключения состояния развернутости карточки задания
  const toggleTaskDetails = (taskId: number) => {
    setExpandedTaskIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(taskId)) {
        newIds.delete(taskId);
      } else {
        newIds.add(taskId);
      }
      return newIds;
    });
  };

  // Функция для расчета позиции карточки
  const getCardPosition = (index: number) => {
    const container = scrollContainerRef.current;
    const card = contentRef.current?.children[index] as HTMLElement;
    if (!container || !card) return 0;
    const cardWidth = card.offsetWidth + parseFloat(getComputedStyle(card).marginRight);
    return index * cardWidth;
  };

  // Функция для выбора случайного подарка и расчета целевой позиции
  const selectRandomGift = () => {
    if (!contentRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const content = contentRef.current;
    const containerWidth = container.offsetWidth;
    const contentWidth = content.scrollWidth;
    const singleListWidth = contentWidth / 3;

    // Выбираем случайный подарок из оригинального списка
    const randomGiftIndex = Math.floor(Math.random() * gifts.length);
    const targetCard = content.children[randomGiftIndex] as HTMLElement;
    
    // Рассчитываем базовую позицию карточки
    const targetCardCenter = targetCard.offsetLeft + targetCard.offsetWidth / 2;
    
    // Рассчитываем целевую позицию с учетом центрирования
    const targetPosition = targetCardCenter - containerWidth / 2;

    console.log("Выбран подарок:", gifts[randomGiftIndex].title);
    console.log("Базовая позиция карточки:", targetCardCenter);
    console.log("Целевая позиция скролла:", targetPosition);
    
    animationState.current.targetScroll = targetPosition;
    setSelectedGiftId(gifts[randomGiftIndex].id);
  };

  // Функция для остановки анимации
  const stopAnimation = () => {
    console.log("LOG: Остановка анимации");
    setIsSpinning(false);
    animationState.current.phase = 'idle';
    animationState.current.velocity = 0;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = null;
  };

  // Функция анимации прокрутки
  const animateScroll = () => {
    console.log("LOG: Начало animateScroll. Фаза:", animationState.current.phase, "Скорость:", animationState.current.velocity);
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      stopAnimation();
      return;
    }

    const contentWidth = content.scrollWidth;
    const singleListWidth = contentWidth / 3;

    // Логика анимации: ускорение -> постоянная скорость -> замедление -> остановка
    const acceleration = 10;
    const maxVelocity = 300;
    const decelerationStartDistance = 4000; // Увеличенная дистанция начала замедления

    let currentVelocity = animationState.current.velocity;

    // Зацикливание прокрутки
    if (container.scrollLeft >= singleListWidth * 2) {
      container.scrollLeft -= singleListWidth;
    } else if (container.scrollLeft <= 0) {
      container.scrollLeft += singleListWidth;
    }

    switch (animationState.current.phase) {
      case 'accelerate':
        currentVelocity += acceleration;
        if (currentVelocity >= maxVelocity) {
          currentVelocity = maxVelocity;
          animationState.current.phase = 'spin';
        }
        animationState.current.velocity = currentVelocity;
        container.scrollLeft += currentVelocity;
        break;

      case 'spin':
        console.log("LOG: Фаза spin. Скорость:", currentVelocity);
        container.scrollLeft += currentVelocity;
        if (animationState.current.targetScroll !== null && Math.abs(animationState.current.targetScroll - container.scrollLeft) < decelerationStartDistance) {
          animationState.current.phase = 'decelerate';
        }
        break;

      case 'decelerate':
        const distanceToTarget = animationState.current.targetScroll !== null ? animationState.current.targetScroll - container.scrollLeft : 0;
        console.log("LOG: Фаза decelerate. Скорость:", currentVelocity, "Дистанция до цели:", distanceToTarget);

        // Новая логика замедления: уменьшаем скорость пропорционально расстоянию до цели
        let decelerationAmount = 1; // Минимальное значение уменьшения скорости за кадр для плавного замедления (около 5 секунд с 300 до 0)

        console.log("LOG: Decelerate. Amount:", decelerationAmount);

        // Применяем замедление с учетом направления скорости
        if (currentVelocity > 0) {
            currentVelocity = Math.max(0, currentVelocity - decelerationAmount); // Уменьшаем скорость, не давая ей стать отрицательной при движении вправо
        } else if (currentVelocity < 0) {
            currentVelocity = Math.min(0, currentVelocity + decelerationAmount); // Уменьшаем скорость, не давая ей стать положительной при движении влево
        } else {
            currentVelocity = 0; // Если скорость уже 0, остаемся на месте
        }

        console.log("LOG: Decelerate. New Velocity:", currentVelocity);

        // Если скорость стала очень маленькой или достигли цели, останавливаем
        if (animationState.current.targetScroll !== null && Math.abs(currentVelocity) < 10) {
           container.scrollLeft = animationState.current.targetScroll;
           stopAnimation();
           return;
        }

        animationState.current.velocity = currentVelocity;
        container.scrollLeft += currentVelocity;
        break;

      case 'idle':
      default:
        console.log("LOG: Фаза idle. Остановка.");
        stopAnimation();
        return;
    }

    // Продолжаем анимацию
    console.log("LOG: Запрос следующего кадра анимации");
    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  // Функция для запуска вращения
  const handleSpin = () => {
    console.log("LOG: Начало handleSpin");
    if (isSpinning || gifts.length === 0) return;
    
    animationState.current.velocity = 0;
    animationState.current.targetScroll = null;
    setSelectedGiftId(null);
    
    selectRandomGift();
    
    setIsSpinning(true);
    animationState.current.phase = 'accelerate';

    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  return (
    <div className="gift-page-container">
      {/* Новый контейнер для иконки подарка и таймера (оставляем как есть) */}
      <div className="top-info-section">
        {/* Изображение подарка над таймером */}
        <img 
          src="/images/gift-icon.png" 
          alt="Gift Icon" 
          className="large-gift-icon" // Новый класс для стилизации большой иконки
        />
        {/* Контейнер таймера под иконкой */}
        <div className="timer-container">
          <div className="timer-box">{formatTime(timeLeft).split(':')[0]}</div>
          <div className="timer-separator">:</div>
          <div className="timer-box">{formatTime(timeLeft).split(':')[1]}</div>
        </div>
      </div>
      
      <p className="instruction-text">Выберите (1) подарок, у вас есть {Math.ceil(timeLeft / 60)} минут</p>
      
      {loading ? (
        <div className="loading-container">
          <p>Загрузка подарков...</p>
        </div>
      ) : fetchError ? (
        <div className="error-container">
          <p className="error-message">{fetchError}</p>
        </div>
      ) : showGiftSection ? (
        <div className="gift-content">
          {/* Новый контейнер для горизонтальной прокрутки */}
          <div className="gift-list-scroll-container" ref={scrollContainerRef}>
            <div className="gift-list-content" ref={contentRef}>
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  id={gift.id}
                  logo={gift.logo}
                  title={gift.title}
                  description={gift.description}
                  points={gift.points}
                  isHighlighted={gift.isHighlighted}
                  isClaimed={gift.isClaimed}
                  onClick={() => handleGiftCardClick(gift.id)}
                  isSelected={selectedGiftId === gift.id}
                  className={selectedGiftId === gift.id ? 'selected' : ''}
                />
              ))}
              {/* Добавляем копии для бесконечной прокрутки */}
              {gifts.map((gift) => (
                <GiftCard
                  key={`copy1-${gift.id}`}
                  id={gift.id}
                  logo={gift.logo}
                  title={gift.title}
                  description={gift.description}
                  points={gift.points}
                  isHighlighted={gift.isHighlighted}
                  isClaimed={gift.isClaimed}
                  onClick={() => handleGiftCardClick(gift.id)}
                  isSelected={selectedGiftId === gift.id}
                  className={selectedGiftId === gift.id ? 'selected' : ''}
                />
              ))}
              {gifts.map((gift) => (
                <GiftCard
                  key={`copy2-${gift.id}`}
                  id={gift.id}
                  logo={gift.logo}
                  title={gift.title}
                  description={gift.description}
                  points={gift.points}
                  isHighlighted={gift.isHighlighted}
                  isClaimed={gift.isClaimed}
                  onClick={() => handleGiftCardClick(gift.id)}
                  isSelected={selectedGiftId === gift.id}
                  className={selectedGiftId === gift.id ? 'selected' : ''}
                />
              ))}
            </div>
          </div>
          {/* Кнопка для запуска вращения (пока просто заглушка) */}
          <button
            className="spin-button"
            onClick={handleSpin}
            disabled={isSpinning || gifts.length === 0} // Отключаем кнопку во время вращения или если нет подарков
          >
            {isSpinning ? 'Крутим...' : 'Крутить колесо'}
          </button>
        </div>
      ) : (
        <div className="no-gifts-message">
          <p>У вас пока нет доступных подарков</p>
        </div>
      )}

      {showGiftSection && (
        <div className="gift-section">
          {/* Секция с каруселью подарков */}
          {/* Здесь рендерится ваша карусель с подарками */}
          {/* Предполагается, что компонент карусели или логика рендеринга подарков находится здесь */}
          {/* НИЖЕ БУДЕТ ДОБАВЛЕН НОВЫЙ БЛОК С ЗАДАНИЯМИ */}

        </div>
      )}

      {/* === Блок с заданиями === */}
      <div className="tasks-section">
        <h2>Выполняйте задания</h2>
        {/* <p className="tasks-subtitle">Следите за прогрессом и получайте награды</p> */}
        {/* Подзаголовок пока закомментирован, т.к. нет стилей для него */}
        <div className="tasks-list">
          {/* Здесь будут карточки заданий */}
          {/* Пример карточки задания (будет стилизовано в CSS) */}
          {/* Используем моковые данные для демонстрации структуры */}
          {[ /* Моковый массив заданий */
            { id: 1, source: 'Rutube', progress: '0%', title: 'Подпишись на 5 блогеров в Rutube', linkText: 'Найти блогеров →', reward: '⚡️ 10 баллов', time: '🕗 Ещё 7 дней', logo: '/path/to/rutube-logo.png', additionalText: 'Подпишитесь на каналы, которые вам интересны, и следите за новыми видео!' },
            { id: 2, source: 'Музыка', progress: '50%', title: 'Послушай плейлист недели', linkText: 'Слушать →', reward: '💖 50 баллов', time: '🕗 Ещё 5 дней', logo: '/path/to/music-logo.png', additionalText: 'Откройте для себя новые треки и артистов в нашем специальном плейлисте.' },
            { id: 3, source: 'Кино', progress: '100%', title: 'Оцени 3 фильма или сериала', linkText: 'Оценить →', reward: '⚡️ 20 баллов', time: '✅ Выполнено', logo: '/path/to/cinema-logo.png', additionalText: 'Ваше мнение помогает другим выбрать что посмотреть!' },
             { id: 4, source: 'Новости', progress: '0%', title: 'Прочитай 5 новостей дня', linkText: 'Читать →', reward: '💖 5 баллов', time: '🕗 Ещё 1 день', logo: '/path/to/news-logo.png', additionalText: 'Будьте в курсе последних событий.' },
             { id: 5, source: 'Дзен', progress: '30%', title: 'Поставь 10 лайков статьям в Дзен', linkText: 'Открыть Дзен →', reward: '⚡️ 15 баллов', time: '🕗 Ещё 3 дня', logo: '/path/to/dzen-logo.png', additionalText: 'Поддержите любимых авторов и помогите хорошим статьям подняться в ленте.' },
             { id: 6, source: 'Игры', progress: '0%', title: 'Сыграй в новую мини-игру', linkText: 'Играть →', reward: '💖 100 баллов и бонус' , time: '🕗 Ещё 10 дней', logo: '/path/to/games-logo.png', additionalText: 'Попробуйте новую увлекательную мини-игру и получите дополнительные бонусы.' },
          ].map(task => (
            <div key={task.id} className="task-card">
              <div className="task-main-info">
                 {/* Логотип источника */}
                {/* <img src={task.logo} alt={task.source} className="task-source-logo" /> */}
                <span className="task-source">{task.source}</span>
                <span className="task-progress">{task.progress}</span>
              </div>
              <h3 className="task-title">{task.title}</h3>
              <p className="task-link">{task.linkText}</p>

              {/* Секция деталей - сворачиваемая */}
              <div className={`task-details-section ${expandedTaskIds.has(task.id) ? 'expanded' : 'collapsed'}`}>
                <div className="task-details-content">
                   {/* Дополнительный текст */}
                   <p className="task-additional-text">{task.additionalText}</p>
                   {/* Пример дополнительной награды (если есть) */}
                   {/* task.additionalRewardText && <p className="task-additional-reward">{task.additionalRewardText}</p> */}

                   <span className="task-reward">Награда: {task.reward}</span>
                   {/* Убираем время отсюда */}
                   {/* <span className="task-time">{task.time}</span> */}
                </div>
              </div>

              {/* Контейнер для времени и стрелки переключения */}
              <div className="task-toggle-container">
                 <span className="task-time">{task.time}</span>
                 {/* Иконка стрелки для сворачивания/разворачивания в кружке */}
                 <div className="task-arrow-circle" onClick={() => toggleTaskDetails(task.id)}>
                    <div className="task-toggle-arrow">
                       {/* Иконка стрелки вниз */}
                       ↓
                    </div>
                 </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Попап деталей подарка */}
      {showDetailsPopup && selectedGiftDetails && (
        <GiftDetailsPopup
          gift={selectedGiftDetails}
          onClose={closeDetailsPopup}
          onClaim={async () => { 
            // Здесь будет логика активации подарка
            console.log("Claiming gift:", selectedGiftDetails.id);
          }}
        />
      )}

      {/* Попап успешной активации */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <h3>Поздравляем!</h3>
            <p>{successPopupMessage}</p>
            <button onClick={closeSuccessPopup}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftPage;

 
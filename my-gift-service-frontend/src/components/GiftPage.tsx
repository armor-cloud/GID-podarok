// ТЕСТ: ЭТО НОВАЯ СТРОКА КОММЕНТАРИЯ ДЛЯ ПРОВЕРКИ
import React, { useState, useEffect, useRef } from 'react';
// Импортируем только сам компонент, не его тип, так как мы определим тип здесь же.
import GiftCard from './GiftCard';
import '../App.css'; // Импортируем стили
import './GiftPage.css'; // Удаляем импорт удаленного файла стилей
// Импортируем только сам компонент, не его тип.
import GiftDetailsPopup from './GiftDetailsPopup'; // Импортируем новый компонент попапа
import { taskService } from '../api/taskService';
import type { Task } from '../api/taskService';
import axios from 'axios';

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
  isHit: boolean;
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
  isHit: boolean;
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(true);

  // --- Новое: состояния для логотипа и оферты ---
  const [settings, setSettings] = useState<{logo_url: string, offer_text: string, showTimer: boolean, timerTitle: string, showWheel: boolean, showTasks: boolean, showFooter: boolean} | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showLogo, setShowLogo] = useState(true);

  // Скрывать логотип при скролле вниз
  useEffect(() => {
    const handleScroll = () => {
      setShowLogo(window.scrollY <= 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Обработчик закрытия оферты по ESC
  useEffect(() => {
    if (!showOfferModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOfferModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showOfferModal]);

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
        const response = await fetch(`http://127.0.0.1:8000/gifts?only_highlighted=true`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          setFetchError("Ваши подарки еще в дороге, пожалуйста попробуйте проверить позже");
          return;
        }

        const data = await response.json();
        console.log("Received gifts data:", data);
        if (data.length === 0) {
          setShowGiftSection(false);
        } else {
          const giftsWithDetails = data.map((gift: any) => ({
            ...gift,
            illustration: `/static/illustrations/default_illustration_2.png`,
          }));
          setGifts(giftsWithDetails);
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
        container.scrollLeft += currentVelocity;
        if (animationState.current.targetScroll !== null && Math.abs(animationState.current.targetScroll - container.scrollLeft) < decelerationStartDistance) {
          animationState.current.phase = 'decelerate';
        }
        break;

      case 'decelerate':
        const distanceToTarget = animationState.current.targetScroll !== null ? animationState.current.targetScroll - container.scrollLeft : 0;

        // Новая логика замедления: уменьшаем скорость пропорционально расстоянию до цели
        let decelerationAmount = 1; // Минимальное значение уменьшения скорости за кадр для плавного замедления (около 5 секунд с 300 до 0)

        // Применяем замедление с учетом направления скорости
        if (currentVelocity > 0) {
            currentVelocity = Math.max(0, currentVelocity - decelerationAmount); // Уменьшаем скорость, не давая ей стать отрицательной при движении вправо
        } else if (currentVelocity < 0) {
            currentVelocity = Math.min(0, currentVelocity + decelerationAmount); // Уменьшаем скорость, не давая ей стать положительной при движении влево
        } else {
            currentVelocity = 0; // Если скорость уже 0, остаемся на месте
        }

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
        stopAnimation();
        return;
    }

    // Продолжаем анимацию
    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  // Функция для запуска вращения
  const handleSpin = () => {
    if (isSpinning || gifts.length === 0) return;
    
    animationState.current.velocity = 0;
    animationState.current.targetScroll = null;
    setSelectedGiftId(null);
    
    selectRandomGift();
    
    setIsSpinning(true);
    animationState.current.phase = 'accelerate';

    animationFrameId.current = requestAnimationFrame(animateScroll);
  };

  // Загрузка видимых заданий
  useEffect(() => {
    const fetchVisibleTasks = async () => {
      try {
        const visibleTasks = await taskService.getVisibleTasks();
        setTasks(visibleTasks);
        setShowTasks(visibleTasks.length > 0);
      } catch (error) {
        console.error("Ошибка загрузки заданий:", error);
        setShowTasks(false);
      }
    };

    fetchVisibleTasks();
  }, []);

  function getTaskTimeLeft(expires_at?: string | null) {
    if (!expires_at) return '';
    const now = new Date();
    const expires = new Date(expires_at);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Завершено';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (days > 0) return `Ещё ${days} дн.`;
    if (hours > 0) return `Ещё ${hours} ч.`;
    if (minutes > 0) return `Ещё ${minutes} мин.`;
    return 'Меньше минуты';
  }

  function renderDetailsWithLinks(details: string) {
    if (!details) return null;
    // Регулярка для поиска ссылок
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = details.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{color: '#1976d2', textDecoration: 'underline'}}>{part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  useEffect(() => {
    // Получаем настройки (логотип, оферта, настройки страницы подарков)
    axios.get('/api/settings').then(res => {
      setSettings({
        logo_url: res.data.logo_url,
        offer_text: res.data.offer_text,
        showTimer: res.data.showTimer,
        timerTitle: res.data.timerTitle,
        showWheel: res.data.showWheel,
        showTasks: res.data.showTasks,
        showFooter: res.data.showFooter
      });
    });
  }, []);

  // Получаем текущий год для футера
  const currentYear = new Date().getFullYear();

  // Функция для выбора правильного окончания слова "минута"
  function getMinuteSuffix(minutes: number) {
    if (minutes % 10 === 1 && minutes % 100 !== 11) return 'минута';
    if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) return 'минуты';
    return 'минут';
  }

  const minutes = Math.ceil(timeLeft / 60);

  return (
    <div className="gift-page-container" style={{position: 'relative', minHeight: '100vh', paddingBottom: 0}}>
      {/* --- Логотип в правом верхнем углу --- */}
      {settings && settings.logo_url && (
        <img 
          src={settings.logo_url} 
          alt="Логотип компании" 
          className={`fixed-logo-company${showLogo ? '' : ' logo-hidden'}`}
        />
      )}

      {/* --- Основной контент GiftPage --- */}
      {/* Новый контейнер для иконки подарка и таймера (оставляем как есть) */}
      {settings && settings.showTimer && (
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
      )}
      
      <p className="instruction-text">{`Выберите подарок за ${minutes} ${getMinuteSuffix(minutes)}!`}</p>
      
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
                  isHit={gift.isHit}
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
                  isHit={gift.isHit}
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
                  isHit={gift.isHit}
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
            disabled={isSpinning || gifts.length === 0}
            style={{ color: '#fff' }}
          >
            {isSpinning ? 'Крутим...' : 'Крутить колесо'}
          </button>
        </div>
      ) : (
        <div className="no-gifts-message">
          <p>У вас пока нет доступных подарков</p>
        </div>
      )}

      {showGiftSection && settings && settings.showWheel && (
        <div className="gift-section">
          {/* Секция с каруселью подарков */}
          {/* Здесь рендерится ваша карусель с подарками */}
          {/* Предполагается, что компонент карусели или логика рендеринга подарков находится здесь */}
          {/* НИЖЕ БУДЕТ ДОБАВЛЕН НОВЫЙ БЛОК С ЗАДАНИЯМИ */}

        </div>
      )}

      {/* === Блок с заданиями === */}
      {settings && settings.showTasks && showTasks && tasks.length > 0 && (
        <div className="tasks-section">
          <h2>Выполняйте задания</h2>
          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-card${expandedTaskIds.has(task.id) ? ' expanded' : ''}`}>
                <div className="task-main-info">
                  <span className="task-source">{task.title}</span>
                  <span className="task-progress">{task.is_completed ? '100%' : '0%'}</span>
                </div>
                <h3 className="task-title">{task.description}</h3>
                <p className="task-link" onClick={() => toggleTaskDetails(task.id)}>Выполнить →</p>
                {expandedTaskIds.has(task.id) && !!task.details && (
                  <div className="task-details-section">
                    <div className="task-details-content">
                      <p className="task-additional-text">{renderDetailsWithLinks(task.details)}</p>
                    </div>
                  </div>
                )}
                <div className="task-toggle-container" onClick={() => toggleTaskDetails(task.id)}>
                  <span className="task-time">🕗 {getTaskTimeLeft(task.expires_at)}</span>
                  <div className="task-arrow-circle">
                    <div className="task-toggle-arrow">{expandedTaskIds.has(task.id) ? '↑' : '↓'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Попап деталей подарка */}
      {showDetailsPopup && selectedGiftDetails && (
        <GiftDetailsPopup
          gift={selectedGiftDetails}
          onClose={closeDetailsPopup}
          onClaim={async () => { 
            // Здесь будет логика активации подарка
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

      {/* --- Минималистичный футер (без подложки) --- */}
      {settings && settings.showFooter && (
        <footer style={{width: '100%', background: 'none', borderTop: '1px solid #e3eaf5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px 8px 8px', marginTop: 48}}>
          <div style={{marginBottom: 4}}>
            <button onClick={() => setShowOfferModal(true)} style={{background: 'none', border: 'none', color: '#1976d2', fontWeight: 700, fontSize: '1em', cursor: 'pointer', textDecoration: 'underline', padding: 0}}>Пользовательская оферта</button>
          </div>
          <div style={{fontSize: '0.95em', color: '#888', fontWeight: 500}}>
            Powered by <span style={{fontWeight: 900, color: '#1976d2'}}>DataNova</span> © {currentYear}
          </div>
        </footer>
      )}

      {/* --- Минималистичная модалка оферты --- */}
      {showOfferModal && settings && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(33,50,80,0.13)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
              padding: 24,
              maxWidth: 700,
              width: '98%',
              minHeight: 120,
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
              wordBreak: 'break-word',
              fontSize: '1em',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{fontSize: '1em', color: '#222', fontWeight: 400, lineHeight: 1.6, textAlign: 'left', flex: 1}} dangerouslySetInnerHTML={{__html: settings.offer_text || ''}} />
            <button 
              onClick={() => setShowOfferModal(false)} 
              className="offer-close-btn"
              style={{position: 'sticky', bottom: 0, width: '100%', marginTop: 24, borderRadius: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, fontSize: '1.1em', padding: '16px 0', background: '#f7faff', border: '2px solid #1976d2', color: '#1976d2', fontWeight: 700, cursor: 'pointer', zIndex: 10, boxShadow: '0 -2px 8px rgba(33,150,243,0.07)'}}
              aria-label="Закрыть оферту"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftPage;

 
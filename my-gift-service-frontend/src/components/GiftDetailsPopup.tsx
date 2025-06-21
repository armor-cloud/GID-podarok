import React, { useState, useEffect } from 'react';
import './GiftDetailsPopup.css';
import type { Gift } from '../api/giftService';

interface GiftDetailsPopupProps {
  gift: Gift;
  onClose: () => void;
}

const GiftDetailsPopup: React.FC<GiftDetailsPopupProps> = ({ gift, onClose }) => {
  const [email, setEmail] = useState('');
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActivationStepsVisible, setActivationStepsVisible] = useState(false);
  const config = gift.popup_config;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/gifts/${gift.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: gift.action_type === 'collect_email' ? JSON.stringify({ email }) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Произошла ошибка');
      }

      if (gift.action_type === 'show_promo') {
        setPromoCode(data.promo_code);
        setSuccessMessage('Ваш промокод готов!');
      } else if (gift.action_type === 'collect_email') {
        setSuccessMessage(data.message || 'Спасибо! Мы скоро с вами свяжемся.');
      } else if (gift.action_type === 'redirect' && data.redirect_url) {
        window.open(data.redirect_url, '_blank');
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (promoCode) {
      navigator.clipboard.writeText(promoCode);
      alert('Промокод скопирован!');
    }
  };
  
  const renderActionSection = () => {
     if (error) {
      return <p className="popup-error">{error}</p>;
    }
    if (successMessage) {
        return (
            <div className="popup-success">
                <p>{successMessage}</p>
                {promoCode && (
                    <div className="promo-code-container">
                        <strong>{promoCode}</strong>
                        <button onClick={copyToClipboard} className="copy-btn">Копировать</button>
                    </div>
                )}
            </div>
        );
    }
    
    switch (gift.action_type) {
      case 'collect_email':
        return (
            <div className="action-section">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите ваш email"
                  className="popup-email-input"
                />
                <button onClick={handleClaim} disabled={loading || !email} className="popup-claim-btn">
                  {loading ? 'Отправка...' : 'Получить'}
                </button>
            </div>
        );
      case 'show_promo':
        return (
          <div className="action-section">
            <button onClick={handleClaim} disabled={loading} className="popup-claim-btn">
              {loading ? 'Получение...' : 'Получить промокод'}
            </button>
          </div>
        );
      case 'redirect':
      default:
        return (
          <div className="action-section">
            <button onClick={handleClaim} disabled={loading} className="popup-claim-btn">
              {loading ? 'Переходим...' : 'Перейти и получить'}
            </button>
          </div>
        );
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="popup-close-btn" aria-label="Закрыть">
          &times;
        </button>
        <div className="popup-header">
          {(config?.imageUrl || gift.logo) && (
             <img
              src={config?.imageUrl || gift.logo}
              alt={config?.title || gift.title}
              className="popup-logo"
              onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== gift.logo) target.src = gift.logo;
              }}
            />
          )}
          {config?.updated_at_text && <div className="popup-updated-at">{config.updated_at_text}</div>}
        </div>

        <div className="popup-body">
          <h3 className="popup-title">{config?.title || gift.title}</h3>
          
          {config?.subtitle && <p className="popup-subtitle">{config.subtitle}</p>}
          
          {renderActionSection()}
          
          {config?.description && <p className="popup-description">{config.description}</p>}
          
          {config?.benefits && config.benefits.length > 0 && (
            <div className="popup-benefits">
              <ul>
              {config.benefits.map((item, index) => item && <li key={index}>{item}</li>)}
            </ul>
            </div>
          )}

          {config?.activation_steps && config.activation_steps.length > 0 && (
            <div className="popup-activation">
              <h4 onClick={() => setActivationStepsVisible(!isActivationStepsVisible)}>
                <span className={`activation-toggle-icon ${isActivationStepsVisible ? 'open' : ''}`}>&#9660;</span>
                Как активировать?
              </h4>
              {isActivationStepsVisible && (
                <ol>
                  {config.activation_steps.map((item, index) => item && <li key={index}>{item}</li>)}
                </ol>
              )}
            </div>
          )}

          {config?.terms_link_text && (
            <p className="popup-terms">
                Нажимая кнопку, я соглашаюсь с <a href={config.terms_link_url || '#'} target="_blank" rel="noopener noreferrer">{config.terms_link_text}</a>
            </p>
          )}

          {config?.legal_info && <p className="popup-legal">{config.legal_info}</p>}
        </div>
      </div>
    </div>
  );
};

export default GiftDetailsPopup; 
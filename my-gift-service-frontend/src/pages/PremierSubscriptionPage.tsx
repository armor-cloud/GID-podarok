import React from 'react';
import './PremierSubscriptionPage.css';
import { Link } from 'react-router-dom';

const PremierSubscriptionPage: React.FC = () => {
  return (
    <div className="premier-page-container">
      {/* Header Placeholder */}
      <header className="premier-header">
        {/* Здесь будет шапка сайта Premier */}
        <h2>Premier Subscription</h2>
      </header>

      {/* Рекламный баннер */}
      <Link to="/gifts" className="promo-banner-link">
        <div className="promo-banner">
          <img src="/images/promo-banner.png" alt="Вам доступен подарок за покупку!" className="promo-banner-image" />
          {/* Можно добавить текст или другие элементы поверх картинки, если нужно */}
        </div>
      </Link>

      {/* Main Content */}
      <main className="premier-main-content">
        {/* Секция Подписки */}
        <section className="premier-subscription-section">
          <h2>ПОДПИСКИ</h2>
          
          {/* Контейнер для карточек тарифов */}
          <div className="tariff-cards-container">

            {/* Карточка 3 месяца */}
            <div className="tariff-card">
              <div className="tariff-header">
                <h3>3 месяца</h3>
                <span className="discount-badge">-42%</span>
              </div>
              <div className="tariff-price">233₽ / мес</div>
              <div className="tariff-details">экономия 498₽</div>
              <button className="tariff-button">699₽ за 3 месяца</button>
              {/* Placeholder для графики */}
              <div className="tariff-graphic-placeholder">Графика 3</div>
            </div>

            {/* Карточка 1 месяц */}
            <div className="tariff-card highlighted">
               <div className="tariff-header">
                <h3>1 месяц</h3>
              </div>
              <div className="tariff-price">399₽ / мес</div>
              <div className="tariff-details">Обычная стоимость</div>
              <button className="tariff-button">30 дней за 1₽</button>
               {/* Placeholder для графики */}
              <div className="tariff-graphic-placeholder">Графика 1</div>
            </div>

            {/* Карточка 12 месяцев */}
            <div className="tariff-card">
               <div className="tariff-header">
                <h3>12 месяцев</h3>
                 <span className="discount-badge">-63%</span>
              </div>
              <div className="tariff-price">149₽ / мес</div>
              <div className="tariff-details">экономия 2989 ₽</div>
              <button className="tariff-button">1799₽ за 12 месяцев</button>
               {/* Placeholder для графики */}
              <div className="tariff-graphic-placeholder">Графика 12</div>
            </div>

          </div>

        </section>

        {/* Секция Преимущества подписки */}
        <section className="premier-advantages-section">
          <h2>Преимущества подписки</h2>

          {/* Контейнер для преимуществ */}
          <div className="advantages-container">

            {/* Пример преимущества 1 */}
            <div className="advantage-item">
              <h3>Широкий выбор 60 000+
сериалов, фильмов и шоу</h3>
              <p>Хиты кинематографа, нашумевшие шоу, авторское кино и новинки каждую неделю</p>
              {/* Placeholder для изображений фильмов */}
              <div className="advantage-graphic-placeholder">Изображения фильмов</div>
            </div>

            {/* Пример преимущества 2 */}
            <div className="advantage-item">
              <h3>Собственное производство
PREMIER</h3>
              <p>Оригинальные сериалы и шоу, которые можно смотреть только на PREMIER</p>
               {/* Placeholder для графики */}
              <div className="advantage-graphic-placeholder">Графика PREMIER</div>
            </div>

            {/* Добавьте другие преимущества по аналогии */}

          </div>

        </section>

        {/* Placeholder для других секций (FAQ и т.д.) */}

      </main>

      {/* Footer Placeholder */}
      <footer className="premier-footer">
        {/* Здесь будет футер сайта Premier */}
        <p>&copy; 2023 Premier</p>
      </footer>

    </div>
  );
};

export default PremierSubscriptionPage; 
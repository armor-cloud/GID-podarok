import React from 'react';
import './App.css';
import GiftPage from './components/GiftPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PremierSubscriptionPage from './pages/PremierSubscriptionPage';
import ThankYouPage from './components/ThankYouPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PremierSubscriptionPage />} />
          <Route path="/gifts" element={<GiftPage />} />
          <Route path="/premier-subscription" element={<PremierSubscriptionPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/cabinet" element={<ProfilePage />} />
          {/* Можно добавить маршрут для главной страницы, если нужно */}
          {/* <Route path="/" element={<HomePage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

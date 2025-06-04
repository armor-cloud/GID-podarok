import React from 'react';
import './App.css';
import GiftPage from './components/GiftPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PremierSubscriptionPage from './pages/PremierSubscriptionPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<PremierSubscriptionPage />} />
          <Route path="/gifts" element={<GiftPage />} />
          <Route path="/premier-subscription" element={<PremierSubscriptionPage />} />
          {/* Можно добавить маршрут для главной страницы, если нужно */}
          {/* <Route path="/" element={<HomePage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface GiftPageSettingsData {
  showTimer: boolean;
  timerTitle: string;
  showWheel: boolean;
  showTasks: boolean;
  showFooter: boolean;
}

const defaultSettings: GiftPageSettingsData = {
  showTimer: true,
  timerTitle: 'Выберите подарок за 5 минут',
  showWheel: true,
  showTasks: true,
  showFooter: true,
};

const GiftPageSettings: React.FC = () => {
  const [settings, setSettings] = useState<GiftPageSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch {
      // Если нет настроек — используем дефолтные
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await axios.put('/api/settings', settings);
      setSuccess('Настройки успешно сохранены!');
    } catch {
      setError('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="giftpage-panel">
      <h2 style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: 28, color: '#1976d2'}}>🎁</span>
        Страница подарков
      </h2>
      {loading && <div>Загрузка...</div>}
      {error && <div style={{color: 'red', marginBottom: 10}}>{error}</div>}
      {success && <div style={{color: 'green', marginBottom: 10}}>{success}</div>}
      <div style={{marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
        <label className="switch-label">
          <span className="switch">
            <input type="checkbox" name="showTimer" checked={settings.showTimer} onChange={handleChange} />
            <span className="slider round"></span>
          </span>
          <span>Показывать таймер</span>
        </label>
        <label className="switch-label">
          <span className="switch">
            <input type="checkbox" name="showWheel" checked={settings.showWheel} onChange={handleChange} />
            <span className="slider round"></span>
          </span>
          <span>Показывать колесо фортуны</span>
        </label>
        <label className="switch-label">
          <span className="switch">
            <input type="checkbox" name="showTasks" checked={settings.showTasks} onChange={handleChange} />
            <span className="slider round"></span>
          </span>
          <span>Показывать задания</span>
        </label>
        <label className="switch-label">
          <span className="switch">
            <input type="checkbox" name="showFooter" checked={settings.showFooter} onChange={handleChange} />
            <span className="slider round"></span>
          </span>
          <span>Показывать футер</span>
        </label>
      </div>
      <button onClick={handleSave} disabled={loading} style={{background: 'linear-gradient(90deg,#1976d2 60%,#42a5f5 100%)', color: '#fff', fontWeight: 900, border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: '1.1em', cursor: 'pointer', boxShadow: '0 2px 12px rgba(33,150,243,0.13)'}}>
        Сохранить
      </button>
    </div>
  );
};

export default GiftPageSettings; 
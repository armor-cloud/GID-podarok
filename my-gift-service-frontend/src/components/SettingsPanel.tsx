import React, { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';

interface Settings {
  id: number;
  logo_url: string | null;
  offer_text: string | null;
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [offerText, setOfferText] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
      setLogoPreview(res.data.logo_url);
      setOfferText(res.data.offer_text || '');
    } catch {
      setError('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleOfferChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOfferText(e.target.value);
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      let logo_url = settings?.logo_url || '';
      if (logoFile) {
        // Загрузка файла логотипа
        const formData = new FormData();
        formData.append('file', logoFile);
        const uploadRes = await axios.post('/api/upload_logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        logo_url = uploadRes.data.logo_url;
      }
      // Обновление настроек
      await axios.put('/api/settings', {
        logo_url,
        offer_text: offerText,
      });
      setSuccess('Настройки успешно сохранены!');
      setLogoFile(null);
      fetchSettings();
    } catch {
      setError('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-panel" style={{background: '#f7faff', borderRadius: 20, boxShadow: '0 4px 24px rgba(33,150,243,0.10)', padding: 32, marginBottom: 32, width: '100%', maxWidth: '100%', minWidth: 320}}>
      {/* <h2 style={{marginTop: 0, marginBottom: 18, fontWeight: 900, fontSize: '1.5em', color: '#0d47a1'}}>Enterprise-настройки</h2> */}
      {loading && <div>Загрузка...</div>}
      {error && <div style={{color: 'red', marginBottom: 10}}>{error}</div>}
      {success && <div style={{color: 'green', marginBottom: 10}}>{success}</div>}
      <div style={{marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{marginBottom: 8, fontWeight: 700}}>Логотип компании:</div>
        {logoPreview && <img src={logoPreview} alt="Логотип" style={{width: 80, height: 80, objectFit: 'contain', borderRadius: 16, background: 'none', border: 'none', boxShadow: 'none', marginBottom: 8}} />}
        <input type="file" accept="image/*" onChange={handleLogoChange} style={{marginTop: 8}} />
      </div>
      <div style={{marginBottom: 18}}>
        <div style={{marginBottom: 8, fontWeight: 700}}>Текст оферты:</div>
        <textarea value={offerText} onChange={handleOfferChange} rows={6} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e3eaf5', padding: 12, fontSize: '1em', resize: 'vertical'}} />
      </div>
      <button onClick={handleSave} disabled={loading} style={{background: 'linear-gradient(90deg,#1976d2 60%,#42a5f5 100%)', color: '#fff', fontWeight: 900, border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: '1.1em', cursor: 'pointer', boxShadow: '0 2px 12px rgba(33,150,243,0.13)'}}>
        Сохранить
      </button>
    </div>
  );
};

export default SettingsPanel; 
import React, { useEffect, useState } from 'react';
import './ProfilePage.css';
import { getGifts, deleteGift, createGift, updateGift } from '../api/giftService';
import type { Gift, GiftInput } from '../api/giftService';

const initialGiftForm: GiftInput = {
  logo: '',
  title: '',
  description: '',
  isHighlighted: false,
  isClaimed: false,
  isHit: false,
  redirect_url: '',
};

const ProfilePage: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formGift, setFormGift] = useState<GiftInput>(initialGiftForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchGiftsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGifts();
      setGifts(data);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки подарков');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftsList();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот подарок?')) return;
    setDeletingId(id);
    try {
      await deleteGift(id);
      setGifts(gifts => gifts.filter(g => g.id !== id));
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления подарка');
    } finally {
      setDeletingId(null);
    }
  };

  const handleHighlightChange = async (gift: Gift, checked: boolean) => {
    try {
      const updated = await updateGift(gift.id, { ...gift, isHighlighted: checked });
      setGifts(gifts => gifts.map(g => g.id === gift.id ? updated : g));
    } catch (e: any) {
      alert(e.message || 'Ошибка обновления подарка');
    }
  };

  const handleHitChange = async (gift: Gift, checked: boolean) => {
    try {
      const updated = await updateGift(gift.id, { ...gift, isHit: checked });
      setGifts(gifts => gifts.map(g => g.id === gift.id ? updated : g));
    } catch (e: any) {
      alert(e.message || 'Ошибка обновления подарка');
    }
  };

  const openCreateForm = () => {
    setFormGift(initialGiftForm);
    setFormMode('create');
    setEditId(null);
    setShowForm(true);
  };

  const openEditForm = (gift: Gift) => {
    setFormGift({
      logo: gift.logo || '',
      title: gift.title || '',
      description: gift.description || '',
      isHighlighted: !!gift.isHighlighted,
      isClaimed: !!gift.isClaimed,
      isHit: !!gift.isHit,
      redirect_url: gift.redirect_url || '',
    });
    setFormMode('edit');
    setEditId(gift.id);
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormGift(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormGift(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения');
      return;
    }
    if (file.size > 1024 * 1024) {
      alert('Размер файла не должен превышать 1 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormGift(prev => ({ ...prev, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (formMode === 'create') {
        const created = await createGift(formGift);
        setGifts(gifts => [...gifts, created]);
      } else if (formMode === 'edit' && editId !== null) {
        const updated = await updateGift(editId, formGift);
        setGifts(gifts => gifts.map(g => g.id === editId ? updated : g));
      }
      setShowForm(false);
    } catch (e: any) {
      alert(e.message || 'Ошибка сохранения подарка');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <h1>Личный кабинет</h1>
      <section className="profile-section gifts-section">
        <h2>Мои подарки</h2>
        <button className="gift-admin-add" onClick={openCreateForm} aria-label="Добавить подарок">Добавить подарок</button>
        {loading ? (
          <div className="profile-placeholder">Загрузка...</div>
        ) : error ? (
          <div className="profile-placeholder" style={{color: 'red'}}>{error}</div>
        ) : (
          <div className="gifts-list-admin">
            {gifts.map(gift => (
              <div key={gift.id} className="gift-admin-item">
                <img src={gift.logo} alt={gift.title} className="gift-admin-logo" />
                <div className="gift-admin-info">
                  <div className="gift-admin-title">{gift.title}</div>
                  <div className="gift-admin-desc">{gift.description}</div>
                </div>
                <label className="gift-admin-highlight">
                  <input type="checkbox" checked={gift.isHighlighted} onChange={e => handleHighlightChange(gift, e.target.checked)} />
                  <span></span>
                  Показывать на витрине
                </label>
                <label className="gift-admin-highlight">
                  <input type="checkbox" checked={gift.isHit} onChange={e => handleHitChange(gift, e.target.checked)} />
                  <span></span>
                  Хит
                </label>
                <div className="gift-admin-actions">
                  <button className="gift-admin-edit" onClick={() => openEditForm(gift)} aria-label="Редактировать подарок">Редактировать</button>
                  <button className="gift-admin-delete" onClick={() => handleDelete(gift.id)} disabled={deletingId === gift.id} aria-label="Удалить подарок">
                    {deletingId === gift.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showForm && (
          <div className="gift-form-modal" key={editId || formMode}>
            <form className="gift-form" onSubmit={handleFormSubmit}>
              <h3>{formMode === 'create' ? 'Добавить подарок' : 'Редактировать подарок'}</h3>
              <div className="gift-form-logo-block">
                {formGift.logo && <img src={formGift.logo} alt="Логотип" className="gift-form-logo-preview" />}
                <label>
                  Загрузить логотип (JPG/PNG, до 1 МБ, 1:1):
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <label>
                Название:
                <input name="title" value={formGift.title ?? ''} onChange={handleFormChange} required />
              </label>
              <label>
                Описание:
                <textarea name="description" value={formGift.description ?? ''} onChange={handleFormChange} required />
              </label>
              <label>
                URL перехода:
                <input name="redirect_url" value={formGift.redirect_url ?? ''} onChange={handleFormChange} />
              </label>
              <div className="gift-form-toggles-row">
                <label>
                  <input type="checkbox" name="isHighlighted" checked={!!formGift.isHighlighted} onChange={handleFormChange} />
                  <span></span>
                  Показывать на витрине
                </label>
                <label>
                  <input type="checkbox" name="isHit" checked={!!formGift.isHit} onChange={handleFormChange} />
                  <span></span>
                  Хит
                </label>
              </div>
              <div className="gift-form-actions">
                <button type="submit" disabled={formLoading}>{formLoading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => setShowForm(false)} disabled={formLoading}>Отмена</button>
              </div>
            </form>
          </div>
        )}
      </section>
      <section className="profile-section tasks-section">
        <h2>Мои задания</h2>
        <div className="profile-placeholder">Здесь будут отображаться ваши задания.</div>
      </section>
    </div>
  );
};

export default ProfilePage; 
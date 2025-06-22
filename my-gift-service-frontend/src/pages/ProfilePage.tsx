import React, { useEffect, useState } from 'react';
import './ProfilePage.css';
import { getGifts, deleteGift, createGift, updateGift, uploadPromoCodes } from '../api/giftService';
import type { Gift, GiftInput, PopupConfig, UTMParameter } from '../api/giftService';
import { taskService } from '../api/taskService';
import type { Task } from '../api/taskService';
import SettingsPanel from '../components/SettingsPanel';
import GiftPageSettings from '../components/GiftPageSettings';
import GiftDetailsPopup from '../components/GiftDetailsPopup';
import '../components/GiftDetailsPopup.css';
import GiftCard from '../components/GiftCard';
import '../components/GiftCard.css';

const initialPopupConfig: PopupConfig = {
  imageUrl: '',
  title: '',
  description: '',
  subtitle: '',
  benefits: [],
  activation_steps: [],
  terms_link_text: '',
  terms_link_url: '',
  legal_info: '',
  offer_validity: '',
  updated_at_text: '',
  share_button_enabled: false,
};

const initialGiftForm: GiftInput = {
  logo: '',
  title: '',
  description: '',
  isHighlighted: false,
  isClaimed: false,
  isHit: false,
  redirect_url: '',
  action_type: 'redirect',
  popup_config: initialPopupConfig,
  utm_config: [],
};

const SECTIONS = [
  { key: 'main', label: 'Основные настройки' },
  { key: 'giftpage', label: 'Страница подарков' },
  { key: 'gifts', label: 'Мои подарки' },
  { key: 'tasks', label: 'Задания' },
];

const ProfilePage: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formGift, setFormGift] = useState<GiftInput>(initialGiftForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [promoCodeFile, setPromoCodeFile] = useState<File | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    points: 0,
    is_visible: true,
    expires_at: '',
    details: ''
  });
  const [activeSection, setActiveSection] = useState('main');

  useEffect(() => {
    if (showForm) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowForm(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showForm]);

  const fetchGiftsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGifts(true);
      setGifts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки подарков');
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
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления подарка');
    } finally {
      setDeletingId(null);
    }
  };

  const handleHighlightChange = async (gift: Gift, checked: boolean) => {
    try {
      const { promo_codes_count, ...giftInput } = gift;
      const updatedGifts = await updateGift(gift.id, { ...giftInput, isHighlighted: checked, redirect_url: gift.redirect_url || '' });
      setGifts(updatedGifts);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка обновления подарка');
    }
  };

  const handleHitChange = async (gift: Gift, checked: boolean) => {
    try {
      const { promo_codes_count, ...giftInput } = gift;
      const updatedGifts = await updateGift(gift.id, { ...giftInput, isHit: checked, redirect_url: gift.redirect_url || '' });
      setGifts(updatedGifts);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка обновления подарка');
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
      redirect_url: gift.redirect_url ?? '',
      action_type: gift.action_type || 'redirect',
      popup_config: { ...initialPopupConfig, ...(gift.popup_config || {}) },
      utm_config: gift.utm_config || [],
    });
    setFormMode('edit');
    setEditId(gift.id);
    setShowForm(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    options?: { isConfig?: boolean; listName?: 'benefits' | 'activation_steps'; index?: number, isUtm?: boolean; utmKey?: 'key' | 'value' }
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormGift(prev => {
      const newFormGift = { ...prev };

      if (options?.isConfig) {
        const newPopupConfig = { ...(newFormGift.popup_config || initialPopupConfig) };

        if (options.listName && options.index !== undefined) {
          const list = [...(newPopupConfig[options.listName] || [])];
          list[options.index] = value;
          (newPopupConfig as Record<string, unknown>)[options.listName] = list;
        } else {
          (newPopupConfig as Record<string, unknown>)[name] = type === 'checkbox' ? checked : value;
        }
        newFormGift.popup_config = newPopupConfig;
      } else if (options?.isUtm && options.index !== undefined && options.utmKey) {
        const newUtmConfig = [...(newFormGift.utm_config || [])];
        newUtmConfig[options.index] = { ...newUtmConfig[options.index], [options.utmKey]: value };
        newFormGift.utm_config = newUtmConfig;
      } else {
        (newFormGift as Record<string, unknown>)[name] = type === 'checkbox' ? checked : value;
      }

      return newFormGift;
    });
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

  const handlePromoCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain') {
        setPromoCodeFile(file);
      } else {
        alert('Пожалуйста, выберите файл в формате .txt');
        e.target.value = '';
      }
    }
  };

  const handlePopupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Размер файла не должен превышать 2 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormGift(prev => ({
        ...prev,
        popup_config: {
          ...(prev.popup_config || initialPopupConfig),
          imageUrl: ev.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = (listName: 'benefits' | 'activation_steps') => {
    setFormGift(prev => {
      const newPopupConfig = { ...(prev.popup_config || initialPopupConfig) };
      const list = [...(newPopupConfig[listName] || []), ''];
      (newPopupConfig as Record<string, unknown>)[listName] = list;
      return { ...prev, popup_config: newPopupConfig };
    });
  };

  const handleRemoveItem = (listName: 'benefits' | 'activation_steps', index: number) => {
    setFormGift(prev => {
      const newPopupConfig = { ...(prev.popup_config || initialPopupConfig) };
      const list = [...(newPopupConfig[listName] || [])];
      list.splice(index, 1);
      (newPopupConfig as Record<string, unknown>)[listName] = list;
      return { ...prev, popup_config: newPopupConfig };
    });
  };

  const addUtmItem = () => {
    setFormGift(prev => ({
      ...prev,
      utm_config: [...(prev.utm_config || []), { key: '', value: '' }],
    }));
  };

  const removeUtmItem = (index: number) => {
    setFormGift(prev => ({
      ...prev,
      utm_config: prev.utm_config?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let updatedGifts: Gift[];
      let targetGiftId: number;

      if (formMode === 'create') {
        updatedGifts = await createGift(formGift);
        const newGift = updatedGifts.find(g => g.title === formGift.title && g.description === formGift.description);
        if (!newGift) throw new Error("Could not find the newly created gift.");
        targetGiftId = newGift.id;
      } else {
        if (editId === null) throw new Error('Нет ID для редактирования');
        updatedGifts = await updateGift(editId, formGift);
        targetGiftId = editId;
      }

      if (promoCodeFile && targetGiftId) {
        try {
          await uploadPromoCodes(targetGiftId, promoCodeFile);
          alert('Промокоды успешно загружены.');
        } catch (uploadError) {
          alert(`Ошибка загрузки промокодов: ${uploadError instanceof Error ? uploadError.message : 'Неизвестная ошибка'}`);
        }
      }
      
      setGifts(updatedGifts);
      setShowForm(false);
      setFormGift(initialGiftForm);
      setPromoCodeFile(null);
      setEditId(null);
    } catch (e: unknown) {
      alert(`Ошибка сохранения: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
    } finally {
      setFormLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasksData = await taskService.getAllTasks();
      setTasks(tasksData);
    } catch (err) {
      setError('Ошибка при загрузке заданий');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    try {
      const createdTask = await taskService.createTask({
        ...newTask,
        expires_at: newTask.expires_at ? new Date(newTask.expires_at).toISOString() : null,
        details: newTask.details || ''
      });
      setTasks([...tasks, createdTask]);
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        points: 0,
        is_visible: true,
        expires_at: '',
        details: ''
      });
    } catch (err) {
      setError('Ошибка при создании задания');
      console.error(err);
    }
  };

  const handleUpdateTask = async (task: Task) => {
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description,
        points: task.points,
        is_visible: task.is_visible,
        expires_at: task.expires_at ? new Date(task.expires_at).toISOString() : null,
        details: task.details || ''
      });
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      setEditingTask(null);
    } catch (err) {
      setError('Ошибка при обновлении задания');
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      setError('Ошибка при удалении задания');
      console.error(err);
    }
  };

  const toggleTaskVisibility = async (task: Task) => {
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        is_visible: !task.is_visible
      });
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      setError('Ошибка при обновлении видимости задания');
      console.error(err);
    }
  };

  return (
    <div className="profile-layout">
      <aside className="profile-sidebar">
        <div className="sidebar-title">Личный кабинет</div>
        <nav className="sidebar-nav">
          {SECTIONS.map(section => (
            <button
              key={section.key}
              className={`sidebar-link${activeSection === section.key ? ' active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="profile-main-content">
        {activeSection === 'main' && <SettingsPanel />}
        {activeSection === 'main' && <hr className="section-divider" />}
        {activeSection === 'giftpage' && <GiftPageSettings />}
        {activeSection === 'giftpage' && <hr className="section-divider" />}
        {activeSection === 'gifts' && (
          <div className="profile-section gifts-section">
            <div className="section-header">
              <h2>{showForm ? (formMode === 'create' ? 'Создать подарок' : 'Редактировать подарок') : 'Мои подарки'}</h2>
              {!showForm && (
                <button className="add-button" onClick={openCreateForm}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Добавить подарок
                </button>
                        )}
                      </div>

            {showForm ? (
              <div className="editor-layout">
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
                  <div className="form-group">
                    <label htmlFor="action_type">Тип действия</label>
                    <select
                      id="action_type"
                      name="action_type"
                      value={formGift.action_type}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="redirect">Переход по ссылке</option>
                      <option value="show_promo">Показать промокод</option>
                      <option value="collect_email">Собрать email</option>
                    </select>
                  </div>
                  {(formGift.action_type === 'redirect' || formGift.action_type === 'show_promo') && (
                    <div className="form-group">
                      <label htmlFor="redirect_url">
                        URL для перехода
                        {formGift.action_type === 'show_promo' && (
                          <span className="tooltip">
                            <i className="fas fa-question-circle"></i>
                            <span className="tooltip-text">
                              Можно использовать плейсхолдер {'{promo}'}, он будет заменен на реальный промокод.
                            </span>
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        id="redirect_url"
                        name="redirect_url"
                        value={formGift.redirect_url ?? ''}
                        onChange={handleFormChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                  <fieldset className="form-fieldset">
                    <legend>UTM-метки</legend>
                    <div className="dynamic-list-group">
                      {formGift.utm_config?.map((utm, index) => (
                        <div key={index} className="dynamic-list-item utm-item">
                          <input
                            type="text"
                            value={utm.key}
                            onChange={(e) => handleFormChange(e, { isUtm: true, index, utmKey: 'key' })}
                            placeholder="utm_source"
                            className="utm-key-input"
                          />
                          <input
                            type="text"
                            value={utm.value}
                            onChange={(e) => handleFormChange(e, { isUtm: true, index, utmKey: 'value' })}
                            placeholder="gid-gifts"
                            className="utm-value-input"
                          />
                          <button type="button" onClick={() => removeUtmItem(index)}>&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={addUtmItem}>+ Добавить UTM-метку</button>
                    </div>
                  </fieldset>
                  <fieldset className="form-fieldset">
                    <legend>Настройки внешнего вида попапа</legend>
                    <div className="gift-form-logo-block">
                      {formGift.popup_config?.imageUrl && <img src={formGift.popup_config.imageUrl} alt="Превью" className="gift-form-logo-preview" />}
                      <label>
                        Загрузить картинку для попапа (JPG/PNG, до 2 МБ):
                        <input type="file" accept="image/*" onChange={handlePopupImageUpload} />
                      </label>
                    </div>
                    <label>
                      Заголовок в попапе:
                      <input name="title" value={formGift.popup_config?.title ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                    <label>
                      Подзаголовок в попапе:
                      <input name="subtitle" value={formGift.popup_config?.subtitle ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                     <label>
                      Описание в попапе:
                      <textarea name="description" value={formGift.popup_config?.description ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                  </fieldset>

                  <fieldset className="form-fieldset">
                    <legend>Списки</legend>
                    <div className="dynamic-list-group">
                      <label>Преимущества:</label>
                      {formGift.popup_config?.benefits?.map((benefit, index) => (
                        <div key={index} className="dynamic-list-item">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => handleFormChange(e, { isConfig: true, listName: 'benefits', index })}
                          />
                          <button type="button" onClick={() => handleRemoveItem('benefits', index)}>&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleAddItem('benefits')}>+ Добавить преимущество</button>
                    </div>
                     <div className="dynamic-list-group">
                      <label>Шаги активации:</label>
                      {formGift.popup_config?.activation_steps?.map((step, index) => (
                        <div key={index} className="dynamic-list-item">
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => handleFormChange(e, { isConfig: true, listName: 'activation_steps', index })}
                          />
                          <button type="button" onClick={() => handleRemoveItem('activation_steps', index)}>&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleAddItem('activation_steps')}>+ Добавить шаг</button>
                    </div>
                  </fieldset>

                  <fieldset className="form-fieldset">
                    <legend>Дополнительная информация</legend>
                    <label>
                      Текст с датой обновления:
                      <input name="updated_at_text" value={formGift.popup_config?.updated_at_text ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                    <label>
                      Срок действия акции:
                      <input name="offer_validity" value={formGift.popup_config?.offer_validity ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                     <label>
                      Текст ссылки на условия:
                      <input name="terms_link_text" value={formGift.popup_config?.terms_link_text ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                     <label>
                      URL ссылки на условия:
                      <input name="terms_link_url" value={formGift.popup_config?.terms_link_url ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                    <label>
                      Юридическая информация:
                      <textarea name="legal_info" value={formGift.popup_config?.legal_info ?? ''} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                    </label>
                     <label>
                      <input type="checkbox" name="share_button_enabled" checked={!!formGift.popup_config?.share_button_enabled} onChange={(e) => handleFormChange(e, { isConfig: true })} />
                      Показывать кнопку "Поделиться"
                    </label>
                  </fieldset>

                  {formGift.action_type === 'show_promo' && (
                    <div className="form-group">
                      <label htmlFor="promo_codes_file">
                        Файл с промокодами (.txt)
                        <span className="tooltip">
                          <i className="fas fa-question-circle"></i>
                          <span className="tooltip-text">
                            Загрузите .txt файл, где каждый промокод находится на новой строке. Существующие промокоды не будут затронуты, добавятся только новые.
                          </span>
                        </span>
                      </label>
                      <input
                        type="file"
                        id="promo_codes_file"
                        name="promo_codes_file"
                        accept=".txt"
                        onChange={handlePromoCodeFileChange}
                      />
                    </div>
                  )}
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
                <div className="editor-preview-column">
                  <div className="card-preview-wrapper">
                    <h4>Карточка</h4>
                    <GiftCard
                      id={-1}
                      {...formGift}
                      isHit={formGift.isHit}
                      onClick={() => {}}
                    />
                  </div>
                  <div className="popup-preview-wrapper">
                    <h4>Открытый вид</h4>
                    <div className="popup-preview-content">
                      <GiftDetailsPopup
                        gift={{
                          id: -1,
                          ...formGift,
                          action_type: formGift.action_type as 'redirect' | 'show_promo' | 'collect_email',
                          redirect_url: formGift.redirect_url ?? '',
                          popup_config: formGift.popup_config ?? initialPopupConfig,
                        }}
                        onClose={() => {}}
                        isPreview={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {loading && <div className="profile-placeholder">Загрузка...</div>}
                {error && <div className="profile-placeholder" style={{color: 'red'}}>{error}</div>}
                {!loading && !error && gifts.length === 0 && <p>У вас пока нет подарков.</p>}
                {!loading && !error && gifts.length > 0 && (
                  <div className="gifts-list-admin">
                    {gifts.map(gift => (
                      <div key={gift.id} className="gift-admin-item">
                        <img
                          src={gift.logo.startsWith('data:') ? gift.logo : `http://127.0.0.1:8000${gift.logo}`}
                          alt={gift.title}
                          className="gift-admin-logo"
                        />
                        <div className="gift-admin-info">
                          <div className="gift-admin-title">{gift.title}</div>
                          <div className="gift-admin-desc">{gift.description}</div>
                          <div className="gift-meta">
                            <p><strong>ID:</strong> {gift.id}</p>
                            <p><strong>Тип действия:</strong> {gift.action_type}</p>
                            {gift.action_type === 'show_promo' && (
                              <p><strong>Доступно промокодов:</strong> {gift.promo_codes_count ?? 0}</p>
                            )}
                          </div>
                        </div>
                        <div className="gift-admin-actions">
                          <div className="gift-admin-toggles">
                            <label className="gift-admin-highlight">
                              <input type="checkbox" checked={!!gift.isHighlighted} onChange={e => handleHighlightChange(gift, e.target.checked)} />
                              <span></span>
                              Показывать на витрине
                            </label>
                            <label className="gift-admin-highlight">
                              <input type="checkbox" checked={!!gift.isHit} onChange={e => handleHitChange(gift, e.target.checked)} />
                              <span></span>
                              Хит
                            </label>
                          </div>
                          <div className="gift-admin-action-buttons">
                            <button className="gift-admin-edit" onClick={() => openEditForm(gift)}>Редактировать</button>
                            <button className="gift-admin-delete" onClick={() => handleDelete(gift.id)} disabled={deletingId === gift.id}>Удалить</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeSection === 'tasks' && (
          <section className="profile-section tasks-section">
            <div className="section-header">
              <h2>Управление заданиями</h2>
              <button className="add-button" onClick={() => setShowTaskModal(true)}>Добавить задание</button>
            </div>

            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.title}</h3>
                    <div className="task-actions">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={task.is_visible}
                          onChange={() => toggleTaskVisibility(task)}
                        />
                        <span className="slider round"></span>
                      </label>
                      <button
                        className="edit-button"
                        onClick={() => setEditingTask(task)}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p>{task.description}</p>
                  <p className="points">Баллы: {task.points}</p>
                  {task.expires_at && (
                    <div className="task-expiry">Срок действия: {task.expires_at.slice(0, 10)}</div>
                  )}
                  {task.details && (
                    <div className="task-details-preview">{task.details}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {showTaskModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Новое задание</h3>
              <input
                type="text"
                placeholder="Название"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
              <textarea
                placeholder="Описание"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
              <input
                type="number"
                placeholder="Баллы"
                value={newTask.points}
                onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value)})}
              />
              <input
                type="date"
                value={newTask.expires_at ? newTask.expires_at.slice(0, 10) : ''}
                onChange={e => setNewTask({ ...newTask, expires_at: e.target.value })}
                placeholder="Срок действия"
              />
              <textarea
                placeholder="Подробности"
                value={newTask.details}
                onChange={e => setNewTask({ ...newTask, details: e.target.value })}
              />
              <div className="modal-actions">
                <button onClick={handleCreateTask}>Создать</button>
                <button onClick={() => setShowTaskModal(false)}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {editingTask && (
          <div className="modal">
            <div className="modal-content">
              <h3>Редактировать задание</h3>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
              <textarea
                value={editingTask.description}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
              />
              <input
                type="number"
                value={editingTask.points}
                onChange={(e) => setEditingTask({...editingTask, points: parseInt(e.target.value)})}
              />
              <input
                type="date"
                value={editingTask?.expires_at ? editingTask.expires_at.slice(0, 10) : ''}
                onChange={e => setEditingTask(editingTask ? { ...editingTask, expires_at: e.target.value } : null)}
                placeholder="Срок действия"
              />
              <textarea
                placeholder="Подробности"
                value={editingTask?.details || ''}
                onChange={e => setEditingTask(editingTask ? { ...editingTask, details: e.target.value } : null)}
              />
              <div className="modal-actions">
                <button onClick={() => handleUpdateTask(editingTask)}>Сохранить</button>
                <button onClick={() => setEditingTask(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage; 
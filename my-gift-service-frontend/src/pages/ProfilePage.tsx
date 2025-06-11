import React, { useEffect, useState } from 'react';
import './ProfilePage.css';
import { getGifts, deleteGift, createGift, updateGift } from '../api/giftService';
import type { Gift, GiftInput } from '../api/giftService';
import { taskService } from '../api/taskService';
import type { Task } from '../api/taskService';
import SettingsPanel from '../components/SettingsPanel';
import GiftPageSettings from '../components/GiftPageSettings';

const initialGiftForm: GiftInput = {
  logo: '',
  title: '',
  description: '',
  isHighlighted: false,
  isClaimed: false,
  isHit: false,
  redirect_url: '',
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
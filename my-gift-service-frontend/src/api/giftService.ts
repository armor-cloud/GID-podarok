export interface Gift {
  id: number;
  logo: string;
  title: string;
  description: string;
  isHighlighted: boolean;
  isClaimed: boolean;
  isHit: boolean;
  redirect_url?: string;
}

export interface GiftInput {
  logo: string;
  title: string;
  description: string;
  isHighlighted?: boolean;
  isClaimed?: boolean;
  isHit?: boolean;
  redirect_url?: string;
}

const API_URL = 'http://127.0.0.1:8000/gifts';

export const getGifts = async (): Promise<Gift[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Ошибка загрузки подарков');
  return res.json();
};

export const createGift = async (gift: GiftInput): Promise<Gift> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gift),
  });
  if (!res.ok) throw new Error('Ошибка создания подарка');
  return res.json();
};

export const updateGift = async (id: number, gift: GiftInput): Promise<Gift> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gift),
  });
  if (!res.ok) throw new Error('Ошибка обновления подарка');
  return res.json();
};

export const deleteGift = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Ошибка удаления подарка');
};

export const toggleHighlight = async (id: number, isHighlighted: boolean, gift: GiftInput): Promise<Gift> => {
  // Просто используем updateGift с изменённым isHighlighted
  return updateGift(id, { ...gift, isHighlighted });
}; 
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export interface PromoCode {
  id: number;
  code: string;
  is_used: boolean;
  used_at: string | null;
}

export interface PopupConfig {
  imageUrl?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  benefits?: string[];
  activation_steps?: string[];
  terms_link_text?: string;
  terms_link_url?: string;
  legal_info?: string;
  offer_validity?: string;
  updated_at_text?: string;
  share_button_enabled?: boolean;
}

export interface Gift {
  id: number;
  logo: string;
  title: string;
  description: string;
  isHighlighted: boolean;
  isClaimed: boolean;
  isHit: boolean;
  redirect_url: string | null;
  action_type: 'redirect' | 'show_promo' | 'collect_email';
  popup_config?: PopupConfig;
  promo_codes: PromoCode[];
  points?: string;
}

export interface GiftInput {
  logo: string;
  title: string;
  description: string;
  isHighlighted: boolean;
  isClaimed: boolean;
  isHit: boolean;
  redirect_url?: string | null;
  action_type: string;
  popup_config?: PopupConfig;
}

export const getGifts = async (): Promise<Gift[]> => {
  try {
    const response = await axios.get(`${API_URL}/gifts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching gifts:', error);
    throw error;
  }
};

export const createGift = async (gift: GiftInput): Promise<Gift[]> => {
  try {
    const response = await axios.post(`${API_URL}/gifts`, gift);
    return response.data;
  } catch (error) {
    console.error('Error creating gift:', error);
    throw error;
  }
};

export const updateGift = async (id: number, gift: GiftInput): Promise<Gift[]> => {
  try {
    const response = await axios.put(`${API_URL}/gifts/${id}`, gift);
    return response.data;
  } catch (error) {
    console.error('Error updating gift:', error);
    throw error;
  }
};

export const deleteGift = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Ошибка удаления подарка');
};

export const toggleHighlight = async (id: number, isHighlighted: boolean, gift: GiftInput): Promise<Gift[]> => {
  // Просто используем updateGift с изменённым isHighlighted
  return updateGift(id, { ...gift, isHighlighted });
}; 
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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

export interface UTMParameter {
  key: string;
  value: string;
}

export interface Gift {
  id: number;
  logo: string;
  title: string;
  description: string;
  isHighlighted: boolean;
  isClaimed: boolean;
  isHit: boolean;
  redirect_url?: string;
  action_type: 'redirect' | 'show_promo' | 'collect_email';
  popup_config?: PopupConfig;
  promo_codes_count?: number;
  utm_config?: UTMParameter[];
}

export type GiftInput = Omit<Gift, 'id' | 'promo_codes_count'>;

export const getGifts = async (fromAdmin = false): Promise<Gift[]> => {
  const response = await api.get<Gift[]>('/gifts', {
    params: { from_admin: fromAdmin },
  });
    return response.data;
};

export const createGift = async (gift: GiftInput): Promise<Gift[]> => {
  const response = await api.post<Gift[]>('/gifts', gift);
    return response.data;
};

export const updateGift = async (id: number, gift: GiftInput): Promise<Gift[]> => {
  const response = await api.put<Gift[]>(`/gifts/${id}`, gift);
  return response.data;
};

export const uploadPromoCodes = async (giftId: number, file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/gifts/${giftId}/promo_codes/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
    return response.data;
};

export const deleteGift = async (id: number): Promise<{ ok: boolean }> => {
  const response = await api.delete(`/gifts/${id}`);
  return response.data;
};

export const toggleHighlight = async (id: number, isHighlighted: boolean, gift: GiftInput): Promise<Gift[]> => {
  // Просто используем updateGift с изменённым isHighlighted
  return updateGift(id, { ...gift, isHighlighted });
}; 
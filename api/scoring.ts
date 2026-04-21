import apiClient from './client';

export const scoringApi = {
  getMyScore: async () => {
    const { data } = await apiClient.get('/scoring/me');
    return data?.data ?? data;
  },
  getMyHistory: async () => {
    const { data } = await apiClient.get('/scoring/me/history');
    const payload = data?.data ?? data;
    return Array.isArray(payload) ? payload : (payload?.events ?? []);
  },
  getBuyerScore: async (buyerId: string) => {
    const { data } = await apiClient.get(`/scoring/buyer/${buyerId}`);
    return data?.data ?? data;
  },
};

import apiClient from './client';

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data?.data ?? data;
  },
  register: async (dto: Record<string, unknown>) => {
    const { data } = await apiClient.post('/auth/register', dto);
    return data?.data ?? data;
  },
  me: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data?.data ?? data;
  },
  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data?.data ?? data;
  },
};

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://resera-back-production.up.railway.app/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Inyectar token en cada request ────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh token automático ──────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('refreshToken');
        if (!refresh) throw new Error('no refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
        const newAccess = data?.data?.accessToken ?? data?.accessToken;
        await SecureStore.setItemAsync('accessToken', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

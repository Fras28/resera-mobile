import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';

interface User {
  id: string;
  role: 'vendor' | 'buyer' | 'admin';
  businessName: string;
  email: string;
  creditScore?: number;
  isVerified?: boolean;
  avgRating?: number;
  province?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  token:   null,
  loading: true,

  login: async (email, password) => {
    const data = await authApi.login(email, password);
    const { accessToken, refreshToken, user } = data;
    await SecureStore.setItemAsync('accessToken',  accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, token: accessToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) { set({ loading: false }); return; }
      const user = await authApi.me();
      set({ user, token, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

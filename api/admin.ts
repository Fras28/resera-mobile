import apiClient from './client';

export const adminApi = {
  getUsers: (params?: { role?: string; status?: string }) =>
    apiClient.get('/users', { params }).then((r) => r.data?.data ?? r.data),

  getPlatformStats: () =>
    apiClient.get('/users/admin/platform-stats').then((r) => r.data?.data ?? r.data),

  approve: (id: string) =>
    apiClient.patch(`/users/${id}/approve`).then((r) => r.data?.data ?? r.data),

  suspend: (id: string, notes?: string) =>
    apiClient.patch(`/users/${id}/suspend`, { notes }).then((r) => r.data?.data ?? r.data),

  block: (id: string, notes?: string) =>
    apiClient.patch(`/users/${id}/block`, { notes }).then((r) => r.data?.data ?? r.data),

  reactivate: (id: string) =>
    apiClient.patch(`/users/${id}/reactivate`).then((r) => r.data?.data ?? r.data),

  getCommissionStats: () =>
    apiClient.get('/payments/admin/commission-stats').then((r) => r.data?.data ?? r.data),
};

import apiClient from './client';

export const ordersApi = {
  // Comprador
  create: async (listingId: string, notes?: string) => {
    const { data } = await apiClient.post('/orders', { listingId, notes });
    return data?.data ?? data;
  },
  getAsBuyer: async () => {
    const { data } = await apiClient.get('/orders/mine/as-buyer');
    const p = data?.data ?? data;
    return Array.isArray(p) ? p : [];
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data?.data ?? data;
  },
  cancel: async (id: string) => {
    const { data } = await apiClient.patch(`/orders/${id}/cancel`);
    return data?.data ?? data;
  },

  // Vendedor
  getAsVendor: async () => {
    const { data } = await apiClient.get('/orders/mine/as-vendor');
    const p = data?.data ?? data;
    return Array.isArray(p) ? p : [];
  },
  dispatch: async (id: string) => {
    const { data } = await apiClient.patch(`/orders/${id}/dispatch`);
    return data?.data ?? data;
  },
  deliver: async (id: string) => {
    const { data } = await apiClient.patch(`/orders/${id}/deliver`);
    return data?.data ?? data;
  },
};

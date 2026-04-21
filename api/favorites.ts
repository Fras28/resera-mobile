import apiClient from './client';

export const favoritesApi = {
  /** IDs de vendedores favoritos del comprador (ligero, para el marketplace). */
  getVendorIds: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/favorites/vendors');
    const result = data?.data ?? data;
    return Array.isArray(result) ? result : [];
  },

  /** Vendedores favoritos con info completa. */
  getVendors: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/favorites/vendors/full');
    const result = data?.data ?? data;
    return Array.isArray(result) ? result : [];
  },

  /** Agrega un vendedor a favoritos. */
  add: async (vendorId: string): Promise<{ vendorId: string; favorited: true }> => {
    const { data } = await apiClient.post(`/favorites/vendors/${vendorId}`);
    return data?.data ?? data;
  },

  /** Quita un vendedor de favoritos. */
  remove: async (vendorId: string): Promise<{ vendorId: string; favorited: false }> => {
    const { data } = await apiClient.delete(`/favorites/vendors/${vendorId}`);
    return data?.data ?? data;
  },
};

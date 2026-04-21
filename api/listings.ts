import apiClient from './client';

export const listingsApi = {
  getAll:   async (params?: Record<string, unknown>) => {
    const { data } = await apiClient.get('/listings', { params });
    return data?.data ?? data;
  },
  getById:  async (id: string) => {
    const { data } = await apiClient.get(`/listings/${id}`);
    return data?.data ?? data;
  },
  getMine:  async () => {
    const { data } = await apiClient.get('/listings/vendor/mine');
    return data?.data ?? data;
  },
  create:   async (dto: Record<string, unknown>) => {
    const { data } = await apiClient.post('/listings', dto);
    return data?.data ?? data;
  },
  update:   async (id: string, dto: Record<string, unknown>) => {
    const { data } = await apiClient.patch(`/listings/${id}`, dto);
    return data?.data ?? data;
  },
  publish:  async (id: string) => {
    const { data } = await apiClient.patch(`/listings/${id}/publish`);
    return data?.data ?? data;
  },
  pause:    async (id: string) => {
    const { data } = await apiClient.patch(`/listings/${id}/pause`);
    return data?.data ?? data;
  },
  setCover: async (id: string, imageUrl: string) => {
    const { data } = await apiClient.patch(`/listings/${id}/cover`, { imageUrl });
    return data?.data ?? data;
  },
  getByVendor: async (vendorId: string) => {
    const { data } = await apiClient.get(`/listings/vendor/${vendorId}/store`);
    return data?.data ?? data;
  },
};

import apiClient from './client';

export const animalsApi = {
  list:   async (listingId: string) => {
    const { data } = await apiClient.get(`/listings/${listingId}/animals`);
    const p = data?.data ?? data;
    return Array.isArray(p) ? p : [];
  },
  add:    async (listingId: string, dto: Record<string, unknown>) => {
    const { data } = await apiClient.post(`/listings/${listingId}/animals`, dto);
    return data?.data ?? data;
  },
  update: async (listingId: string, animalId: string, dto: Record<string, unknown>) => {
    const { data } = await apiClient.patch(`/listings/${listingId}/animals/${animalId}`, dto);
    return data?.data ?? data;
  },
  remove: async (listingId: string, animalId: string) => {
    await apiClient.delete(`/listings/${listingId}/animals/${animalId}`);
  },
};

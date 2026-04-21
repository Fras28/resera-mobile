import apiClient from './client';

interface ImageAsset {
  uri: string;
  name?: string;
  type?: string;
}

export const uploadsApi = {
  /**
   * Sube una imagen a Cloudinary.
   * Acepta el objeto que devuelve expo-image-picker: { uri, name?, type? }
   * o simplemente una URI string.
   */
  uploadImage: async (asset: ImageAsset | string): Promise<string> => {
    const formData = new FormData();
    if (typeof asset === 'string') {
      const filename = asset.split('/').pop() ?? 'photo.jpg';
      formData.append('file', { uri: asset, name: filename, type: 'image/jpeg' } as unknown as Blob);
    } else {
      const filename = asset.name ?? asset.uri.split('/').pop() ?? 'photo.jpg';
      formData.append('file', { uri: asset.uri, name: filename, type: asset.type ?? 'image/jpeg' } as unknown as Blob);
    }

    const { data } = await apiClient.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const result = data?.data ?? data;
    // The backend returns { url, publicId }
    return typeof result === 'string' ? result : (result?.url ?? result?.secureUrl ?? '');
  },

  deleteImage: async (publicId: string): Promise<void> => {
    await apiClient.delete('/uploads/image', { params: { publicId } });
  },
};

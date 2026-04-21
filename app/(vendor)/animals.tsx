import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Image, TextInput, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { animalsApi } from '../../api/animals';
import { listingsApi } from '../../api/listings';
import { uploadsApi } from '../../api/uploads';

const EMPTY_ANIMAL = {
  caravana: '',
  breed: '',
  liveWeightKg: '',
  hookWeightKg: '',
  notes: '',
  imageUrl: '',
};

export default function AnimalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId: string;
    listingType: string;
    listingPricePerKg: string;
    coverImage: string;
  }>();

  const listingId      = params.listingId ?? '';
  const pricePerKg     = parseFloat(params.listingPricePerKg ?? '0');

  const [animals,     setAnimals]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<any>(null);
  const [form,        setForm]        = useState<any>(EMPTY_ANIMAL);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [coverImage,  setCoverImage]  = useState(params.coverImage ?? '');
  const [showCover,   setShowCover]   = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await animalsApi.list(listingId);
      setAnimals(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  // ── Image picker ──────────────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const url = await uploadsApi.uploadImage({
        uri: asset.uri,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      setForm((p: any) => ({ ...p, imageUrl: url }));
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // ── Open add / edit ───────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_ANIMAL);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      caravana:    a.caravana    ?? '',
      breed:       a.breed       ?? '',
      liveWeightKg: String(a.liveWeightKg ?? ''),
      hookWeightKg: String(a.hookWeightKg ?? ''),
      notes:       a.notes       ?? '',
      imageUrl:    a.imageUrl    ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.hookWeightKg) { setFormError('El peso en gancho es obligatorio.'); return; }
    setSaving(true); setFormError('');
    try {
      const dto = {
        ...form,
        liveWeightKg: form.liveWeightKg ? parseFloat(form.liveWeightKg) : undefined,
        hookWeightKg: parseFloat(form.hookWeightKg),
      };
      if (editing) await animalsApi.update(listingId, editing.id, dto);
      else         await animalsApi.add(listingId, dto);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    Alert.alert('Eliminar animal', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await animalsApi.remove(listingId, id); await load(); }
        catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  };

  // ── Set cover ─────────────────────────────────────────────────
  const handleSetCover = async (imageUrl: string) => {
    try {
      await listingsApi.setCover(listingId, imageUrl);
      setCoverImage(imageUrl);
      setShowCover(false);
      Alert.alert('✅ Portada actualizada');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la portada.');
    }
  };

  // ── Publish ───────────────────────────────────────────────────
  const handlePublish = async () => {
    if (animals.length === 0) {
      Alert.alert('Sin animales', 'Agregá al menos un animal antes de publicar.');
      return;
    }
    setPublishing(true);
    try {
      await listingsApi.publish(listingId);
      Alert.alert('✅ Publicado', 'El lote fue publicado correctamente.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo publicar.');
    } finally { setPublishing(false); }
  };

  // ── Totals ────────────────────────────────────────────────────
  const totalHook  = animals.reduce((s, a) => s + Number(a.hookWeightKg ?? 0), 0);
  const totalPrice = totalHook * pricePerKg;

  // ── All images across animals (for cover picker) ──────────────
  const allImages = animals.flatMap((a) => (a.imageUrl ? [{ url: a.imageUrl, animalId: a.id }] : []));

  // ── Render animal row ─────────────────────────────────────────
  const renderAnimal = ({ item: a, index }: { item: any; index: number }) => (
    <View className="bg-white/5 rounded-2xl overflow-hidden mb-3 mx-4">
      <View className="flex-row">
        {a.imageUrl ? (
          <Image source={{ uri: a.imageUrl }} className="w-24 h-24" resizeMode="cover" />
        ) : (
          <View className="w-24 h-24 bg-white/5 items-center justify-center">
            <Text className="text-3xl">🐄</Text>
          </View>
        )}
        <View className="flex-1 p-3">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-white font-bold text-sm">
                #{index + 1} {a.caravana ? `· ${a.caravana}` : ''}
              </Text>
              {a.breed ? <Text className="text-white/40 text-xs mt-0.5">{a.breed}</Text> : null}
            </View>
            <View className="flex-row gap-1.5">
              <TouchableOpacity
                onPress={() => openEdit(a)}
                className="bg-white/10 rounded-lg p-1.5"
              >
                <Text className="text-xs">✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(a.id)}
                className="bg-red-500/20 rounded-lg p-1.5"
              >
                <Text className="text-xs">🗑</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-3 mt-2">
            <View>
              <Text className="text-white/30 text-[10px]">Gancho</Text>
              <Text className="text-gold text-sm font-bold">{Number(a.hookWeightKg).toFixed(0)} kg</Text>
            </View>
            {a.liveWeightKg ? (
              <View>
                <Text className="text-white/30 text-[10px]">Vivo</Text>
                <Text className="text-white/60 text-sm">{Number(a.liveWeightKg).toFixed(0)} kg</Text>
              </View>
            ) : null}
            <View>
              <Text className="text-white/30 text-[10px]">Valor</Text>
              <Text className="text-green-400 text-sm font-bold">
                ${(Number(a.hookWeightKg) * pricePerKg).toLocaleString('es-AR')}
              </Text>
            </View>
          </View>

          {a.notes ? (
            <Text className="text-white/30 text-xs mt-1.5" numberOfLines={1}>{a.notes}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 flex-row justify-between items-center border-b border-white/5">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/5 rounded-xl p-2.5">
            <Text className="text-white text-base">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-gold text-xs font-bold uppercase tracking-widest">Lote</Text>
            <Text className="text-white text-lg font-black">Animales</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          className="bg-meat-red rounded-xl px-4 py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A853" size="large" />
        </View>
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(a) => a.id}
          renderItem={renderAnimal}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
          ListHeaderComponent={
            /* Cover image strip */
            coverImage ? (
              <View className="mx-4 mb-4 rounded-2xl overflow-hidden">
                <Image source={{ uri: coverImage }} className="w-full h-36" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/30 items-end justify-end p-3">
                  <TouchableOpacity
                    onPress={() => setShowCover(true)}
                    className="bg-black/60 rounded-xl px-3 py-1.5"
                  >
                    <Text className="text-white text-xs font-semibold">Cambiar portada</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : allImages.length > 0 ? (
              <TouchableOpacity
                onPress={() => setShowCover(true)}
                className="mx-4 mb-4 bg-white/5 border border-white/10 border-dashed rounded-2xl p-5 items-center"
              >
                <Text className="text-2xl mb-1">🖼</Text>
                <Text className="text-white/50 text-sm font-semibold">Elegir portada del lote</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">🐄</Text>
              <Text className="text-white/40 mb-1 font-medium">Sin animales todavía</Text>
              <Text className="text-white/20 text-sm">Agregá los animales de este lote</Text>
            </View>
          }
          ListFooterComponent={
            animals.length > 0 ? (
              <View className="mx-4 mt-2">
                {/* Totals bar */}
                <View className="bg-white/5 rounded-2xl p-4 mb-4 flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-white/30 text-[10px] uppercase tracking-wider">Animales</Text>
                    <Text className="text-white text-xl font-black mt-0.5">{animals.length}</Text>
                  </View>
                  <View className="w-px bg-white/10" />
                  <View className="items-center">
                    <Text className="text-white/30 text-[10px] uppercase tracking-wider">Kg gancho</Text>
                    <Text className="text-gold text-xl font-black mt-0.5">{totalHook.toFixed(0)}</Text>
                  </View>
                  <View className="w-px bg-white/10" />
                  <View className="items-center">
                    <Text className="text-white/30 text-[10px] uppercase tracking-wider">Total</Text>
                    <Text className="text-green-400 text-xl font-black mt-0.5">
                      ${totalPrice.toLocaleString('es-AR')}
                    </Text>
                  </View>
                </View>

                {/* Publish button */}
                <TouchableOpacity
                  onPress={handlePublish}
                  disabled={publishing}
                  className="bg-green-600/90 rounded-2xl py-4 items-center mb-2"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base uppercase tracking-wider">
                    {publishing ? 'Publicando...' : '🚀 Publicar lote'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* ── Cover picker modal ───────────────────────────────────── */}
      <Modal visible={showCover} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-dark">
          <SafeAreaView edges={['top']} className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
              <Text className="text-white text-lg font-bold">Elegir portada</Text>
              <TouchableOpacity onPress={() => setShowCover(false)}>
                <Text className="text-white/50 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            {allImages.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-white/30">Primero agregá imágenes a los animales</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-white/40 text-xs mb-4">Tocá una imagen para usarla como portada del lote</Text>
                <View className="flex-row flex-wrap gap-3">
                  {allImages.map(({ url, animalId }) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => handleSetCover(url)}
                      className="rounded-xl overflow-hidden"
                      style={{ width: '47%', aspectRatio: 1 }}
                    >
                      <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      {url === coverImage && (
                        <View className="absolute inset-0 bg-gold/30 items-center justify-center">
                          <Text className="text-white text-2xl">✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Animal form modal ────────────────────────────────────── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-dark">
          <SafeAreaView edges={['top']} className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
              <Text className="text-white text-lg font-bold">{editing ? 'Editar animal' : 'Nuevo animal'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text className="text-white/50 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
              {/* Image */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Foto del animal</Text>
                {form.imageUrl ? (
                  <View className="rounded-2xl overflow-hidden mb-2">
                    <Image source={{ uri: form.imageUrl }} className="w-full h-48" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setForm((p: any) => ({ ...p, imageUrl: '' }))}
                      className="absolute top-2 right-2 bg-black/60 rounded-full w-8 h-8 items-center justify-center"
                    >
                      <Text className="text-white text-xs">✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={uploading}
                  className="bg-white/5 border border-white/10 border-dashed rounded-xl py-4 items-center"
                >
                  {uploading ? (
                    <ActivityIndicator color="#D4A853" />
                  ) : (
                    <Text className="text-white/40 text-sm">
                      {form.imageUrl ? '📷 Cambiar foto' : '📷 Agregar foto'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Caravana + Raza */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Caravana</Text>
                  <TextInput
                    value={form.caravana}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, caravana: v }))}
                    placeholder="Ej. AR-0012"
                    placeholderTextColor="#ffffff30"
                    autoCapitalize="characters"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Raza</Text>
                  <TextInput
                    value={form.breed}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, breed: v }))}
                    placeholder="Ej. Aberdeen Angus"
                    placeholderTextColor="#ffffff30"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
              </View>

              {/* Pesos */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Peso vivo (kg)</Text>
                  <TextInput
                    value={form.liveWeightKg}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, liveWeightKg: v }))}
                    placeholder="Ej. 480"
                    placeholderTextColor="#ffffff30"
                    keyboardType="numeric"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Peso gancho (kg) *</Text>
                  <TextInput
                    value={form.hookWeightKg}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, hookWeightKg: v }))}
                    placeholder="Ej. 270"
                    placeholderTextColor="#ffffff30"
                    keyboardType="numeric"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
              </View>

              {/* Precio estimado (calculado) */}
              {form.hookWeightKg ? (
                <View className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex-row justify-between items-center">
                  <Text className="text-white/50 text-sm">Valor estimado</Text>
                  <Text className="text-gold font-bold text-base">
                    ${(parseFloat(form.hookWeightKg) * pricePerKg).toLocaleString('es-AR')}
                  </Text>
                </View>
              ) : null}

              {/* Notas */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Notas</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm((p: any) => ({ ...p, notes: v }))}
                  placeholder="Observaciones del animal..."
                  placeholderTextColor="#ffffff30"
                  multiline
                  numberOfLines={3}
                  className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                />
              </View>

              {formError ? (
                <View className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <Text className="text-red-400 text-sm">{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || uploading}
                className="bg-meat-red rounded-2xl py-4 items-center mt-2"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-base uppercase tracking-wider">
                  {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Agregar animal →')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

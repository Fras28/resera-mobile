import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Image, TextInput, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listingsApi } from '../../api/listings';

const TYPE_LABELS: Record<string, string> = {
  res_entera: 'Res Entera', media_res: 'Media Res', lote_cortes: 'Lote/Cortes',
};
const SPECIES: Array<{ value: string; label: string }> = [
  { value: 'vacuno', label: 'Vacuno' }, { value: 'cerdo', label: 'Cerdo' },
  { value: 'cordero', label: 'Cordero' }, { value: 'otro', label: 'Otro' },
];
const TYPES: Array<{ value: string; label: string }> = [
  { value: 'res_entera', label: 'Res Entera' },
  { value: 'media_res', label: 'Media Res' },
  { value: 'lote_cortes', label: 'Lote/Cortes' },
];
const STATUS_COLORS: Record<string, string> = {
  borrador: '#6B7280', publicado: '#10B981', reservado: '#3B82F6',
  vendido: '#8B5CF6', pausado: '#F59E0B', vencido: '#EF4444',
};
const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador', publicado: 'Publicado', reservado: 'Reservado',
  vendido: 'Vendido', pausado: 'Pausado', vencido: 'Vencido',
};

const EMPTY_FORM = {
  type: 'res_entera', species: 'vacuno', breed: '',
  pricePerKg: '', description: '', originFarm: '',
  originProvince: '', pickupCity: '', pickupProvince: '',
  deliveryAvailable: false,
};

export default function VendorListingsScreen() {
  const router = useRouter();
  const [listings,    setListings]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<any>(null);
  const [form,        setForm]        = useState<any>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await listingsApi.getMine();
      setListings(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };
  const openEdit   = (l: any) => {
    setEditing(l);
    setForm({ ...EMPTY_FORM, ...l, pricePerKg: String(l.pricePerKg) });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.pricePerKg) { setFormError('El precio por kg es obligatorio.'); return; }
    setSaving(true); setFormError('');
    try {
      const dto = { ...form, pricePerKg: parseFloat(form.pricePerKg), hookWeightKg: 0 };
      if (editing) await listingsApi.update(editing.id, dto);
      else         await listingsApi.create(dto);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handlePublish = async (id: string) => {
    try { await listingsApi.publish(id); await load(); }
    catch (err: any) { Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo publicar.'); }
  };

  const handlePause = async (id: string) => {
    try { await listingsApi.pause(id); await load(); }
    catch { /* silent */ }
  };

  const renderListing = ({ item: l }: { item: any }) => {
    const hero = l.coverImage || l.images?.[0] || null;
    const color = STATUS_COLORS[l.status] ?? '#6B7280';
    return (
      <View className="bg-white/5 rounded-2xl overflow-hidden mb-4 mx-4">
        {hero ? (
          <Image source={{ uri: hero }} className="w-full h-40" resizeMode="cover" />
        ) : (
          <View className="w-full h-32 bg-white/5 items-center justify-center">
            <Text className="text-4xl">🥩</Text>
          </View>
        )}

        <View className="p-4">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{TYPE_LABELS[l.type] ?? l.type}</Text>
              <Text className="text-white/40 text-xs mt-0.5">
                {l.pickupCity ? `${l.pickupCity}, ` : ''}{l.pickupProvince ?? ''}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: color + '20' }}>
              <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{STATUS_LABELS[l.status] ?? l.status}</Text>
            </View>
          </View>

          <View className="flex-row bg-white/5 rounded-xl p-3 mb-3 gap-2">
            {[
              ['$/kg', `$${Number(l.pricePerKg).toLocaleString('es-AR')}`],
              ['Peso', `${Number(l.hookWeightKg).toFixed(0)} kg`],
              ['Total', `$${Number(l.totalPrice).toLocaleString('es-AR')}`],
            ].map(([label, value], i) => (
              <View key={label as string} className={`flex-1 items-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <Text className="text-white/30 text-[10px]">{label}</Text>
                <Text className="text-gold text-sm font-bold mt-0.5">{value}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(vendor)/animals', params: { listingId: l.id, listingType: l.type, listingPricePerKg: l.pricePerKg, coverImage: l.coverImage ?? '' } })}
              className="flex-1 bg-gold/10 border border-gold/20 rounded-xl py-2.5 items-center"
            >
              <Text className="text-gold text-xs font-bold">🐄 Animales</Text>
            </TouchableOpacity>

            {!['vendido', 'vencido'].includes(l.status) && (
              <TouchableOpacity
                onPress={() => openEdit(l)}
                className="bg-white/5 rounded-xl py-2.5 px-3 items-center"
              >
                <Text className="text-white/60 text-xs">✏️</Text>
              </TouchableOpacity>
            )}

            {l.status === 'borrador' && (
              <TouchableOpacity
                onPress={() => handlePublish(l.id)}
                className="bg-green-500/20 border border-green-500/30 rounded-xl py-2.5 px-3 items-center"
              >
                <Text className="text-green-400 text-xs font-bold">🚀</Text>
              </TouchableOpacity>
            )}
            {l.status === 'publicado' && (
              <TouchableOpacity
                onPress={() => handlePause(l.id)}
                className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl py-2.5 px-3 items-center"
              >
                <Text className="text-yellow-400 text-xs font-bold">⏸</Text>
              </TouchableOpacity>
            )}
            {l.status === 'pausado' && (
              <TouchableOpacity
                onPress={() => handlePublish(l.id)}
                className="bg-green-500/20 border border-green-500/30 rounded-xl py-2.5 px-3 items-center"
              >
                <Text className="text-green-400 text-xs font-bold">▶</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <View className="px-4 pt-4 pb-3 flex-row justify-between items-center">
        <View>
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Vendedor</Text>
          <Text className="text-white text-2xl font-black">Mis Lotes</Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          className="bg-meat-red rounded-xl px-4 py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A853" size="large" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={renderListing}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">🥩</Text>
              <Text className="text-white/40 mb-1 font-medium">No tenés lotes todavía</Text>
              <Text className="text-white/20 text-sm">Creá tu primera publicación</Text>
            </View>
          }
        />
      )}

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-dark">
          <SafeAreaView edges={['top']} className="flex-1">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
              <Text className="text-white text-lg font-bold">{editing ? 'Editar lote' : 'Nuevo lote'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text className="text-white/50 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
              {/* Tipo */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Tipo</Text>
                <View className="flex-row gap-2">
                  {TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => setForm((p: any) => ({ ...p, type: t.value }))}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${form.type === t.value ? 'bg-gold/20 border-gold' : 'bg-white/5 border-white/10'}`}
                    >
                      <Text className={`text-xs font-semibold ${form.type === t.value ? 'text-gold' : 'text-white/50'}`}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Especie */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Especie</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SPECIES.map((s) => (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => setForm((p: any) => ({ ...p, species: s.value }))}
                      className={`px-4 py-2 rounded-xl border ${form.species === s.value ? 'bg-gold/20 border-gold' : 'bg-white/5 border-white/10'}`}
                    >
                      <Text className={`text-xs font-semibold ${form.species === s.value ? 'text-gold' : 'text-white/50'}`}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Precio */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Precio por kg (ARS) *</Text>
                <TextInput
                  value={form.pricePerKg}
                  onChangeText={(v) => setForm((p: any) => ({ ...p, pricePerKg: v }))}
                  placeholder="Ej. 3500"
                  placeholderTextColor="#ffffff30"
                  keyboardType="numeric"
                  className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                />
              </View>

              {/* Descripción */}
              <View>
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Descripción</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => setForm((p: any) => ({ ...p, description: v }))}
                  placeholder="Información adicional..."
                  placeholderTextColor="#ffffff30"
                  multiline
                  numberOfLines={3}
                  className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                />
              </View>

              {/* Origen */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Establecimiento</Text>
                  <TextInput
                    value={form.originFarm}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, originFarm: v }))}
                    placeholder="Nombre del campo"
                    placeholderTextColor="#ffffff30"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Provincia origen</Text>
                  <TextInput
                    value={form.originProvince}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, originProvince: v }))}
                    placeholder="Ej. Buenos Aires"
                    placeholderTextColor="#ffffff30"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
              </View>

              {/* Retiro */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Ciudad retiro</Text>
                  <TextInput
                    value={form.pickupCity}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, pickupCity: v }))}
                    placeholder="Rosario"
                    placeholderTextColor="#ffffff30"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Provincia retiro</Text>
                  <TextInput
                    value={form.pickupProvince}
                    onChangeText={(v) => setForm((p: any) => ({ ...p, pickupProvince: v }))}
                    placeholder="Santa Fe"
                    placeholderTextColor="#ffffff30"
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                  />
                </View>
              </View>

              {formError ? (
                <View className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <Text className="text-red-400 text-sm">{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-meat-red rounded-2xl py-4 items-center mt-2"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-base uppercase tracking-wider">
                  {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear lote →')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

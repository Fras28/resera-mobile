import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { listingsApi }  from '../../api/listings';
import { ordersApi }    from '../../api/orders';
import { favoritesApi } from '../../api/favorites';
import { useAuthStore } from '../../store/auth';
import { distanceBetweenProvinces, distanceLabel } from '../../utils/provinces';

const TYPE_LABELS: Record<string, string> = {
  res_entera: 'Res Entera', media_res: 'Media Res', lote_cortes: 'Lote/Cortes',
};
const SPECIES_LABELS: Record<string, string> = {
  vacuno: 'Vacuno', cerdo: 'Cerdo', cordero: 'Cordero', otro: 'Otro',
};

export default function VendorStoreScreen() {
  const router = useRouter();
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const user = useAuthStore((s) => s.user);
  const isBuyer       = user?.role === 'buyer';
  const buyerProvince = user?.province ?? null;

  const [listings,    setListings]    = useState<any[]>([]);
  const [isFavorite,  setIsFavorite]  = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<any>(null);
  const [buying,      setBuying]      = useState(false);

  const load = useCallback(async () => {
    if (!vendorId) return;
    try {
      const [data, favIds] = await Promise.all([
        listingsApi.getByVendor(vendorId),
        isBuyer ? favoritesApi.getVendorIds().catch(() => [] as string[]) : Promise.resolve([] as string[]),
      ]);
      setListings(Array.isArray(data) ? data : []);
      setIsFavorite((favIds as string[]).includes(vendorId));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [vendorId, isBuyer]);

  useEffect(() => { load(); }, [load]);

  const vendor      = listings[0]?.vendor ?? null;
  const vendorProv  = vendor?.province ?? '';
  const vendorKm    = buyerProvince && vendorProv
    ? distanceBetweenProvinces(buyerProvince, vendorProv)
    : null;

  const handleToggleFavorite = async () => {
    if (!vendorId || !isBuyer || togglingFav) return;
    setTogglingFav(true);
    const wasFav = isFavorite;
    setIsFavorite(!wasFav);
    try {
      if (wasFav) await favoritesApi.remove(vendorId);
      else         await favoritesApi.add(vendorId);
    } catch {
      setIsFavorite(wasFav);
    } finally {
      setTogglingFav(false);
    }
  };

  const handleBuy = async () => {
    if (!selected) return;
    setBuying(true);
    try {
      await ordersApi.create(selected.id);
      setSelected(null);
      alert('¡Pedido creado! Revisá tus pedidos para continuar.');
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'No se pudo crear el pedido.');
    } finally { setBuying(false); }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-dark items-center justify-center" edges={['top']}>
        <ActivityIndicator color="#D4A853" size="large" />
        <Text className="text-white/40 text-sm mt-4">Cargando lotes...</Text>
      </SafeAreaView>
    );
  }

  const renderCard = ({ item: l }: { item: any }) => {
    const hero = l.coverImage || l.images?.[0] || null;
    return (
      <TouchableOpacity
        onPress={() => setSelected(l)}
        className="bg-white/5 rounded-2xl overflow-hidden mb-4 mx-4"
        activeOpacity={0.85}
      >
        {hero ? (
          <Image source={{ uri: hero }} className="w-full h-44" resizeMode="cover" />
        ) : (
          <View className="w-full h-44 bg-white/5 items-center justify-center">
            <Text className="text-5xl">🥩</Text>
            <Text className="text-white/20 text-xs mt-2 uppercase tracking-widest">Sin foto</Text>
          </View>
        )}

        <View className="p-4">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest">
            {TYPE_LABELS[l.type] ?? l.type} · {SPECIES_LABELS[l.species] ?? l.species}
          </Text>
          <Text className="text-white/50 text-xs mt-0.5">
            {l.originProvince ?? 'Sin provincia'}{l.originFarm ? ` · ${l.originFarm}` : ''}
          </Text>
          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/5">
            <Text className="text-white/40 text-xs">{Number(l.hookWeightKg).toFixed(0)} kg gancho</Text>
            <View className="items-end">
              <Text className="text-white text-sm font-bold">
                ARS {Number(l.totalPrice).toLocaleString('es-AR')}
              </Text>
              <Text className="text-gold text-xs">
                ${Number(l.pricePerKg).toLocaleString('es-AR')}/kg
              </Text>
            </View>
          </View>
          {l.description ? (
            <Text className="text-white/40 text-xs mt-2 leading-4" numberOfLines={2}>
              {l.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      {/* Vendor Header */}
      <View className="px-4 pt-4 pb-5 border-b border-white/5">
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-gold text-sm">← Volver al mercado</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          {/* Avatar */}
          <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center">
            <Text style={{ fontSize: 28 }}>🏭</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-white text-xl font-black">
                {vendor?.businessName ?? 'Vendedor'}
              </Text>
              {vendor?.isVerified && (
                <View className="bg-gold/15 px-2 py-0.5 rounded-full">
                  <Text className="text-gold text-[10px] font-bold uppercase tracking-wider">✓ Verificado</Text>
                </View>
              )}
            </View>

            <View className="flex-row flex-wrap gap-3 mt-1">
              {vendorProv ? (
                <Text className="text-white/40 text-xs">
                  📍 {vendorProv}
                  {vendorKm !== null && (
                    <Text className={vendorKm === 0 ? 'text-gold font-semibold' : ''}>
                      {' '}({distanceLabel(vendorKm)})
                    </Text>
                  )}
                </Text>
              ) : null}
              {vendor?.avgRating !== undefined && (
                <Text className="text-white/40 text-xs">
                  ⭐ {Number(vendor.avgRating).toFixed(1)} calificación
                </Text>
              )}
              {vendor?.totalOperations !== undefined && vendor.totalOperations > 0 && (
                <Text className="text-white/40 text-xs">
                  ✓ {vendor.totalOperations} operaciones
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats + Favorite */}
        <View className="flex-row gap-3 mt-4">
          <View className="bg-white/5 rounded-xl px-4 py-3 flex-1 items-center">
            <Text className="text-white text-2xl font-black">{listings.length}</Text>
            <Text className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Lotes activos</Text>
          </View>
          {isBuyer && (
            <TouchableOpacity
              onPress={handleToggleFavorite}
              disabled={togglingFav}
              className={`flex-1 rounded-xl py-3 items-center justify-center flex-row gap-2 ${
                isFavorite
                  ? 'bg-gold'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {togglingFav ? (
                <ActivityIndicator size="small" color={isFavorite ? '#111' : '#D4A853'} />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>{isFavorite ? '❤️' : '🤍'}</Text>
                  <Text className={`text-sm font-bold uppercase tracking-wider ${isFavorite ? 'text-dark' : 'text-white/60'}`}>
                    {isFavorite ? 'Favorito' : 'Favorito'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section title */}
      <View className="px-4 pt-5 pb-2">
        <Text className="text-white/40 text-xs font-bold uppercase tracking-widest">Lotes disponibles</Text>
      </View>

      {listings.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-4xl mb-3">📦</Text>
          <Text className="text-white/40 text-center px-8">
            Este vendedor no tiene lotes disponibles en este momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View className="flex-1 bg-dark">
            <ScrollView>
              {(selected.coverImage || selected.images?.[0]) ? (
                <Image
                  source={{ uri: selected.coverImage || selected.images[0] }}
                  className="w-full h-64"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-40 bg-white/5 items-center justify-center">
                  <Text className="text-5xl">🥩</Text>
                </View>
              )}

              <View className="p-6">
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1">
                    <Text className="text-gold text-xs font-bold uppercase tracking-widest">
                      {TYPE_LABELS[selected.type]} · {SPECIES_LABELS[selected.species]}
                    </Text>
                    <Text className="text-white text-2xl font-black mt-1">
                      {selected.originFarm ?? 'Lote disponible'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} className="p-2">
                    <Text className="text-white/50 text-xl">✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Price block */}
                <View className="bg-white/5 rounded-2xl p-5 mb-6">
                  <Text className="text-white/40 text-xs uppercase tracking-widest">Precio total</Text>
                  <Text className="text-gold text-4xl font-black mt-1">
                    ARS {Number(selected.totalPrice).toLocaleString('es-AR')}
                  </Text>
                  <Text className="text-white/40 text-sm mt-1">
                    ${Number(selected.pricePerKg).toLocaleString('es-AR')}/kg · {Number(selected.hookWeightKg).toFixed(0)} kg gancho
                  </Text>
                </View>

                {/* Details grid */}
                <View className="flex-row flex-wrap gap-3 mb-6">
                  {[
                    ['Especie',   SPECIES_LABELS[selected.species]],
                    ['Provincia', selected.originProvince ?? '—'],
                    ['Estab.',    selected.originFarm ?? '—'],
                    ['Entrega',   selected.deliveryAvailable ? 'Disponible' : 'Retiro planta'],
                  ].map(([label, value]) => (
                    <View key={label} className="bg-white/5 rounded-xl p-3 flex-1 min-w-[40%]">
                      <Text className="text-white/40 text-[9px] uppercase tracking-widest">{label}</Text>
                      <Text className="text-white text-sm font-semibold mt-0.5">{value}</Text>
                    </View>
                  ))}
                </View>

                {selected.description ? (
                  <View className="bg-white/5 rounded-xl p-4 mb-6">
                    <Text className="text-white/60 text-sm leading-5">{selected.description}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View className="px-6 pb-8 pt-2 border-t border-white/5">
              <TouchableOpacity
                onPress={handleBuy}
                disabled={buying || selected.status !== 'publicado'}
                className="bg-meat-red rounded-2xl py-4 items-center"
                activeOpacity={0.8}
              >
                {buying
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white font-bold text-base uppercase tracking-wider">Comprar este lote</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listingsApi } from '../../api/listings';
import { ordersApi }   from '../../api/orders';
import { favoritesApi } from '../../api/favorites';
import { useAuthStore } from '../../store/auth';
import { distanceBetweenProvinces, distanceLabel } from '../../utils/provinces';
import {
  FadeInView,
  SlideInView,
  PressableScale,
  HeartButton,
  ListingCardSkeleton,
} from '../../components/animated';
import { staggerDelay } from '../../utils/motion';

const TYPE_LABELS: Record<string, string> = {
  res_entera: 'Res Entera', media_res: 'Media Res', lote_cortes: 'Lote/Cortes',
};
const SPECIES_LABELS: Record<string, string> = {
  vacuno: 'Vacuno', cerdo: 'Cerdo', cordero: 'Cordero', otro: 'Otro',
};

export default function MarketplaceScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const buyerProvince = user?.province ?? null;

  const [listings,    setListings]    = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState<any>(null);
  const [buying,      setBuying]      = useState(false);
  const [togglingFav, setTogglingFav] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [data, favIds] = await Promise.all([
        listingsApi.getAll(),
        favoritesApi.getVendorIds().catch(() => [] as string[]),
      ]);
      setListings(Array.isArray(data) ? data : []);
      setFavoriteIds(new Set(favIds));
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sort: favorites first → proximity → recency
  const sorted = useMemo(() => {
    return [...listings].sort((a, b) => {
      const aFav = favoriteIds.has(a.vendor?.id ?? '') ? 1 : 0;
      const bFav = favoriteIds.has(b.vendor?.id ?? '') ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;

      if (buyerProvince) {
        const aProv = a.originProvince ?? a.vendor?.province ?? '';
        const bProv = b.originProvince ?? b.vendor?.province ?? '';
        const aDist = distanceBetweenProvinces(buyerProvince, aProv);
        const bDist = distanceBetweenProvinces(buyerProvince, bProv);
        if (aDist !== bDist) return aDist - bDist;
      }

      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [listings, favoriteIds, buyerProvince]);

  const filtered = sorted.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.originProvince?.toLowerCase().includes(q) ||
      l.originFarm?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.vendor?.businessName?.toLowerCase().includes(q)
    );
  });

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

  const toggleFavorite = async (vendorId: string) => {
    if (!vendorId || togglingFav) return;
    setTogglingFav(vendorId);
    const isFav = favoriteIds.has(vendorId);
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(vendorId); else next.add(vendorId);
      return next;
    });
    try {
      if (isFav) await favoritesApi.remove(vendorId);
      else        await favoritesApi.add(vendorId);
    } catch {
      // Revert on error
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(vendorId); else next.delete(vendorId);
        return next;
      });
    } finally {
      setTogglingFav(null);
    }
  };

  const renderCard = ({ item: l, index }: { item: any; index: number }) => {
    const hero      = l.coverImage || l.images?.[0] || null;
    const vendorId  = l.vendor?.id ?? null;
    const isFav     = vendorId ? favoriteIds.has(vendorId) : false;
    const vendorProv = l.originProvince ?? l.vendor?.province ?? '';
    const km        = buyerProvince && vendorProv
      ? distanceBetweenProvinces(buyerProvince, vendorProv)
      : null;

    return (
      <FadeInView delay={staggerDelay(index)} translateY={12}>
        <PressableScale
          onPress={() => setSelected(l)}
          className="bg-white/5 rounded-2xl overflow-hidden mb-4 mx-4"
          accessibilityLabel={`Lote ${l.originFarm ?? ''} ${TYPE_LABELS[l.type] ?? l.type}`}
          accessibilityHint="Toca para ver detalle del lote"
        >
        <View className="relative">
          {hero ? (
            <Image source={{ uri: hero }} className="w-full h-48" resizeMode="cover" />
          ) : (
            <View className="w-full h-48 bg-white/5 items-center justify-center">
              <Text className="text-5xl">🥩</Text>
              <Text className="text-white/20 text-xs mt-2 uppercase tracking-widest">Sin foto</Text>
            </View>
          )}

          {/* Distance badge */}
          {km !== null && (
            <View className={`absolute top-3 left-3 px-2 py-1 rounded-full ${km === 0 ? 'bg-gold/90' : 'bg-black/60'}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${km === 0 ? 'text-dark' : 'text-white/80'}`}>
                {distanceLabel(km)}
              </Text>
            </View>
          )}

          {/* Favorite button */}
          {vendorId && (
            <View className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 items-center justify-center">
              <HeartButton
                active={isFav}
                loading={togglingFav === vendorId}
                onPress={() => toggleFavorite(vendorId)}
              />
            </View>
          )}

          {/* Delivery badge */}
          {l.deliveryAvailable && (
            <View className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-full">
              <Text className="text-gold text-[10px] font-bold uppercase tracking-wider">Con entrega</Text>
            </View>
          )}

          {/* Price overlay */}
          {hero && (
            <View className="absolute bottom-3 right-3 items-end">
              <Text className="text-white text-lg font-black drop-shadow">
                ${Number(l.pricePerKg).toLocaleString('es-AR')}
              </Text>
              <Text className="text-white/60 text-[10px]">por kg</Text>
            </View>
          )}
        </View>

        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-gold text-xs font-bold uppercase tracking-widest">
                {TYPE_LABELS[l.type] ?? l.type} · {SPECIES_LABELS[l.species] ?? l.species}
              </Text>
              <Text className="text-white/50 text-xs mt-0.5">
                {l.originProvince ?? 'Sin provincia'}{l.originFarm ? ` · ${l.originFarm}` : ''}
              </Text>
            </View>
            {!hero && (
              <View className="items-end">
                <Text className="text-gold text-lg font-black">
                  ${Number(l.pricePerKg).toLocaleString('es-AR')}
                </Text>
                <Text className="text-white/30 text-[10px]">por kg</Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/5">
            <Text className="text-white/40 text-xs">{Number(l.hookWeightKg).toFixed(0)} kg gancho</Text>
            <Text className="text-white text-sm font-bold">
              ARS {Number(l.totalPrice).toLocaleString('es-AR')}
            </Text>
          </View>

          {/* Vendor row + Ver todos */}
          {l.vendor && (
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/5">
              <Text className="text-white/40 text-xs">
                🏭 {l.vendor.businessName}
                {l.vendor.isVerified ? ' ✓' : ''}
              </Text>
              {vendorId && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    router.push(`/(buyer)/vendor-store?vendorId=${vendorId}`);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-gold text-xs font-bold uppercase tracking-wider">Ver todos →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        </PressableScale>
      </FadeInView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      {/* Header */}
      <SlideInView from="up" distance={12} className="px-4 pt-4 pb-3">
        <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Mercado</Text>
        <Text className="text-white text-2xl font-black">Catálogo de Reses</Text>
        {buyerProvince && (
          <Text className="text-white/30 text-xs mt-1">
            📍 {buyerProvince} · ordenado por proximidad
          </Text>
        )}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscá por provincia, establecimiento o vendedor..."
          placeholderTextColor="#ffffff30"
          className="mt-3 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm"
          accessibilityLabel="Buscar lotes"
        />
      </SlideInView>

      {loading ? (
        <View className="pt-2" accessibilityLabel="Cargando lotes" accessibilityRole="progressbar">
          {[0, 1, 2].map((i) => (
            <FadeInView key={i} delay={staggerDelay(i, 60)}>
              <ListingCardSkeleton />
            </FadeInView>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-4xl mb-3">🥩</Text>
              <Text className="text-white/40">No hay lotes disponibles</Text>
            </View>
          }
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

                {/* Vendor block + favorite + Ver todos */}
                {selected.vendor && (
                  <View className="bg-white/5 rounded-xl p-4 mb-6">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                        <Text className="text-white text-lg">🏭</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-sm">
                          {selected.vendor.businessName}
                          {selected.vendor.isVerified ? ' ✓' : ''}
                        </Text>
                        <Text className="text-white/40 text-xs">
                          ⭐ {Number(selected.vendor.avgRating ?? 0).toFixed(1)}
                          {selected.vendor.province ? `  ·  ${selected.vendor.province}` : ''}
                        </Text>
                      </View>
                      {/* Favorite toggle in modal */}
                      {selected.vendor.id && (
                        <TouchableOpacity
                          onPress={() => toggleFavorite(selected.vendor.id)}
                          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                        >
                          {togglingFav === selected.vendor.id ? (
                            <ActivityIndicator size="small" color="#D4A853" />
                          ) : (
                            <Text style={{ fontSize: 18 }}>
                              {favoriteIds.has(selected.vendor.id) ? '❤️' : '🤍'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* Ver todos del vendedor */}
                    {selected.vendor.id && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelected(null);
                          router.push(`/(buyer)/vendor-store?vendorId=${selected.vendor.id}`);
                        }}
                        className="mt-3 pt-3 border-t border-white/5"
                      >
                        <Text className="text-gold text-xs font-bold uppercase tracking-wider text-center">
                          Ver todos los lotes de este vendedor →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="px-6 pb-8 pt-2 border-t border-white/5">
              <PressableScale
                onPress={handleBuy}
                disabled={buying || selected.status !== 'publicado'}
                className="bg-meat-red rounded-2xl py-4 items-center"
                accessibilityLabel="Comprar este lote"
                accessibilityState={{ busy: buying, disabled: buying || selected.status !== 'publicado' }}
              >
                {buying
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white font-bold text-base uppercase tracking-wider">Comprar este lote</Text>
                }
              </PressableScale>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listingsApi } from '../../api/listings';
import { ordersApi } from '../../api/orders';
import { useAuthStore } from '../../store/auth';

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const [listings,   setListings]   = useState<any[]>([]);
  const [orders,     setOrders]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [l, o] = await Promise.all([listingsApi.getMine(), ordersApi.getAsVendor()]);
      setListings(Array.isArray(l) ? l : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active    = listings.filter((l) => l.status === 'publicado').length;
  const pending   = orders.filter((o) => o.status === 'esperando_seña' || o.status === 'seña_pagada').length;
  const revenue   = orders
    .filter((o) => o.status === 'entregado')
    .reduce((s, o) => s + Number(o.totalAmount), 0);

  const stats = [
    { label: 'Lotes activos',     value: active,                              emoji: '🥩' },
    { label: 'Pedidos pendientes', value: pending,                             emoji: '⏳' },
    { label: 'Ingresos',          value: `$${revenue.toLocaleString('es-AR')}`, emoji: '💰' },
    { label: 'Total pedidos',     value: orders.length,                        emoji: '📦' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
      >
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Vendedor</Text>
          <Text className="text-white text-2xl font-black">
            Hola, {user?.businessName?.split(' ')[0]} 👋
          </Text>
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#D4A853" />
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View className="px-4 flex-row flex-wrap gap-3 mt-2">
              {stats.map((s) => (
                <View key={s.label} className="bg-white/5 rounded-2xl p-4 flex-1 min-w-[44%]">
                  <Text className="text-2xl mb-2">{s.emoji}</Text>
                  <Text className="text-gold text-2xl font-black">{s.value}</Text>
                  <Text className="text-white/40 text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Recent orders */}
            {orders.length > 0 && (
              <View className="px-4 mt-6">
                <Text className="text-white font-bold text-base mb-3">Pedidos recientes</Text>
                {orders.slice(0, 4).map((o) => (
                  <View key={o.id} className="flex-row justify-between items-center py-3 border-b border-white/5">
                    <View>
                      <Text className="text-white text-sm font-medium">
                        {o.buyer?.businessName ?? 'Comprador'}
                      </Text>
                      <Text className="text-white/30 text-xs mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('es-AR')}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gold text-sm font-bold">
                        ${Number(o.totalAmount).toLocaleString('es-AR')}
                      </Text>
                      <Text className="text-white/30 text-[10px] mt-0.5">
                        {({'esperando_seña': 'Esperando seña', 'seña_pagada': 'Seña pagada', 'en_preparacion': 'En prep.', 'despachado': 'Despachado', 'entregado': 'Entregado', 'cancelado': 'Cancelado', 'vencido': 'Vencido', 'en_disputa': 'En disputa'} as Record<string,string>)[o.status] ?? o.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

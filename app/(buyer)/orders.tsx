import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ordersApi }   from '../../api/orders';
import { paymentsApi } from '../../api/payments';

// Status values match backend OrderStatus enum (Spanish values)
const STATUS_LABELS: Record<string, string> = {
  'esperando_seña': 'Esperando seña',
  'seña_pagada':    'Seña pagada',
  'en_preparacion': 'En preparación',
  'despachado':     'Despachado',
  'entregado':      'Entregado',
  'cancelado':      'Cancelado',
  'vencido':        'Vencido',
  'en_disputa':     'En disputa',
};
const STATUS_COLORS: Record<string, string> = {
  'esperando_seña': '#F59E0B',
  'seña_pagada':    '#3B82F6',
  'en_preparacion': '#6366F1',
  'despachado':     '#8B5CF6',
  'entregado':      '#10B981',
  'cancelado':      '#6B7280',
  'vencido':        '#6B7280',
  'en_disputa':     '#EF4444',
};

export default function OrdersScreen() {
  const [orders,     setOrders]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId,   setPayingId]   = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await ordersApi.getAsBuyer();
      setOrders(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Abre el checkout de Mercado Pago en un browser in-app (SFSafariViewController / Chrome Custom Tabs).
   * Cuando el usuario vuelve, recargamos los pedidos automáticamente.
   */
  const openPayment = async (orderId: string, type: 'seña' | 'saldo') => {
    if (payingId) return;
    setPayingId(orderId);
    try {
      const pref = type === 'seña'
        ? await paymentsApi.createSeñaPreference(orderId)
        : await paymentsApi.createSaldoPreference(orderId);

      if (!pref?.initPoint) {
        Alert.alert('Error', 'No se pudo generar el link de pago. Intentá de nuevo.');
        return;
      }

      // Abre el checkout de MP en el navegador del dispositivo
      await Linking.openURL(pref.initPoint);

      // Recargar pedidos al volver (el webhook ya actualizó el estado)
      await load(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo abrir el checkout de Mercado Pago.');
    } finally {
      setPayingId(null);
    }
  };

  const listingLabel = (type: string) =>
    type === 'res_entera' ? 'Res Entera' : type === 'media_res' ? 'Media Res' : 'Lote/Cortes';

  const renderOrder = ({ item: o }: { item: any }) => {
    const isPaying      = payingId === o.id;
    const showSeña      = o.status === 'esperando_seña';
    const showSaldo     = o.status === 'despachado' && !o.saldoPaid;
    const señaAmount    = Number(o.señaAmount ?? 0);
    const totalAmount   = Number(o.totalAmount ?? 0);
    const saldoAmount   = totalAmount - señaAmount;

    return (
      <View className="bg-white/5 rounded-2xl p-4 mb-3 mx-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <Text className="text-white font-semibold text-base">
              {o.listing?.type ? listingLabel(o.listing.type) : 'Pedido'}
            </Text>
            {o.listing?.originFarm && (
              <Text className="text-white/40 text-xs mt-0.5">{o.listing.originFarm}</Text>
            )}
            <Text className="text-white/30 text-xs mt-0.5">
              {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: (STATUS_COLORS[o.status] ?? '#6B7280') + '20' }}
          >
            <Text style={{ color: STATUS_COLORS[o.status] ?? '#6B7280', fontSize: 11, fontWeight: '600' }}>
              {STATUS_LABELS[o.status] ?? o.status}
            </Text>
          </View>
        </View>

        {/* Monto */}
        <View className="flex-row justify-between items-center py-3 border-t border-white/5">
          <Text className="text-white/40 text-xs">Total del pedido</Text>
          <Text className="text-gold font-bold text-base">
            ARS {totalAmount.toLocaleString('es-AR')}
          </Text>
        </View>

        {/* Desglose seña / saldo */}
        {señaAmount > 0 && (
          <View className="flex-row justify-between items-center py-2 border-t border-white/5">
            <Text className="text-white/30 text-xs">Seña ({o.señaPercent ?? 0}%)</Text>
            <Text className={`text-xs font-semibold ${o.status !== 'esperando_seña' ? 'text-green-400' : 'text-amber-400'}`}>
              {o.status !== 'esperando_seña' ? '✓ ' : ''}ARS {señaAmount.toLocaleString('es-AR')}
            </Text>
          </View>
        )}
        {totalAmount > señaAmount && (
          <View className="flex-row justify-between items-center py-2 border-t border-white/5">
            <Text className="text-white/30 text-xs">Saldo restante</Text>
            <Text className={`text-xs font-semibold ${o.saldoPaid ? 'text-green-400' : 'text-white/40'}`}>
              {o.saldoPaid ? '✓ ' : ''}ARS {saldoAmount.toLocaleString('es-AR')}
            </Text>
          </View>
        )}

        {/* Botón PAGAR SEÑA */}
        {showSeña && (
          <TouchableOpacity
            onPress={() => openPayment(o.id, 'seña')}
            disabled={isPaying}
            className="mt-3 bg-[#009EE3] rounded-xl py-3.5 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            {isPaying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>💳</Text>
                <Text className="text-white font-bold text-sm uppercase tracking-wider">
                  Pagar seña — ARS {señaAmount.toLocaleString('es-AR')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Botón PAGAR SALDO */}
        {showSaldo && (
          <TouchableOpacity
            onPress={() => openPayment(o.id, 'saldo')}
            disabled={isPaying}
            className="mt-3 bg-[#009EE3] rounded-xl py-3.5 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            {isPaying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>💳</Text>
                <Text className="text-white font-bold text-sm uppercase tracking-wider">
                  Pagar saldo — ARS {saldoAmount.toLocaleString('es-AR')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Info del vendedor */}
        {o.vendor && (
          <View className="mt-3 pt-3 border-t border-white/5 flex-row items-center gap-2">
            <Text className="text-white/30 text-xs">🏭 {o.vendor.businessName}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <View className="px-4 pt-4 pb-3">
        <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Comprador</Text>
        <Text className="text-white text-2xl font-black">Mis Pedidos</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A853" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#D4A853"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-white/40">Todavía no hiciste ningún pedido</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

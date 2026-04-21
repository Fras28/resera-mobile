import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ordersApi } from '../../api/orders';

// Status values match backend OrderStatus enum (Spanish values)
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  'esperando_seña':  { color: '#F59E0B', bg: '#F59E0B15', label: 'Esperando seña'  },
  'seña_pagada':     { color: '#3B82F6', bg: '#3B82F615', label: 'Seña pagada'      },
  'en_preparacion':  { color: '#6366F1', bg: '#6366F115', label: 'En preparación'   },
  'despachado':      { color: '#8B5CF6', bg: '#8B5CF615', label: 'Despachado'       },
  'entregado':       { color: '#10B981', bg: '#10B98115', label: 'Entregado'        },
  'cancelado':       { color: '#EF4444', bg: '#EF444415', label: 'Cancelado'        },
  'vencido':         { color: '#6B7280', bg: '#6B728015', label: 'Vencido'          },
  'en_disputa':      { color: '#EF4444', bg: '#EF444415', label: 'En disputa'       },
};

const NEXT_ACTIONS: Record<string, { label: string; action: string; color: string } | null> = {
  'seña_pagada':    { label: 'Despachar pedido',  action: 'dispatch', color: '#8B5CF6' },
  'despachado':     { label: 'Confirmar entrega', action: 'deliver',  color: '#10B981' },
  'esperando_seña': null,
  'en_preparacion': null,
  'entregado':      null,
  'cancelado':      null,
  'vencido':        null,
  'en_disputa':     null,
};

export default function VendorOrdersScreen() {
  const [orders,     setOrders]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<any>(null);
  const [acting,     setActing]     = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await ordersApi.getAsVendor();
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (order: any, action: string) => {
    setActing(true);
    try {
      switch (action) {
        case 'dispatch': await ordersApi.dispatch(order.id); break;
        case 'deliver':  await ordersApi.deliver(order.id);  break;
      }
      await load();
      setSelected(null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo actualizar el pedido.');
    } finally { setActing(false); }
  };

  const renderOrder = ({ item: o }: { item: any }) => {
    const cfg = STATUS_CONFIG[o.status] ?? { color: '#6B7280', bg: '#6B728015', label: o.status };
    return (
      <TouchableOpacity
        onPress={() => setSelected(o)}
        className="bg-white/5 rounded-2xl p-4 mb-3 mx-4"
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white font-bold text-sm">
              {o.buyer?.businessName ?? 'Comprador'}
            </Text>
            <Text className="text-white/30 text-xs mt-0.5">
              {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
            <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '600' }}>{cfg.label}</Text>
          </View>
        </View>

        <View className="flex-row bg-white/5 rounded-xl p-3 gap-2">
          {[
            ['Kg gancho', `${Number(o.hookWeightKg ?? 0).toFixed(0)} kg`],
            ['$/kg',      `$${Number(o.pricePerKg ?? 0).toLocaleString('es-AR')}`],
            ['Total',     `$${Number(o.totalAmount ?? 0).toLocaleString('es-AR')}`],
          ].map(([label, value], i) => (
            <View key={label as string} className={`flex-1 items-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
              <Text className="text-white/30 text-[10px]">{label}</Text>
              <Text className="text-gold text-sm font-bold mt-0.5">{value}</Text>
            </View>
          ))}
        </View>

        {o.señaAmount > 0 && (
          <View className="flex-row justify-between items-center mt-2.5 pt-2.5 border-t border-white/5">
            <Text className="text-white/30 text-xs">Seña</Text>
            <Text className={`text-xs font-semibold ${o.señaPaid ? 'text-green-400' : 'text-yellow-400'}`}>
              {o.señaPaid ? '✓ Pagada' : '⏳ Pendiente'} · ${Number(o.señaAmount).toLocaleString('es-AR')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <View className="px-4 pt-4 pb-3">
        <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Vendedor</Text>
        <Text className="text-white text-2xl font-black">Pedidos</Text>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-5xl mb-3">📦</Text>
              <Text className="text-white/40 mb-1 font-medium">Sin pedidos todavía</Text>
              <Text className="text-white/20 text-sm">Los pedidos aparecerán aquí</Text>
            </View>
          }
        />
      )}

      {/* Order detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (() => {
          const cfg = STATUS_CONFIG[selected.status] ?? { color: '#6B7280', bg: '#6B728015', label: selected.status };
          const nextAction = NEXT_ACTIONS[selected.status] ?? null;
          return (
            <View className="flex-1 bg-dark">
              <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
                  <Text className="text-white text-lg font-bold">Detalle del pedido</Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text className="text-white/50 text-xl">✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                  {/* Status */}
                  <View className="rounded-2xl p-5" style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color + '30' }}>
                    <Text style={{ color: cfg.color }} className="text-xs font-bold uppercase tracking-wider mb-1">Estado</Text>
                    <Text style={{ color: cfg.color }} className="text-xl font-black">{cfg.label}</Text>
                  </View>

                  {/* Comprador */}
                  <View className="bg-white/5 rounded-2xl p-5">
                    <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Comprador</Text>
                    <Text className="text-white font-bold text-base">{selected.buyer?.businessName ?? '—'}</Text>
                    <Text className="text-white/40 text-sm mt-1">{selected.buyer?.email ?? '—'}</Text>
                    {selected.buyer?.province && (
                      <Text className="text-white/30 text-xs mt-1">📍 {selected.buyer.province}</Text>
                    )}
                  </View>

                  {/* Montos */}
                  <View className="bg-white/5 rounded-2xl p-5">
                    <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Importes</Text>
                    {[
                      ['Kg en gancho',   `${Number(selected.hookWeightKg ?? 0).toFixed(0)} kg`],
                      ['Precio por kg',  `$${Number(selected.pricePerKg ?? 0).toLocaleString('es-AR')}`],
                      ['Total',          `$${Number(selected.totalAmount ?? 0).toLocaleString('es-AR')}`],
                      ['Seña',           selected.señaAmount > 0 ? `$${Number(selected.señaAmount).toLocaleString('es-AR')} ${selected.señaPaid ? '(pagada)' : '(pendiente)'}` : 'Sin seña'],
                    ].map(([label, value]) => (
                      <View key={label as string} className="flex-row justify-between py-2 border-b border-white/5">
                        <Text className="text-white/40 text-sm">{label}</Text>
                        <Text className="text-white text-sm font-semibold">{value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Fechas */}
                  <View className="bg-white/5 rounded-2xl p-5">
                    <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Fechas</Text>
                    {[
                      ['Creado',    new Date(selected.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })],
                      selected.updatedAt ? ['Actualizado', new Date(selected.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })] : null,
                    ].filter(Boolean).map(([label, value]: any) => (
                      <View key={label} className="flex-row justify-between py-2 border-b border-white/5">
                        <Text className="text-white/40 text-sm">{label}</Text>
                        <Text className="text-white text-sm">{value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Notes */}
                  {selected.buyerNotes && (
                    <View className="bg-white/5 rounded-2xl p-5">
                      <Text className="text-white/40 text-xs uppercase tracking-wider mb-2">Nota del comprador</Text>
                      <Text className="text-white/80 text-sm leading-5">{selected.buyerNotes}</Text>
                    </View>
                  )}

                  {/* Action button */}
                  {nextAction && (
                    <TouchableOpacity
                      onPress={() => handleAction(selected, nextAction.action)}
                      disabled={acting}
                      className="rounded-2xl py-4 items-center"
                      style={{ backgroundColor: nextAction.color + 'CC' }}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-bold text-base uppercase tracking-wider">
                        {acting ? 'Procesando...' : nextAction.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </SafeAreaView>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

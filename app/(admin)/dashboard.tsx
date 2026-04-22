import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { adminApi } from '../../api/admin';
import { useAuthStore } from '../../store/auth';
import { showToast } from '../../components/Toast';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', active: 'Activo', suspended: 'Suspendido',
  blocked: 'Bloqueado', rejected: 'Rechazado',
};
const ROLE_LABEL: Record<string, string> = { vendor: 'Vendedor', buyer: 'Comprador', admin: 'Admin' };

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [s, users] = await Promise.all([
        adminApi.getPlatformStats(),
        adminApi.getUsers({ status: 'pending' }),
      ]);
      setStats(s ?? {});
      setPendingUsers(Array.isArray(users) ? users : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (userId: string, userName: string) => {
    setApproving(userId);
    try {
      await adminApi.approve(userId);
      showToast(`✅ Cuenta de ${userName} aprobada`, 'success');
      await load();
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'No se pudo aprobar la cuenta.', 'error');
    } finally { setApproving(null); }
  };

  const totalVendors  = Object.entries(stats).filter(([k]) => k.startsWith('vendor')).reduce((s, [, v]) => s + v, 0);
  const totalBuyers   = Object.entries(stats).filter(([k]) => k.startsWith('buyer')).reduce((s, [, v]) => s + v, 0);
  const pendingCount  = Object.entries(stats).filter(([k]) => k.endsWith('pending')).reduce((s, [, v]) => s + v, 0);
  const activeVendors = stats['vendor_active'] ?? 0;
  const activeBuyers  = stats['buyer_active']  ?? 0;

  const statCards = [
    { label: 'Vendedores activos',    value: activeVendors, emoji: '🥩', color: '#D4A853' },
    { label: 'Compradores activos',   value: activeBuyers,  emoji: '🛒', color: '#10B981' },
    { label: 'Pendientes aprobación', value: pendingCount,  emoji: '⏳', color: '#F59E0B' },
    { label: 'Total usuarios',        value: totalVendors + totalBuyers, emoji: '👥', color: '#fff' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
      >
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Administración</Text>
          <Text className="text-white text-2xl font-black">Panel de Control</Text>
        </View>

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#D4A853" />
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View className="px-4 flex-row flex-wrap gap-3 mt-2">
              {statCards.map((s) => (
                <View key={s.label} className="bg-white/5 rounded-2xl p-4 flex-1 min-w-[44%]">
                  <Text className="text-2xl mb-2">{s.emoji}</Text>
                  <Text className="text-2xl font-black" style={{ color: s.color }}>{s.value}</Text>
                  <Text className="text-white/40 text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Desglose */}
            <View className="px-4 mt-5">
              <Text className="text-white font-bold text-base mb-3">Desglose por estado</Text>
              <View className="bg-white/5 rounded-2xl p-4 gap-2">
                {Object.entries(stats).map(([key, count]) => {
                  const [role, status] = key.split('_');
                  return (
                    <View key={key} className="flex-row justify-between items-center py-1.5 border-b border-white/5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white/60 text-sm">{ROLE_LABEL[role] ?? role}</Text>
                        <Text className="text-white/30 text-xs">·</Text>
                        <Text className="text-white/50 text-xs">{STATUS_LABEL[status] ?? status}</Text>
                      </View>
                      <Text className="text-white font-bold">{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Pendientes de aprobación */}
            {pendingUsers.length > 0 && (
              <View className="px-4 mt-5">
                <Text className="text-amber-400 font-bold text-base mb-3">
                  ⏳ {pendingUsers.length} pendiente(s) de aprobación
                </Text>
                {pendingUsers.map((u) => (
                  <View key={u.id} className="bg-white/5 rounded-2xl p-4 mb-2 flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-white font-semibold text-sm" numberOfLines={1}>{u.businessName}</Text>
                      <Text className="text-white/40 text-xs mt-0.5">{u.email}</Text>
                      <Text className="text-white/30 text-xs">{ROLE_LABEL[u.role]}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleApprove(u.id, u.businessName)}
                      disabled={approving === u.id}
                      className="bg-emerald-600 rounded-xl px-4 py-2 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      {approving === u.id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text className="text-white text-xs font-bold">Aprobar</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {pendingUsers.length === 0 && !loading && (
              <View className="px-4 mt-5">
                <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-4">
                  <Text className="text-emerald-400 text-sm font-medium">✅ No hay cuentas pendientes de aprobación</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from '../../api/admin';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', active: 'Activo', suspended: 'Suspendido',
  blocked: 'Bloqueado', rejected: 'Rechazado',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', active: '#10B981', suspended: '#F97316',
  blocked: '#EF4444', rejected: '#6B7280',
};
const ROLE_LABEL: Record<string, string> = { vendor: 'Vendedor', buyer: 'Comprador', admin: 'Admin' };

type Action = 'approve' | 'suspend' | 'block' | 'reactivate';

const ACTION_CONFIG: Record<Action, { label: string; color: string; textColor: string }> = {
  approve:    { label: 'Aprobar',    color: '#059669', textColor: '#fff' },
  suspend:    { label: 'Suspender',  color: '#EA580C', textColor: '#fff' },
  block:      { label: 'Bloquear',   color: '#DC2626', textColor: '#fff' },
  reactivate: { label: 'Reactivar', color: '#D4A853', textColor: '#000' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await adminApi.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (userId: string, action: Action, userName: string) => {
    const needsConfirm = action !== 'approve';
    if (needsConfirm) {
      Alert.alert(
        ACTION_CONFIG[action].label,
        `¿${ACTION_CONFIG[action].label} la cuenta de "${userName}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: ACTION_CONFIG[action].label,
            style: action === 'block' ? 'destructive' : 'default',
            onPress: () => executeAction(userId, action),
          },
        ],
      );
    } else {
      executeAction(userId, action);
    }
  };

  const executeAction = async (userId: string, action: Action) => {
    setActionLoading(userId + action);
    try {
      if (action === 'approve')    await adminApi.approve(userId);
      if (action === 'suspend')    await adminApi.suspend(userId);
      if (action === 'block')      await adminApi.block(userId);
      if (action === 'reactivate') await adminApi.reactivate(userId);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo ejecutar la acción.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.businessName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const renderActions = (u: any) => {
    const actions: Action[] = [];
    if (u.status === 'pending') actions.push('approve');
    if (u.status === 'active' || u.status === 'pending') actions.push('suspend');
    if (u.status !== 'blocked' && u.role !== 'admin') actions.push('block');
    if (u.status === 'suspended' || u.status === 'blocked') actions.push('reactivate');
    return actions;
  };

  const renderUser = ({ item: u }: { item: any }) => {
    const actions = renderActions(u);
    return (
      <View className="bg-white/5 rounded-2xl p-4 mb-2 mx-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-white font-semibold text-sm" numberOfLines={1}>{u.businessName}</Text>
            <Text className="text-white/40 text-xs mt-0.5" numberOfLines={1}>{u.email}</Text>
            {u.province && <Text className="text-white/30 text-xs">{u.province}</Text>}
          </View>
          <View className="items-end gap-1">
            <Text className="text-white/40 text-xs">{ROLE_LABEL[u.role]}</Text>
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: STATUS_COLOR[u.status] + '25' }}>
              <Text className="text-xs font-medium" style={{ color: STATUS_COLOR[u.status] }}>
                {STATUS_LABEL[u.status]}
              </Text>
            </View>
          </View>
        </View>

        {actions.length > 0 && (
          <View className="flex-row gap-2 flex-wrap mt-1">
            {actions.map((action) => {
              const cfg = ACTION_CONFIG[action];
              const isLoading = actionLoading === u.id + action;
              return (
                <TouchableOpacity
                  key={action}
                  onPress={() => handleAction(u.id, action, u.businessName)}
                  disabled={!!actionLoading}
                  activeOpacity={0.7}
                  style={{ backgroundColor: cfg.color + 'cc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  {isLoading
                    ? <ActivityIndicator color={cfg.textColor} size="small" />
                    : <Text style={{ color: cfg.textColor, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Administración</Text>
        <Text className="text-white text-2xl font-black">Usuarios</Text>
      </View>

      {/* Búsqueda */}
      <View className="px-4 mb-3">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor="#ffffff30"
          className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm"
        />
      </View>

      {/* Filtros */}
      <View className="px-4 flex-row gap-2 mb-3">
        {['', 'vendor', 'buyer'].map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-xl ${roleFilter === r ? 'bg-meat-red' : 'bg-white/10'}`}
          >
            <Text className={`text-xs font-semibold ${roleFilter === r ? 'text-white' : 'text-white/50'}`}>
              {r === '' ? 'Todos' : ROLE_LABEL[r]}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="w-px bg-white/10" />
        {['', 'pending', 'active', 'suspended', 'blocked'].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl ${statusFilter === s ? 'bg-meat-red' : 'bg-white/10'}`}
          >
            <Text className={`text-xs font-semibold ${statusFilter === s ? 'text-white' : 'text-white/50'}`}>
              {s === '' ? 'Todos' : STATUS_LABEL[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4A853" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#D4A853" />}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-white/30 text-sm">No se encontraron usuarios</Text>
            </View>
          }
          ListHeaderComponent={
            <Text className="text-white/30 text-xs px-4 mb-3">{filtered.length} usuario(s)</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

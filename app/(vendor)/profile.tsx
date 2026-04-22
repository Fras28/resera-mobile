import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { showToast } from '../../components/Toast';

export default function VendorProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch {
              showToast('Error al cerrar sesión', 'error');
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const u = user as any;

  const infoRows = [
    { label: 'Rol',        value: 'Vendedor / Frigorífico' },
    { label: 'Email',      value: u?.email      ?? '—' },
    { label: 'CUIT',       value: u?.cuit       ?? '—' },
    { label: 'Provincia',  value: u?.province   ?? '—' },
    { label: 'Licencia',   value: u?.senasaLicense ?? '—' },
    { label: 'Estado',     value: u?.status === 'active' ? '✅ Activo' : u?.status ?? '—' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Vendedor</Text>
          <Text className="text-white text-2xl font-black">Mi Perfil</Text>
        </View>

        {/* Avatar + nombre */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-4 border-2 border-white/10">
            <Text style={{ fontSize: 44 }}>🥩</Text>
          </View>
          <Text className="text-white text-xl font-bold">{u?.businessName ?? '—'}</Text>
          <Text className="text-white/40 text-sm mt-1">{u?.email ?? '—'}</Text>
          <View className="flex-row gap-2 mt-2">
            {u?.status === 'active' && (
              <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
                <Text className="text-emerald-400 text-xs font-semibold">✓ Activo</Text>
              </View>
            )}
            {u?.isVerified && (
              <View className="bg-blue-500/15 border border-blue-500/30 rounded-full px-3 py-1">
                <Text className="text-blue-400 text-xs font-semibold">✓ Verificado</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reputación */}
        {(u?.avgRating > 0 || u?.totalOperations > 0) && (
          <View className="mx-4 mb-4 bg-white/5 rounded-2xl p-5">
            <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Reputación</Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-gold text-3xl font-black">
                  {Number(u?.avgRating ?? 0).toFixed(1)}
                </Text>
                <Text className="text-white/30 text-xs mt-1">⭐ Calificación</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center">
                <Text className="text-white text-3xl font-black">{u?.totalRatings ?? 0}</Text>
                <Text className="text-white/30 text-xs mt-1">Valoraciones</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center">
                <Text className="text-white text-3xl font-black">{u?.totalOperations ?? 0}</Text>
                <Text className="text-white/30 text-xs mt-1">Operaciones</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info */}
        <View className="mx-4 mb-4 bg-white/5 rounded-2xl p-5">
          <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Información de la cuenta</Text>
          {infoRows.map(({ label, value }) => (
            <View key={label} className="flex-row justify-between py-2.5 border-b border-white/5">
              <Text className="text-white/40 text-sm">{label}</Text>
              <Text className="text-white text-sm font-medium">{value}</Text>
            </View>
          ))}
        </View>

        {/* Mercado Pago status */}
        <View className="mx-4 mb-4 bg-white/5 rounded-2xl p-5">
          <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Mercado Pago</Text>
          <View className={`rounded-xl px-4 py-3 border ${u?.mpConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <Text className={`text-sm font-semibold ${u?.mpConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {u?.mpConnected ? '✅ Cuenta conectada — recibís pagos' : '⚠️ Sin cuenta conectada — configuralo desde la web'}
            </Text>
          </View>
        </View>

        {/* Cerrar sesión */}
        <View className="mx-4">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center flex-row justify-center gap-2"
          >
            {loggingOut
              ? <ActivityIndicator color="#f87171" size="small" />
              : <Text className="text-red-400 font-bold text-sm">🚪  Cerrar sesión</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

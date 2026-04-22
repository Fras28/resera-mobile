import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { showToast } from '../../components/Toast';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Salir del panel de administración?',
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

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Administración</Text>
          <Text className="text-white text-2xl font-black">Mi Cuenta</Text>
        </View>

        {/* Avatar */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-meat-red/20 border-2 border-meat-red/40 items-center justify-center mb-4">
            <Text style={{ fontSize: 44 }}>🛡️</Text>
          </View>
          <Text className="text-white text-xl font-bold">{u?.businessName ?? '—'}</Text>
          <Text className="text-white/40 text-sm mt-1">{u?.email ?? '—'}</Text>
          <View className="mt-2 bg-meat-red/15 border border-meat-red/30 rounded-full px-4 py-1">
            <Text className="text-meat-red text-xs font-bold uppercase tracking-widest">Administrador</Text>
          </View>
        </View>

        {/* Info */}
        <View className="mx-4 mb-4 bg-white/5 rounded-2xl p-5">
          <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Información de la cuenta</Text>
          {[
            { label: 'Rol',    value: 'Administrador RESERA' },
            { label: 'Email',  value: u?.email ?? '—' },
            { label: 'Estado', value: '✅ Activo' },
          ].map(({ label, value }) => (
            <View key={label} className="flex-row justify-between py-2.5 border-b border-white/5">
              <Text className="text-white/40 text-sm">{label}</Text>
              <Text className="text-white text-sm font-medium">{value}</Text>
            </View>
          ))}
        </View>

        {/* Accesos rápidos */}
        <View className="mx-4 mb-4 bg-white/5 rounded-2xl p-5">
          <Text className="text-white/40 text-xs uppercase tracking-wider mb-3">Panel de control</Text>
          {[
            { icon: '📊', label: 'Resumen general',     desc: 'Stats y cuentas pendientes' },
            { icon: '👥', label: 'Gestión de usuarios',  desc: 'Aprobar, suspender, cambiar roles' },
            { icon: '💰', label: 'Comisiones MP',        desc: 'Dashboard de ingresos del 2%' },
          ].map(({ icon, label, desc }) => (
            <View key={label} className="flex-row items-center gap-3 py-3 border-b border-white/5">
              <Text style={{ fontSize: 22 }}>{icon}</Text>
              <View>
                <Text className="text-white text-sm font-semibold">{label}</Text>
                <Text className="text-white/30 text-xs mt-0.5">{desc}</Text>
              </View>
            </View>
          ))}
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

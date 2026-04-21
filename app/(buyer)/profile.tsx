import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';

export default function BuyerProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-dark" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="px-4 pt-4 pb-3">
          <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Comprador</Text>
          <Text className="text-white text-2xl font-black">Mi Perfil</Text>
        </View>

        {/* Avatar */}
        <View className="items-center py-8">
          <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-3">
            <Text className="text-4xl">🛒</Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.businessName}</Text>
          <Text className="text-white/40 text-sm mt-1">{user?.email}</Text>
        </View>

        {/* Info */}
        <View className="mx-4 bg-white/5 rounded-2xl p-5 space-y-3 mb-4">
          {[
            ['Rol',        'Comprador'],
            ['CUIT',       user?.email ?? '—'],
            ['Provincia',  (user as any)?.province ?? '—'],
          ].map(([label, value]) => (
            <View key={label as string} className="flex-row justify-between">
              <Text className="text-white/40 text-sm">{label}</Text>
              <Text className="text-white text-sm font-medium">{value}</Text>
            </View>
          ))}
        </View>

        <View className="mx-4">
          <TouchableOpacity
            onPress={logout}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-red-400 font-semibold">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

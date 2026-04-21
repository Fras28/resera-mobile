import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1">
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text className={`text-[10px] mt-0.5 ${focused ? 'text-gold font-semibold' : 'text-white/40'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function VendorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#ffffff10',
          height: 70,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} /> }}
      />
      <Tabs.Screen
        name="listings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🥩" label="Mis Lotes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Pedidos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Perfil" focused={focused} /> }}
      />
      {/* Pantalla oculta de animales — se navega programáticamente */}
      <Tabs.Screen
        name="animals"
        options={{ href: null }}
      />
    </Tabs>
  );
}

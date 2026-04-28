import { Tabs } from 'expo-router';
import { AnimatedTabIcon } from '../../components/animated';

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
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="📊" label="Dashboard" focused={focused} /> }}
      />
      <Tabs.Screen
        name="listings"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="🥩" label="Mis Lotes" focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="📦" label="Pedidos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="👤" label="Perfil" focused={focused} /> }}
      />
      {/* Pantalla oculta de animales — se navega programáticamente */}
      <Tabs.Screen
        name="animals"
        options={{ href: null }}
      />
    </Tabs>
  );
}

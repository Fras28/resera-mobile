import { Tabs } from 'expo-router';
import { AnimatedTabIcon } from '../../components/animated';

export default function BuyerLayout() {
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
        name="marketplace"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="🥩" label="Mercado" focused={focused} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="📦" label="Pedidos" focused={focused} /> }}
      />
      <Tabs.Screen
        name="score"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="⭐" label="Mi Score" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <AnimatedTabIcon emoji="👤" label="Perfil" focused={focused} /> }}
      />
      {/* Hidden screens — no tab icon */}
      <Tabs.Screen
        name="vendor-store"
        options={{ href: null }}
      />
    </Tabs>
  );
}

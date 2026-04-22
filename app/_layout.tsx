import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth';
import { View, ActivityIndicator } from 'react-native';
import { SplashAnimation } from '../components/SplashAnimation';
import { ToastComponent } from '../components/Toast';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, loadUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      if (user.role === 'vendor') router.replace('/(vendor)/dashboard');
      else if (user.role === 'admin') router.replace('/(admin)/dashboard');
      else router.replace('/(buyer)/marketplace');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator color="#D4A853" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <StatusBar style="light" />
      {showSplash && (
        <SplashAnimation onDone={() => setShowSplash(false)} />
      )}
      {/* Montamos AuthGuard desde el inicio para que cargue el usuario
          mientras el splash está visible — sin retrasos extra */}
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
        <ToastComponent />
      </AuthGuard>
    </>
  );
}

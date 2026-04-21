import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/auth';

const logoResera = require('../../assets/LogoRESERA.png');

export default function LoginScreen() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) { setError('Completá todos los campos.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Logo */}
          <View className="mb-12">
            <Image
              source={logoResera}
              style={{ height: 52, width: undefined, aspectRatio: undefined }}
              resizeMode="contain"
              className="h-14 self-start"
            />
          </View>

          <Text className="text-white text-2xl font-bold mb-8">Ingresá a tu cuenta</Text>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#ffffff30"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-4 text-base"
              />
            </View>

            <View>
              <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">Contraseña</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#ffffff30"
                  secureTextEntry={!showPassword}
                  className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-4 text-base pr-14"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {error ? (
            <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="mt-8 bg-meat-red rounded-2xl py-4 items-center"
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base tracking-wider uppercase">Ingresar</Text>
            }
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-white/40 text-sm">¿No tenés cuenta?</Text>
            <Link href="/(auth)/register">
              <Text className="text-gold text-sm font-semibold"> Registrate</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
  Modal, FlatList, Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth';
import { PROVINCES } from '../../utils/provinces';

const logoResera = require('../../assets/LogoRESERA.png');

type Role = 'vendor' | 'buyer';

// ⚠️ Definido FUERA del componente para evitar re-montaje en cada keystroke
function Field({ label, value, onChangeText, placeholder, keyboard = 'default', secure = false }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboard?: any; secure?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#ffffff30"
        keyboardType={keyboard}
        autoCapitalize="none"
        secureTextEntry={secure}
        className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-4 text-base"
      />
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [role, setRole] = useState<Role>('buyer');
  const [form, setForm] = useState({
    businessName: '', cuit: '', email: '', password: '', phone: '', province: '',
  });
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [provinceModal,  setProvinceModal]  = useState(false);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleRegister = async () => {
    const { businessName, cuit, email, password, province } = form;
    if (!businessName || !cuit || !email || !password) {
      setError('Completá los campos obligatorios.'); return;
    }
    if (!province) {
      setError('Seleccioná tu provincia para continuar.'); return;
    }
    setLoading(true); setError('');
    try {
      await authApi.register({ ...form, role });
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al registrarse.');
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
        <View className="flex-1 px-6 pt-16 pb-10">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-gold text-base">← Volver</Text>
            </TouchableOpacity>
            <Image
              source={logoResera}
              style={{ height: 32 }}
              resizeMode="contain"
            />
          </View>

          <Text className="text-white text-2xl font-bold mb-2">Crear cuenta</Text>
          <Text className="text-white/40 text-sm mb-8">Completá tus datos para empezar</Text>

          {/* Role selector */}
          <View className="flex-row gap-3 mb-8">
            {(['buyer', 'vendor'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 py-3 rounded-2xl border items-center ${
                  role === r
                    ? 'bg-gold border-gold'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <Text className={`font-semibold text-sm ${role === r ? 'text-dark' : 'text-white/60'}`}>
                  {r === 'buyer' ? '🛒 Comprador' : '🥩 Vendedor'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Razón social *"  value={form.businessName} onChangeText={(v) => set('businessName', v)} placeholder="Mi Frigorífico SA" />
          <Field label="CUIT *"          value={form.cuit}         onChangeText={(v) => set('cuit', v)}         placeholder="20-12345678-9" keyboard="numeric" />
          <Field label="Email *"         value={form.email}        onChangeText={(v) => set('email', v)}        placeholder="tu@email.com"   keyboard="email-address" />
          <Field label="Contraseña *"    value={form.password}     onChangeText={(v) => set('password', v)}     placeholder="Mínimo 8 caracteres" secure />

          {/* Province picker */}
          <View className="mb-4">
            <Text className="text-white/60 text-xs uppercase tracking-widest mb-2">
              Provincia <Text className="text-meat-red">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setProvinceModal(true)}
              className={`bg-white/5 border rounded-2xl px-4 py-4 flex-row items-center justify-between ${
                form.province ? 'border-white/20' : 'border-white/10'
              }`}
            >
              <Text className={form.province ? 'text-white text-base' : 'text-white/30 text-base'}>
                {form.province || 'Seleccioná tu provincia'}
              </Text>
              <Text className="text-white/40">▾</Text>
            </TouchableOpacity>
            <Text className="text-white/30 text-xs mt-1">
              Usamos tu provincia para mostrarte vendedores cercanos.
            </Text>
          </View>

          <Field label="Teléfono"  value={form.phone}  onChangeText={(v) => set('phone', v)}  placeholder="+54 11 1234-5678" keyboard="phone-pad" />

          {error ? (
            <View className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-meat-red rounded-2xl py-4 items-center mt-2"
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base tracking-wider uppercase">Crear cuenta</Text>
            }
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center gap-1">
            <Text className="text-white/40 text-sm">¿Ya tenés cuenta?</Text>
            <Link href="/(auth)/login">
              <Text className="text-gold text-sm font-semibold"> Ingresá</Text>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* ── Province Picker Modal ─────────────────────────────── */}
      <Modal
        visible={provinceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setProvinceModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setProvinceModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-container-low rounded-t-3xl pb-8" style={{ maxHeight: '80%' }}>
              {/* Handle */}
              <View className="items-center py-4">
                <View className="w-10 h-1 rounded-full bg-white/20" />
              </View>
              <Text className="text-white text-base font-bold uppercase tracking-widest px-6 mb-4">
                Seleccioná tu provincia
              </Text>
              <FlatList
                data={PROVINCES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { set('province', item); setProvinceModal(false); }}
                    className={`px-6 py-4 border-b border-white/5 flex-row items-center justify-between ${
                      form.province === item ? 'bg-gold/10' : ''
                    }`}
                  >
                    <Text className={`text-base ${form.province === item ? 'text-gold font-semibold' : 'text-white'}`}>
                      {item}
                    </Text>
                    {form.province === item && <Text className="text-gold">✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

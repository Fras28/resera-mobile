import { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

const TYPE_CONFIG: Record<ToastType, { icon: string; bg: string; border: string; color: string }> = {
  success: { icon: '✅', bg: '#052e16',  border: '#16a34a', color: '#86efac' },
  error:   { icon: '❌', bg: '#450a0a',  border: '#dc2626', color: '#fca5a5' },
  warning: { icon: '⚠️', bg: '#431407', border: '#ea580c', color: '#fdba74' },
  info:    { icon: '💬', bg: '#1a1200',  border: '#d4a853', color: '#d4a853' },
};

// ─── Singleton para llamar showToast desde cualquier pantalla ─────────────────

type ShowFn = (message: string, type?: ToastType) => void;
let _show: ShowFn | null = null;

export function showToast(message: string, type: ToastType = 'success') {
  _show?.(message, type);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ToastComponent() {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _show = (message, type = 'success') => {
      // Cancela el dismiss anterior si hay uno en vuelo
      if (dismissRef.current) clearTimeout(dismissRef.current);

      // Resetea posición para re-animar si ya había un toast
      translateY.setValue(120);
      opacity.setValue(0);
      setCurrent({ message, type });

      // Slide up + fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss a los 3.5s
      dismissRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 120,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start(() => setCurrent(null));
      }, 3500);
    };

    return () => {
      _show = null;
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, []);

  if (!current) return null;

  const cfg = TYPE_CONFIG[current.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
        },
      ]}
    >
      <Text style={styles.icon}>{cfg.icon}</Text>
      <Text style={[styles.message, { color: cfg.color }]} numberOfLines={3}>
        {current.message}
      </Text>
    </Animated.View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});

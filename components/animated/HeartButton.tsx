import React, { useEffect } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { DURATION, EASING, SPRING, REDUCE_MOTION } from '../../utils/motion';

type Props = {
  active: boolean;
  loading?: boolean;
  onPress: () => void;
  /** Tamaño del icono. */
  size?: number;
  /** Estilo extra (className NativeWind). */
  className?: string;
  accessibilityLabel?: string;
};

/**
 * Botón de favorito con un "pop" sutil al activar/desactivar. Usa el corazón
 * blanco/rojo emoji para mantener consistencia con el resto de la UI actual.
 */
export function HeartButton({
  active,
  loading,
  onPress,
  size = 18,
  className,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Pop al cambiar el estado.
    scale.value = withSequence(
      withTiming(1.25, {
        duration: DURATION.micro,
        easing: EASING.decelerate,
        reduceMotion: REDUCE_MOTION,
      }),
      withSpring(1, SPRING.pop),
    );
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (active ? 'Quitar de favoritos' : 'Agregar a favoritos')}
      accessibilityState={{ selected: active, busy: loading }}
      className={className}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#D4A853" />
      ) : (
        <Animated.View style={animatedStyle}>
          <Text style={{ fontSize: size }}>{active ? '❤️' : '🤍'}</Text>
        </Animated.View>
      )}
    </PressableScale>
  );
}

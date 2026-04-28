import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { REDUCE_MOTION } from '../../utils/motion';

type Props = {
  /** Alto en píxeles. */
  height?: number;
  /** Ancho — número o porcentaje (ej. '60%'). */
  width?: number | `${number}%`;
  /** Border radius. Default 8. */
  radius?: number;
  /** Estilo extra. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Bloque de carga con shimmer suave. Usar para reemplazar spinners cuando se
 * carga contenido tabular (cards, listas). Mejora la percepción de velocidad
 * al mostrar la silueta del contenido futuro.
 */
export function Skeleton({ height = 14, width = '100%', radius = 8, style }: Props) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: REDUCE_MOTION,
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          width: width as number,
          borderRadius: radius,
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Card skeleton lista para usar en marketplace. */
export function ListingCardSkeleton() {
  return (
    <View
      className="bg-white/5 rounded-2xl overflow-hidden mb-4 mx-4"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Skeleton height={192} radius={0} />
      <View className="p-4">
        <Skeleton height={12} width="40%" />
        <View style={{ height: 8 }} />
        <Skeleton height={10} width="60%" />
        <View style={{ height: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton height={12} width="30%" />
          <Skeleton height={14} width="35%" />
        </View>
      </View>
    </View>
  );
}

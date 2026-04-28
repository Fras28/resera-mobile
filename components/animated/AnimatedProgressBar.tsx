import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { DURATION, REDUCE_MOTION } from '../../utils/motion';

type Props = {
  /** Valor entre 0 y 1. Si pasás un % crudo, dividilo antes. */
  progress: number;
  /** Color del fill. */
  color?: string;
  /** Color del track. */
  trackColor?: string;
  /** Alto en px. Default 8. */
  height?: number;
  /** Delay antes de animar (sirve para staggers en pantallas que se montan). */
  delay?: number;
  /** Duración del fill. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Barra de progreso con fill animado. Pensada para indicadores de score,
 * completitud de perfil o capacidad utilizada.
 */
export function AnimatedProgressBar({
  progress,
  color = '#D4A853',
  trackColor = 'rgba(255,255,255,0.1)',
  height = 8,
  delay = 100,
  duration = DURATION.long,
  style,
}: Props) {
  const widthPct = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(progress, 1)) * 100;
    widthPct.value = withDelay(
      delay,
      withTiming(target, {
        duration,
        easing: Easing.out(Easing.cubic),
        reduceMotion: REDUCE_MOTION,
      }),
    );
  }, [progress, delay, duration, widthPct]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthPct.value}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

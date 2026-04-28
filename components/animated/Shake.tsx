import React, { useEffect, useRef } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { REDUCE_MOTION } from '../../utils/motion';

type Props = ViewProps & {
  /** Cuando este valor cambia, se dispara un shake (cualquier valor "verdadero"). */
  trigger: unknown;
  /** Intensidad del shake en px. Default 6. */
  intensity?: number;
};

/**
 * Wrapper que sacude horizontalmente sus hijos cuando cambia `trigger`.
 * Usar con moderación: típicamente sólo para señalar un error de validación
 * en un formulario.
 */
export function Shake({ trigger, intensity = 6, style, children, ...rest }: Props) {
  const tx = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!trigger) return;
    const t = (v: number) =>
      withTiming(v, { duration: 60, easing: Easing.linear, reduceMotion: REDUCE_MOTION });
    tx.value = withSequence(
      t(-intensity),
      t(intensity),
      t(-intensity * 0.6),
      t(intensity * 0.6),
      t(0),
    );
  }, [trigger, intensity, tx]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

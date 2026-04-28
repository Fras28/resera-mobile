import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { REDUCE_MOTION } from '../../utils/motion';

type Props = ViewProps & {
  /** Habilita la pulsación. */
  active?: boolean;
  /** Escala máxima del pulso. Default 1.04 (sutil). */
  maxScale?: number;
};

/**
 * Pulso lento e ininterrumpido para llamar la atención sobre un badge o
 * elemento que requiere acción del usuario (ej. pedidos pendientes).
 */
export function Pulse({ active = true, maxScale = 1.04, style, children, ...rest }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(1, { duration: 200 });
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          reduceMotion: REDUCE_MOTION,
        }),
        withTiming(1, {
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          reduceMotion: REDUCE_MOTION,
        }),
      ),
      -1,
      false,
    );
  }, [active, maxScale, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, REDUCE_MOTION } from '../../utils/motion';

type Props = ViewProps & {
  /** Delay antes de iniciar la animación (ms). Útil para staggers. */
  delay?: number;
  /** Duración de la animación (ms). */
  duration?: number;
  /** Translación vertical inicial en píxeles. 0 = solo fade. */
  translateY?: number;
};

/**
 * Wrapper que hace fade-in (y opcionalmente sube unos píxeles) cuando se monta.
 * Respeta `prefers-reduced-motion` automáticamente.
 */
export function FadeInView({
  delay = 0,
  duration = DURATION.medium,
  translateY = 8,
  style,
  children,
  ...rest
}: Props) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: EASING.decelerate, reduceMotion: REDUCE_MOTION }),
    );
    ty.value = withDelay(
      delay,
      withTiming(0, { duration, easing: EASING.decelerate, reduceMotion: REDUCE_MOTION }),
    );
  }, [delay, duration, opacity, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

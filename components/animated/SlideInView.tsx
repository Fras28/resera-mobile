import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, REDUCE_MOTION } from '../../utils/motion';

type Direction = 'up' | 'down' | 'left' | 'right';

type Props = ViewProps & {
  delay?: number;
  duration?: number;
  /** Dirección desde la que aparece. Default: 'up' (entra desde abajo). */
  from?: Direction;
  /** Distancia inicial (px). Default 16. */
  distance?: number;
};

/**
 * Slide + fade en mount, configurable por dirección. Pensado para hero
 * sections, headers o bloques aislados que necesitan más presencia que un
 * simple fade.
 */
export function SlideInView({
  delay = 0,
  duration = DURATION.medium,
  from = 'up',
  distance = 16,
  style,
  children,
  ...rest
}: Props) {
  const opacity = useSharedValue(0);
  const tx = useSharedValue(from === 'left' ? -distance : from === 'right' ? distance : 0);
  const ty = useSharedValue(from === 'up' ? distance : from === 'down' ? -distance : 0);

  useEffect(() => {
    const timing = { duration, easing: EASING.decelerate, reduceMotion: REDUCE_MOTION };
    opacity.value = withDelay(delay, withTiming(1, timing));
    tx.value = withDelay(delay, withTiming(0, timing));
    ty.value = withDelay(delay, withTiming(0, timing));
  }, [delay, duration, opacity, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]} {...rest}>
      {children}
    </Animated.View>
  );
}

import React, { forwardRef } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, EASING, SPRING, REDUCE_MOTION } from '../../utils/motion';

type Props = Omit<PressableProps, 'style'> & {
  /** Escala mínima al presionar. Default 0.97 (sutil). */
  pressedScale?: number;
  /** Opacidad mínima al presionar. Default 0.92. */
  pressedOpacity?: number;
  /** Aplica feedback hápt. visual sólo (sin haptics nativos). */
  style?: PressableProps['style'];
  /** Si querés deshabilitar el efecto de scale (manteniendo el press normal). */
  disableScale?: boolean;
  children?: React.ReactNode;
};

/**
 * Reemplazo drop-in de TouchableOpacity con feedback de scale + opacity.
 * Ofrece una sensación más "premium" que el alpha-only que usa TO por default.
 *
 * Accesibilidad: hereda todos los handlers/labels de Pressable.
 */
export const PressableScale = forwardRef<View, Props>(function PressableScale(
  {
    pressedScale = 0.97,
    pressedOpacity = 0.92,
    disableScale = false,
    style,
    children,
    onPressIn,
    onPressOut,
    accessibilityRole = 'button',
    ...rest
  },
  ref,
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      ref={ref}
      accessibilityRole={accessibilityRole}
      onPressIn={(e) => {
        if (!disableScale) {
          scale.value = withSpring(pressedScale, SPRING.press);
        }
        opacity.value = withTiming(pressedOpacity, {
          duration: DURATION.micro,
          easing: EASING.standard,
          reduceMotion: REDUCE_MOTION,
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!disableScale) {
          scale.value = withSpring(1, SPRING.press);
        }
        opacity.value = withTiming(1, {
          duration: DURATION.short,
          easing: EASING.standard,
          reduceMotion: REDUCE_MOTION,
        });
        onPressOut?.(e);
      }}
      style={style}
      {...rest}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
});

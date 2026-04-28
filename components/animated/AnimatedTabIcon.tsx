import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { DURATION, EASING, SPRING, REDUCE_MOTION } from '../../utils/motion';

type Props = {
  emoji: string;
  label: string;
  focused: boolean;
};

/**
 * Icono de tab con micro-animación al cambiar de foco:
 *  - Spring sutil en la escala del emoji (1 → 1.08).
 *  - Indicador (línea dorada) que aparece debajo cuando está activo.
 *  - Color del label se interpola.
 */
export function AnimatedTabIcon({ emoji, label, focused }: Props) {
  const scale = useSharedValue(focused ? 1.08 : 1);
  const indicator = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, SPRING.pop);
    indicator.value = withTiming(focused ? 1 : 0, {
      duration: DURATION.short,
      easing: EASING.standard,
      reduceMotion: REDUCE_MOTION,
    });
  }, [focused, scale, indicator]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicator.value,
    transform: [{ scaleX: indicator.value }],
  }));

  return (
    <View className="items-center pt-1" accessibilityRole="tab" accessibilityState={{ selected: focused }}>
      <Animated.Text style={[emojiStyle, { fontSize: 20 }]}>{emoji}</Animated.Text>
      <Text className={`text-[10px] mt-0.5 ${focused ? 'text-gold font-semibold' : 'text-white/40'}`}>
        {label}
      </Text>
      <Animated.View
        style={[
          indicatorStyle,
          {
            marginTop: 3,
            width: 16,
            height: 2,
            borderRadius: 2,
            backgroundColor: '#D4A853',
          },
        ]}
      />
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { DURATION, REDUCE_MOTION } from '../../utils/motion';

type Props = Omit<TextProps, 'children'> & {
  value: number;
  decimals?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

function formatNumber(
  v: number,
  locale: string,
  decimals: number,
  prefix: string,
  suffix: string,
): string {
  const formatted = v.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return prefix + formatted + suffix;
}

/**
 * Texto numérico que hace count-up hasta `value` cuando se monta o cambia.
 * Si reduce-motion está activo, salta al valor final inmediatamente.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  locale = 'es-AR',
  prefix = '',
  suffix = '',
  duration = DURATION.long,
  style,
  ...rest
}: Props) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState<string>(() =>
    formatNumber(0, locale, decimals, prefix, suffix),
  );

  useEffect(() => {
    progress.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
      reduceMotion: REDUCE_MOTION,
    });
  }, [value, duration, progress]);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setDisplay)(formatNumber(current, locale, decimals, prefix, suffix));
    },
    [locale, decimals, prefix, suffix],
  );

  return (
    <Text style={style} {...rest}>
      {display}
    </Text>
  );
}

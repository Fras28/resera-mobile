import { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const logoResera = require('../assets/LogoRESERA.png');

interface Props {
  onDone: () => void;
}

export function SplashAnimation({ onDone }: Props) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.82);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    // Fade + scale in
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value   = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });

    // Hold 900ms → fade + scale out → call onDone
    opacity.value = withSequence(
      withTiming(1,  { duration: 700 }),
      withDelay(900, withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
    scale.value = withSequence(
      withTiming(1,    { duration: 700 }),
      withDelay(900,   withTiming(1.08, { duration: 500, easing: Easing.in(Easing.cubic) })),
    );
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <Image
          source={logoResera}
          style={{ width: width * 0.55, height: undefined, aspectRatio: 562 / 180 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Línea decorativa inferior */}
      <Animated.View style={[styles.line, { opacity: opacity.value }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#131313',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    bottom: 60,
    width: 32,
    height: 2,
    backgroundColor: '#8B1A1A',
    borderRadius: 2,
  },
});

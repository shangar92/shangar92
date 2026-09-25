import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  stroke?: number;
  used: number;
  total: number | null;
  gradient: readonly [string, string];
  id: string;
};

export function ProgressRing({ size = 108, stroke = 11, used, total, gradient, id }: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total ? Math.min(used / total, 1) : used > 0 ? 1 : 0;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, progress]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const remaining = total === null ? '∞' : String(total - used);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#g-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.value}>{remaining}</Text>
        <Text style={styles.caption}>left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  caption: { fontSize: 11, fontWeight: '600', color: colors.textFaint, marginTop: -2, textTransform: 'uppercase', letterSpacing: 0.8 },
});

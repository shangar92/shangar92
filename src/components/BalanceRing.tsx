import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

type Props = {
  id: string;
  left: number | null; // null = unlimited
  total: number | null;
  from: string;
  to: string;
  size?: number;
};

/** Ring that shows the days left; the arc is the share of the yearly allowance still unused. */
export function BalanceRing({ id, left, total, from, to, size = 74 }: Props) {
  const { t, dark } = useTheme();
  const stroke = 7;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const ratio = total && left !== null ? Math.min(left / total, 1) : 1;
  const offset = c * (1 - ratio);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={r} stroke={t.track} strokeWidth={stroke} fill="none" />
        {/* soft glow under the arc */}
        {ratio > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={to}
            strokeOpacity={dark ? 0.28 : 0.18}
            strokeWidth={stroke + 6}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
          />
        ) : null}
        {ratio > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={`url(#ring-${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color: t.text }]}>{left === null ? '∞' : left}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 19, fontWeight: '700' },
});

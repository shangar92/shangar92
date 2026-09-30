import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

type Props = {
  id: string;
  /** Share of the ring to fill, 0..1. */
  ratio: number;
  /** Big text in the middle, and an optional smaller part after it (e.g. "/24"). */
  value: string;
  of?: string;
  from: string;
  to: string;
  size?: number;
};

export function BalanceRing({ id, ratio, value, of, from, to, size = 86 }: Props) {
  const { t, dark } = useTheme();
  const stroke = 8;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(1, ratio || 0));
  const offset = c * (1 - fill);
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
        {fill > 0 ? (
          <>
            <Circle cx={center} cy={center} r={r} stroke={to} strokeOpacity={dark ? 0.28 : 0.18} strokeWidth={stroke + 6} strokeLinecap="round" fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} />
            <Circle cx={center} cy={center} r={r} stroke={`url(#ring-${id})`} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} />
          </>
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color: t.text }]}>
          {value}
          {of ? <Text style={[styles.of, { color: t.faint }]}>{of}</Text> : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 17, fontWeight: '800', writingDirection: 'ltr' },
  of: { fontSize: 12, fontWeight: '600' },
});

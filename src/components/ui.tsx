import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '../data';
import { radius, ThemeVars, useTheme } from '../theme';

type Weight = '400' | '500' | '600' | '700' | '800';

type TxtProps = TextProps & {
  size?: number;
  weight?: Weight;
  /** A theme color key (e.g. "muted") or any color string. */
  color?: keyof ThemeVars | (string & {});
  kurdish?: boolean;
};

export function Txt({ size = 14, weight = '400', color = 'text', kurdish, style, ...rest }: TxtProps) {
  const { t } = useTheme();
  const c = color in t ? t[color as keyof ThemeVars] : color;
  return (
    <Text
      {...rest}
      style={[
        { fontSize: size, fontWeight: weight, color: c },
        // Sorani glyphs are taller than Latin ones and need more line height to avoid overlapping.
        kurdish && { writingDirection: 'rtl', lineHeight: Math.round(size * 1.6) },
        style,
      ]}
    />
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt size={11} weight="600" color="faint" style={[{ letterSpacing: 0.9, textTransform: 'uppercase' }, style]}>
      {children}
    </Txt>
  );
}

export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.line },
        raised && { borderRadius: radius.xl, boxShadow: `0 18px 40px ${t.shadow}` },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBox({
  icon,
  bg,
  fg,
  size = 42,
  iconSize = 20,
}: {
  icon: IconName;
  bg: string;
  fg: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.31, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={iconSize} color={fg} />
    </View>
  );
}

export function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.pillDot, { backgroundColor: fg }]} />
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ initials, color, size = 38, square }: { initials: string; color: string; size?: number; square?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: square ? size * 0.33 : size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

/** Frosted chip used on top of the sunset header. */
export function Glass({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const content = <View style={[styles.glass, style]}>{children}</View>;
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function GlassIcon({ icon, onPress, dot }: { icon: IconName; onPress?: () => void; dot?: string }) {
  return (
    <Glass onPress={onPress} style={styles.glassIcon}>
      <Ionicons name={icon} size={20} color="#fff" />
      {dot ? <View style={[styles.glassDot, { backgroundColor: dot, boxShadow: `0 0 8px ${dot}` }]} /> : null}
    </Glass>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[t.btn1, t.btn2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btn, { boxShadow: `0 0 26px ${t.accGlow}, 0 10px 22px ${t.shadow}` }]}
      >
        {icon ? <Ionicons name={icon} size={20} color={t.btnInk} /> : null}
        <Text style={[styles.btnText, { color: t.btnInk }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  color,
  style,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, opacity: pressed ? 0.8 : 1 }, style]}
    >
      <Text style={[styles.btnText, { color: color ?? t.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Row inside a list card, with an optional divider under it. */
export function Row({
  children,
  divider,
  onPress,
  style,
}: {
  children: ReactNode;
  divider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTheme();
  const rowStyle = [styles.row, divider && { borderBottomWidth: 1, borderBottomColor: t.line }, style];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [rowStyle, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  ) : (
    <View style={rowStyle}>{children}</View>
  );
}

export function useStatusColors() {
  const { t } = useTheme();
  return {
    pending: { fg: t.amber, bg: t.amberSoft, icon: 'time-outline' as IconName },
    approved: { fg: t.green, bg: t.greenSoft, icon: 'checkmark' as IconName },
    declined: { fg: t.red, bg: t.redSoft, icon: 'close' as IconName },
  };
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glassIcon: { width: 42, height: 42, borderRadius: 13, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center' },
  glassDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4 },
  btn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
});

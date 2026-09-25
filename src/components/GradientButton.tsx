import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients, radius, shadow } from '../theme';

type Props = { label: string; icon?: string; onPress: () => void; style?: ViewStyle; disabled?: boolean };

export function GradientButton({ label, icon, onPress, style, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [shadow.float, { borderRadius: radius.pill }, style, { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
        {icon && <Ionicons name={icon as any} size={20} color="#fff" />}
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});

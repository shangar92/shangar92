import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '../theme';

type Props = {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
};

export function FilterChips({ options, value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)}>
            {active ? (
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                <Text style={[styles.label, styles.labelActive]}>{o.label}</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.chip, styles.chipIdle, styles.label]}>{o.label}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, overflow: 'hidden' },
  chipIdle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: '#fff' },
});

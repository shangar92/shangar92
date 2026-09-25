import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaveType } from '../data';
import { colors, radius, shadow } from '../theme';
import { ProgressRing } from './ProgressRing';

export function BalanceCard({ type }: { type: LeaveType }) {
  const accent = type.colors[0];
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={type.icon as any} size={15} color={accent} />
        </View>
        <Text style={styles.english}>{type.english}</Text>
      </View>
      <ProgressRing id={type.id} used={type.used} total={type.total} gradient={type.colors} />
      <Text style={[styles.label, { color: accent }]} numberOfLines={1}>
        {type.label}
      </Text>
      <Text style={styles.meta}>
        {type.used} used · {type.total === null ? 'unlimited' : `${type.total} total`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 158,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  english: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  label: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  meta: { fontSize: 12, color: colors.textFaint, marginTop: -6 },
});

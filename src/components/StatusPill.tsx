import { StyleSheet, Text, View } from 'react-native';
import { RequestStatus } from '../data';
import { colors, radius } from '../theme';

const map: Record<RequestStatus, { label: string; fg: string; bg: string }> = {
  accepted: { label: 'Approved', fg: colors.success, bg: colors.successSoft },
  pending: { label: 'Pending', fg: colors.warning, bg: colors.warningSoft },
  rejected: { label: 'Declined', fg: colors.danger, bg: colors.dangerSoft },
};

export function StatusPill({ status }: { status: RequestStatus }) {
  const s = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '700' },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDays, leaveTypeById, TimeOffRequest } from '../data';
import { colors, radius, shadow } from '../theme';
import { StatusPill } from './StatusPill';

type Props = {
  request: TimeOffRequest;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RequestCard({ request, onEdit, onDelete }: Props) {
  const type = leaveTypeById[request.type];
  const accent = type.colors[0];
  const single = request.from === request.to;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: accent + '18' }]}>
          <Ionicons name={type.icon as any} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {request.days === 0.5 ? 'Half day off' : `${formatDays(request.days)} off`}
          </Text>
          <Text style={styles.typeRow} numberOfLines={1}>
            <Text style={styles.typeEn}>{type.english}  ·  </Text>
            <Text style={[styles.type, { color: accent }]}>{type.label}</Text>
          </Text>
        </View>
        <StatusPill status={request.status} />
      </View>

      <View style={styles.dates}>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>{single ? 'Date' : 'From'}</Text>
          <Text style={styles.dateValue}>{formatDate(request.from)}</Text>
        </View>
        {!single && (
          <>
            <Ionicons name="arrow-forward" size={16} color={colors.textFaint} />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(request.to)}</Text>
            </View>
          </>
        )}
      </View>

      {(request.note || onEdit || onDelete) && (
        <View style={styles.footer}>
          <Text style={styles.note} numberOfLines={1}>
            {request.note ? `“${request.note}”` : ''}
          </Text>
          <View style={styles.actions}>
            {onEdit && (
              <Pressable onPress={onEdit} style={({ pressed }) => [styles.action, pressed && styles.pressed]} hitSlop={6}>
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={onDelete}
                style={({ pressed }) => [styles.action, { backgroundColor: colors.dangerSoft }, pressed && styles.pressed]}
                hitSlop={6}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    ...shadow.card,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  typeRow: { marginTop: 2, textAlign: 'left', writingDirection: 'ltr' },
  type: { fontSize: 13, fontWeight: '700' },
  typeEn: { fontSize: 13, color: colors.textFaint },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
  },
  dateBox: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: '600', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6 },
  dateValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { flex: 1, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
});

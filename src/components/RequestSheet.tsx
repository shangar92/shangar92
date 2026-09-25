import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDays, formatRange, LeaveTypeId, leaveTypes, TimeOffRequest, toISO } from '../data';
import { colors, radius } from '../theme';
import { GradientButton } from './GradientButton';

type Duration = 'full' | 'half' | 'range';

type Props = {
  visible: boolean;
  initial?: TimeOffRequest | null;
  onClose: () => void;
  onSubmit: (r: Omit<TimeOffRequest, 'id' | 'status'>) => void;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function upcomingDays(count: number) {
  const start = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function RequestSheet({ visible, initial, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const days = useMemo(() => upcomingDays(21), []);
  const [type, setType] = useState<LeaveTypeId>('annual');
  const [duration, setDuration] = useState<Duration>('full');
  const [from, setFrom] = useState(toISO(days[1]));
  const [to, setTo] = useState(toISO(days[1]));
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setType(initial.type);
      setDuration(initial.days === 0.5 ? 'half' : initial.from === initial.to ? 'full' : 'range');
      setFrom(initial.from);
      setTo(initial.to);
      setNote(initial.note ?? '');
    } else {
      setType('annual');
      setDuration('full');
      setFrom(toISO(days[1]));
      setTo(toISO(days[1]));
      setNote('');
    }
  }, [visible, initial, days]);

  const pickDay = (iso: string) => {
    if (duration !== 'range') {
      setFrom(iso);
      setTo(iso);
    } else if (from !== to || iso < from) {
      // start a new range
      setFrom(iso);
      setTo(iso);
    } else {
      setTo(iso);
    }
  };

  const totalDays = useMemo(() => {
    if (duration === 'half') return 0.5;
    const ms = new Date(to).getTime() - new Date(from).getTime();
    return Math.round(ms / 86400000) + 1;
  }, [duration, from, to]);

  const submit = () => {
    onSubmit({ type, days: totalDays, from, to, note: note.trim() || undefined });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{initial ? 'Edit request' : 'Request time off'}</Text>
            <Pressable onPress={onClose} style={styles.close} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingBottom: 8 }}>
            <View>
              <Text style={styles.section}>Leave type</Text>
              <View style={styles.typeGrid}>
                {leaveTypes.map((t) => {
                  const active = t.id === type;
                  const accent = t.colors[0];
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setType(t.id)}
                      style={[styles.typeItem, active && { borderColor: accent, backgroundColor: accent + '10' }]}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: accent + (active ? '' : '18') }]}>
                        <Ionicons name={t.icon as any} size={16} color={active ? '#fff' : accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.typeLabel} numberOfLines={1}>
                          {t.label}
                        </Text>
                        <Text style={styles.typeSub}>
                          {t.total === null ? 'Unlimited' : `${t.total - t.used} left`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={styles.section}>Duration</Text>
              <View style={styles.durationRow}>
                {(
                  [
                    ['full', 'Full day', 'sunny-outline'],
                    ['half', 'Half day', 'partly-sunny-outline'],
                    ['range', 'Multiple', 'calendar-outline'],
                  ] as const
                ).map(([key, label, icon]) => {
                  const active = duration === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setDuration(key);
                        setTo(from);
                      }}
                      style={[styles.durationItem, active && styles.durationActive]}
                    >
                      <Ionicons name={icon} size={18} color={active ? '#fff' : colors.textMuted} />
                      <Text style={[styles.durationLabel, active && { color: '#fff' }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <View style={styles.sectionRow}>
                <Text style={styles.section}>{duration === 'range' ? 'Pick start & end' : 'Pick a date'}</Text>
                <Text style={styles.summary}>{formatRange(from, to)}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {days.map((d) => {
                  const iso = toISO(d);
                  const selected = iso >= from && iso <= to;
                  const edge = iso === from || iso === to;
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  return (
                    <Pressable
                      key={iso}
                      onPress={() => pickDay(iso)}
                      style={[styles.day, selected && styles.dayInRange, edge && styles.daySelected]}
                    >
                      <Text style={[styles.dayName, weekend && { color: colors.primary }, edge && { color: '#fff' }]}>
                        {WEEKDAYS[d.getDay()]}
                      </Text>
                      <Text style={[styles.dayNum, edge && { color: '#fff' }]}>{d.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View>
              <Text style={styles.section}>Note (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a reason for your manager…"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                multiline
              />
            </View>
          </ScrollView>

          <GradientButton
            label={`${initial ? 'Save changes' : 'Submit request'} · ${formatDays(totalDays)}`}
            icon={initial ? 'checkmark' : 'paper-plane'}
            onPress={submit}
            style={{ marginTop: 12 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,20,43,0.45)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '92%',
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  summary: { fontSize: 13, fontWeight: '600', color: colors.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeItem: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'left' },
  typeSub: { fontSize: 11, color: colors.textFaint, marginTop: 1 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  durationActive: { backgroundColor: colors.text },
  durationLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  day: {
    width: 56,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayInRange: { backgroundColor: colors.primarySoft },
  daySelected: { backgroundColor: colors.primary },
  dayName: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  dayNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  input: {
    minHeight: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});

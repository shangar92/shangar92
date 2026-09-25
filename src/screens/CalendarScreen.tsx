import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRange, leaveTypeById, TimeOffRequest, toISO } from '../data';
import { colors, radius, shadow } from '../theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = { requests: TimeOffRequest[]; topInset: number; bottomInset: number };

export function CalendarScreen({ requests, topInset, bottomInset }: Props) {
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayISO = toISO(new Date());

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1))];
  }, [year, month]);

  const approved = requests.filter((r) => r.status !== 'rejected');
  const colorFor = (iso: string) => {
    const r = approved.find((x) => iso >= x.from && iso <= x.to);
    return r ? leaveTypeById[r.type].colors[0] : null;
  };
  const inMonth = approved.filter((r) => r.from.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));

  const shift = (n: number) => setCursor(new Date(year, month + n, 1));

  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset, paddingHorizontal: 20 }}>
      <Text style={styles.title}>Calendar</Text>
      <View style={styles.card}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shift(-1)} style={styles.nav}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.month}>
            {MONTHS[month]} {year}
          </Text>
          <Pressable onPress={() => shift(1)} style={styles.nav}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {DOW.map((d, i) => (
            <Text key={i} style={styles.dow}>
              {d}
            </Text>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const iso = toISO(d);
            const c = colorFor(iso);
            const isToday = iso === todayISO;
            return (
              <View key={iso} style={styles.cell}>
                <View style={[styles.dayCircle, c && { backgroundColor: c }, isToday && !c && styles.today]}>
                  <Text style={[styles.dayText, c && { color: '#fff' }, isToday && !c && { color: colors.primary }]}>
                    {d.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.section}>This month</Text>
      {inMonth.length === 0 ? (
        <Text style={styles.none}>No time off this month</Text>
      ) : (
        inMonth.map((r) => {
          const t = leaveTypeById[r.type];
          return (
            <View key={r.id} style={styles.item}>
              <View style={[styles.bar, { backgroundColor: t.colors[0] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{t.english} · {t.label}</Text>
                <Text style={styles.itemSub}>{formatRange(r.from, r.to)}</Text>
              </View>
              <Text style={styles.itemDays}>{r.days}d</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, ...shadow.card },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  nav: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 17, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textFaint, paddingVertical: 8 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: colors.primary },
  dayText: { fontSize: 15, fontWeight: '600', color: colors.text },
  section: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 28, marginBottom: 12 },
  none: { color: colors.textFaint, textAlign: 'center', paddingVertical: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  itemDays: { fontSize: 15, fontWeight: '800', color: colors.text },
});

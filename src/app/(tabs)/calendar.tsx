import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HeroScreen } from '../../components/HeroScreen';
import { DayMark, MonthGrid } from '../../components/MonthGrid';
import { Avatar, Card, Label, Pill, Txt, useStatusColors } from '../../components/ui';
import {
  formatDays,
  formatShort,
  holidays,
  leaveTypeById,
  MONTHS_LONG,
  parseISO,
  personById,
  requestDays,
  statusLabel,
  toISO,
} from '../../data';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

export default function CalendarScreen() {
  const { t } = useTheme();
  const { requests } = useStore();
  const statusColors = useStatusColors();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => toISO(new Date()));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const active = requests.filter((r) => r.status !== 'declined');

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    for (const r of active) {
      for (let d = parseISO(r.from); d <= parseISO(r.to); d.setDate(d.getDate() + 1)) {
        m[toISO(d)] = r.status === 'approved' ? 'approved' : 'pending';
      }
    }
    return m;
  }, [active]);

  const dayRequests = active.filter((r) => selected >= r.from && selected <= r.to);
  const shift = (n: number) => setCursor(new Date(year, month + n, 1));

  return (
    <HeroScreen
      designHeight={196}
      viewY={240}
      hero={
        <Txt size={24} weight="700" color="#FFFFFF" style={{ marginTop: 8, letterSpacing: -0.5 }}>
          Calendar
        </Txt>
      }
    >
      <View style={styles.px}>
        <Card raised style={{ padding: 16 }}>
          <View style={[styles.between, { marginBottom: 8 }]}>
            <Pressable onPress={() => shift(-1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel="Previous month">
              <Ionicons name="chevron-back" size={16} color={t.text} />
            </Pressable>
            <Txt size={16} weight="700">
              {MONTHS_LONG[month]} {year}
            </Txt>
            <Pressable onPress={() => shift(1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel="Next month">
              <Ionicons name="chevron-forward" size={16} color={t.text} />
            </Pressable>
          </View>
          <MonthGrid year={year} month={month} marks={marks} selected={selected} onPressDay={setSelected} />
          <View style={[styles.row, { gap: 14, marginTop: 4 }]}>
            <Legend swatch={<View style={[styles.swatch, { backgroundColor: t.petrol }]} />} label="Approved" />
            <Legend swatch={<View style={[styles.swatch, { backgroundColor: t.amberSoft, borderWidth: 1, borderColor: t.amber }]} />} label="Pending" />
            <Legend swatch={<View style={[styles.dot, { backgroundColor: t.amber }]} />} label="Holiday" />
          </View>
        </Card>
      </View>

      <Label style={{ marginTop: 18, paddingHorizontal: 20 }}>{formatShort(selected)}</Label>
      <View style={[styles.px, { gap: 10, marginTop: 8 }]}>
        {holidays[selected] ? (
          <Card style={styles.item}>
            <View style={[styles.bar, { backgroundColor: t.amber }]} />
            <Txt weight="700" style={{ flex: 1 }}>
              {holidays[selected]}
            </Txt>
          </Card>
        ) : null}
        {dayRequests.map((r) => {
          const s = statusColors[r.status];
          const handover = r.handover ? personById[r.handover] : undefined;
          return (
            <View key={r.id} style={{ gap: 10 }}>
              <Pressable onPress={() => router.push(`/request/${r.id}`)}>
                <Card style={styles.item}>
                  <View style={[styles.bar, { backgroundColor: r.status === 'approved' ? t.petrol : t.amber }]} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="700">
                      {leaveTypeById[r.type].english} leave · {formatDays(requestDays(r))}
                    </Txt>
                    <Txt size={12} color="muted">
                      {r.code} · {r.status === 'approved' ? 'approved by Sara Hassan' : 'waiting for approval'}
                    </Txt>
                  </View>
                  <Pill label={statusLabel(r)} fg={s.fg} bg={s.bg} />
                </Card>
              </Pressable>
              {handover ? (
                <Card style={styles.item}>
                  <View style={[styles.bar, { backgroundColor: t.line }]} />
                  <View style={{ flex: 1 }}>
                    <Txt weight="700">{handover.name} covering</Txt>
                    <Txt size={12} color="muted">
                      Handover of daily reports
                    </Txt>
                  </View>
                  <Avatar initials={handover.initials} color={t.petrol} size={32} />
                </Card>
              ) : null}
            </View>
          );
        })}
        {!holidays[selected] && dayRequests.length === 0 ? (
          <Card style={styles.item}>
            <View style={[styles.bar, { backgroundColor: t.line }]} />
            <Txt color="muted" style={{ flex: 1 }}>
              {parseISO(selected).getDay() >= 5 ? 'Weekend' : 'Working day'} · no leave
            </Txt>
          </Card>
        ) : null}
      </View>
    </HeroScreen>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={[styles.row, { gap: 6 }]}>
      {swatch}
      <Txt size={12} color="muted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
});

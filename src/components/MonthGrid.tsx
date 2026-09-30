import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { holidays, isWeekend, toISO, WEEKDAYS } from '../data';
import { useTheme } from '../theme';

export type DayMark = 'approved' | 'pending' | 'selected';

type Props = {
  year: number;
  month: number; // 0-11
  /** Marks for days, keyed by ISO date. Consecutive marked days join into one bar. */
  marks: Record<string, DayMark>;
  selected?: string;
  onPressDay?: (iso: string) => void;
  /** Days before this ISO date are shown faded and can't be pressed. */
  minDate?: string;
};

export function MonthGrid({ year, month, marks, selected, onPressDay, minDate }: Props) {
  const { t } = useTheme();
  const todayISO = toISO(new Date());

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array<null>(first).fill(null),
      ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [year, month]);

  const markStyle = (mark: DayMark) =>
    mark === 'pending'
      ? { bg: t.amberSoft, fg: t.amber }
      : { bg: t.petrol, fg: '#FFFFFF' };

  return (
    <View>
      <View style={styles.week}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.head, { color: t.faint }]}>
            {d.toUpperCase()}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;
            const iso = toISO(date);
            const mark = marks[iso];
            const prev = new Date(date);
            prev.setDate(date.getDate() - 1);
            const next = new Date(date);
            next.setDate(date.getDate() + 1);
            const joinLeft = !!mark && i > 0 && marks[toISO(prev)] === mark;
            const joinRight = !!mark && i < 6 && marks[toISO(next)] === mark;
            const colors = mark ? markStyle(mark) : null;
            const disabled = !!minDate && iso < minDate;
            const faded = isWeekend(date) || disabled;
            return (
              <Pressable
                key={i}
                disabled={!onPressDay || disabled}
                onPress={() => onPressDay?.(iso)}
                style={[
                  styles.cell,
                  colors && {
                    backgroundColor: colors.bg,
                    borderTopLeftRadius: joinLeft ? 0 : 12,
                    borderBottomLeftRadius: joinLeft ? 0 : 12,
                    borderTopRightRadius: joinRight ? 0 : 12,
                    borderBottomRightRadius: joinRight ? 0 : 12,
                  },
                  !mark && (iso === selected || iso === todayISO) && {
                    borderWidth: 1.5,
                    borderColor: iso === selected ? t.petrol : t.acc,
                    borderRadius: 12,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.day,
                    { color: colors ? colors.fg : faded ? t.faint : t.text },
                    (mark || iso === todayISO) && { fontWeight: '700' },
                    disabled && { opacity: 0.5 },
                  ]}
                >
                  {date.getDate()}
                </Text>
                {holidays[iso] ? <View style={[styles.holiday, { backgroundColor: t.amber }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', marginBottom: 6 },
  head: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  cell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 14, fontWeight: '500' },
  holiday: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3 },
});

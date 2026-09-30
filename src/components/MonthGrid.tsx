import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isoLocal } from '../lib/dates';
import { WEEKDAYS_SHORT } from '../lib/i18n';
import { isHoliday } from '../lib/rules';
import { useSession } from '../state/session';
import { useTheme } from '../theme';

export type DayMark = 'approved' | 'pending' | 'selected';

type Props = {
  year: number;
  month: number; // 0-11
  /** Filled days, keyed by ISO date. Consecutive marked days join into one bar. */
  marks?: Record<string, DayMark>;
  /** Days that get a small dot underneath (e.g. your own approved leave). */
  dots?: Record<string, string>;
  selected?: string;
  onPressDay?: (iso: string) => void;
  /** Days before this ISO date are faded and can't be pressed. */
  minDate?: string;
  empId?: string;
};

export function MonthGrid({ year, month, marks = {}, dots = {}, selected, onPressDay, minDate, empId }: Props) {
  const { t } = useTheme();
  const { lang } = useSession();
  const todayISO = isoLocal(new Date());

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [...Array<null>(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1))];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [year, month]);

  const markStyle = (mark: DayMark) => (mark === 'pending' ? { bg: t.amberSoft, fg: t.amber } : { bg: t.petrol, fg: '#FFFFFF' });

  return (
    <View>
      <View style={styles.week}>
        {WEEKDAYS_SHORT[lang].map((d, i) => (
          <Text key={i} style={[styles.head, { color: t.faint }]}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;
            const iso = isoLocal(date);
            const mark = marks[iso];
            const prev = new Date(date);
            prev.setDate(date.getDate() - 1);
            const next = new Date(date);
            next.setDate(date.getDate() + 1);
            // "Start" and "end" follow the reading direction because the row itself is flipped in RTL.
            const joinStart = !!mark && i > 0 && marks[isoLocal(prev)] === mark;
            const joinEnd = !!mark && i < 6 && marks[isoLocal(next)] === mark;
            const colors = mark ? markStyle(mark) : null;
            const disabled = !!minDate && iso < minDate;
            const dow = date.getDay();
            const weekend = dow === 5 || dow === 6;
            const isSel = iso === selected;
            return (
              <Pressable
                key={i}
                disabled={!onPressDay || disabled}
                onPress={() => onPressDay?.(iso)}
                style={[
                  styles.cell,
                  colors && {
                    backgroundColor: colors.bg,
                    borderTopStartRadius: joinStart ? 0 : 12,
                    borderBottomStartRadius: joinStart ? 0 : 12,
                    borderTopEndRadius: joinEnd ? 0 : 12,
                    borderBottomEndRadius: joinEnd ? 0 : 12,
                  },
                  !mark && isSel && { backgroundColor: t.text, borderRadius: 12 },
                  !mark && !isSel && iso === todayISO && { borderWidth: 1.5, borderColor: t.acc, borderRadius: 12 },
                ]}
              >
                <Text
                  style={[
                    styles.day,
                    { color: colors ? colors.fg : isSel ? t.bg : weekend || disabled ? t.faint : t.text },
                    (mark || isSel || iso === todayISO) && { fontWeight: '800' },
                    disabled && { opacity: 0.5 },
                  ]}
                >
                  {date.getDate()}
                </Text>
                {isHoliday(iso, empId) ? (
                  <View style={[styles.dot, { backgroundColor: t.amber }]} />
                ) : dots[iso] ? (
                  <View style={[styles.dot, { backgroundColor: isSel ? t.bg : dots[iso] }]} />
                ) : null}
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
  head: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  cell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 14, fontWeight: '500' },
  dot: { position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3 },
});

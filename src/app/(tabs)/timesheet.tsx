// Timesheet: the pay month (21st -> 20th) for the people you look after.
// View only, as on the website's employee app.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { SectionTitle } from '../../components/leave';
import { Card, Txt } from '../../components/ui';
import { isRtl, monthLabel } from '../../lib/i18n';
import { allLeaveTypes, allLeaveTypesRaw, computeCell, currentPayPeriod, getPayPeriodDays, isHoliday, leaveTypeLabel } from '../../lib/rules';
import { useData } from '../../state/data';
import { useSession, useT } from '../../state/session';
import { useTheme } from '../../theme';

const ROW_H = 36;
const NAME_W = 150;
const CELL_W = 34;

function cellStyle(v: string, day: Date) {
  if (v === 'HD') return { bg: '#9BF569', fg: '#000000' };
  const lt = allLeaveTypes().find((l) => l.code === v);
  if (lt) return { bg: lt.color, fg: lt.textColor || '#FFFFFF' };
  const dow = day.getDay();
  if (dow === 6) return { bg: '#54B9C1', fg: '#FFFFFF' };
  if (dow === 5) return { bg: '#0091A0', fg: '#FFFFFF' };
  if (v === 'D') return { bg: '#E3F2FD', fg: '#000000' };
  if (v === 'N') return { bg: '#1A1A2E', fg: '#FFFFFF' };
  return { bg: '#FFFFFF', fg: '#000000' };
}

export default function TimesheetTab() {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const rtl = isRtl(lang);
  const { myPeople, timesheetCells } = useData();
  const [month, setMonth] = useState(() => currentPayPeriod());
  const days = useMemo(() => getPayPeriodDays(month), [month]);
  const people = useMemo(
    () => myPeople.slice().sort((a, b) => (Number(a.tsOrder ?? 1e9) - Number(b.tsOrder ?? 1e9)) || String(a.fullName || '').localeCompare(String(b.fullName || ''))),
    [myPeople],
  );
  const shift = (n: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  };
  const seen = new Set<string>();
  people.forEach((e) => days.forEach((d) => {
    const v = computeCell(e, d, timesheetCells);
    if (v && !['8', 'D', 'N', 'R', 'HD', ''].includes(v)) seen.add(v);
  }));
  const used = allLeaveTypesRaw().filter((x) => seen.has(x.code));
  const anyHoliday = days.some((d) => people.some((e) => isHoliday(d, e.id)));

  return (
    <HeroScreen designHeight={196} hero={<HeroTitle title={tr('تایم شیت', 'Timesheet', 'جدول الدوام')} />}>
      <View style={[styles.px, { gap: 12 }]}>
        <Card raised style={{ padding: 16, gap: 12 }}>
          <SectionTitle
            sub={tr(
              people.length + ' کارمەند. تەنها بۆ بینینە — ناتوانیت لێرەوە دەستکاری بکەیت یان بسڕیتەوە. کلیک لە ناوی کارمەندێک بکە بۆ بینینی هەموو زانیاری مۆڵەتەکانی.',
              people.length + ' people. View only — nothing here can be edited or removed. Tap a name to see all of that person\'s leave.',
              people.length + ' شخص. للعرض فقط — لا يمكن التعديل أو الحذف هنا. اضغط على اسم لعرض كل إجازاته.',
            )}
          >
            {tr('تایم شیتی بەشەکەت', "Your team's timesheet", 'جدول دوام فريقك')}
          </SectionTitle>
          <View style={styles.between}>
            <Pressable onPress={() => shift(-1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel={tr('مانگی پێشوو', 'Previous month', 'الشهر السابق')}>
              <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={16} color={t.text} />
            </Pressable>
            <Txt size={15} weight="700">
              {monthLabel(month, lang)}
            </Txt>
            <Pressable onPress={() => shift(1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel={tr('مانگی داهاتوو', 'Next month', 'الشهر التالي')}>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={t.text} />
            </Pressable>
          </View>
        </Card>
      </View>

      {/* Names stay put; the days scroll sideways. The grid itself always runs left to right like a calendar sheet. */}
      <View style={[styles.sheet, { borderColor: t.line, backgroundColor: t.surface }]}>
        <View style={{ width: NAME_W }}>
          <View style={[styles.nameCell, { height: ROW_H + 6, backgroundColor: t.navy }]}>
            <Txt size={11.5} weight="700" color="#FFFFFF">
              {tr('ناو', 'Name', 'الاسم')}
            </Txt>
          </View>
          {people.map((e, i) => (
            <Pressable
              key={e.id}
              onPress={() => router.push({ pathname: '/person/[id]', params: { id: e.id } })}
              style={[styles.nameCell, { borderTopWidth: 1, borderTopColor: t.line }, i % 2 ? { backgroundColor: t.field } : null]}
            >
              <Txt size={12} weight="700" numberOfLines={1} color="petrol">
                {e.fullName || '—'}
              </Txt>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ direction: 'ltr' }}>
          <View>
            <View style={[styles.gridRow, { backgroundColor: t.navy, height: ROW_H + 6 }]}>
              {days.map((d) => (
                <View key={d.toISOString()} style={styles.headCell}>
                  <Txt size={11} weight="800" color="#FFFFFF" style={{ textAlign: 'center' }}>
                    {d.getDate()}
                  </Txt>
                </View>
              ))}
            </View>
            {people.map((e) => (
              <View key={e.id} style={[styles.gridRow, { borderTopWidth: 1, borderTopColor: t.line }]}>
                {days.map((d) => {
                  const v = computeCell(e, d, timesheetCells);
                  const s = cellStyle(v, d);
                  return (
                    <View key={d.toISOString()} style={[styles.cell, { backgroundColor: s.bg, borderColor: t.line }]}>
                      <Txt size={10.5} weight="700" color={s.fg} style={{ textAlign: 'center', lineHeight: 14 }}>
                        {v}
                      </Txt>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      {people.length === 0 ? (
        <Txt color="muted" style={{ textAlign: 'center', paddingVertical: 22 }}>
          {tr('کەس نییە.', 'Nobody here.', 'لا أحد هنا.')}
        </Txt>
      ) : null}

      {used.length || anyHoliday ? (
        <View style={[styles.px, { marginTop: 14, gap: 8 }]}>
          <Txt size={12} weight="700">
            {tr('جۆرەکانی مۆڵەت لەم مانگەدا', 'Leave types this month', 'أنواع الإجازات هذا الشهر')}
          </Txt>
          <View style={[styles.legend]}>
            {anyHoliday ? <Legend color="#9BF569" code="HD" label={tr('پشووی فەرمی', 'Official holiday', 'عطلة رسمية')} /> : null}
            {used.map((lt) => (
              <Legend key={lt.code} color={lt.color} code={lt.code} label={leaveTypeLabel(lt.code, lang)} />
            ))}
          </View>
        </View>
      ) : null}
    </HeroScreen>
  );
}

function Legend({ color, code, label }: { color: string; code: string; label: string }) {
  return (
    <View style={[styles.row, { gap: 6 }]}>
      <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: color }} />
      <Txt size={12}>
        <Txt size={12} weight="800">
          {code}
        </Txt>
        {' — ' + label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sheet: { flexDirection: 'row', marginTop: 12, marginHorizontal: 12, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  nameCell: { height: ROW_H, justifyContent: 'center', paddingHorizontal: 10 },
  gridRow: { flexDirection: 'row', height: ROW_H },
  headCell: { width: CELL_W, alignItems: 'center', justifyContent: 'center' },
  cell: { width: CELL_W, alignItems: 'center', justifyContent: 'center', borderStartWidth: StyleSheet.hairlineWidth },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

// Calendar: a month of your leave (approved, and pending while it waits for signatures),
// and who is off on the day you tap.
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HeroScreen } from '../../components/HeroScreen';
import { Empty, statusOf } from '../../components/leave';
import { DayMark, MonthGrid } from '../../components/MonthGrid';
import { PersonAvatar } from '../../components/PersonAvatar';
import { Card, GlassIcon, PrimaryButton, Txt } from '../../components/ui';
import { dmy, isoLocal, parseLocalDate } from '../../lib/dates';
import { isRtl, longDay, MONTHS } from '../../lib/i18n';
import { canViewLeaveOf, holidayName, leaveTypeColor, leaveTypeLabel } from '../../lib/rules';
import { useData } from '../../state/data';
import { useSession, useT } from '../../state/session';
import { useTheme } from '../../theme';

export default function CalendarTab() {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const rtl = isRtl(lang);
  const { me, role, emps, depts, lvs, unreadCount } = useData();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [pick, setPick] = useState(() => isoLocal(today));
  const y = cursor.getFullYear();
  const m = cursor.getMonth();

  // Your own requests: approved days are filled, pending ones are shown as soon as you send them.
  const marks = useMemo(() => {
    const out: Record<string, DayMark> = {};
    lvs.forEach((l) => {
      if (l.empId !== me.id || (l.status !== 'approved' && l.status !== 'pending') || !l.from || !l.to) return;
      const d = parseLocalDate(l.from);
      const end = parseLocalDate(l.to);
      for (let guard = 0; d <= end && guard < 400; guard++) {
        const iso = isoLocal(d);
        if (out[iso] !== 'approved') out[iso] = l.status;
        d.setDate(d.getDate() + 1);
      }
    });
    return out;
  }, [lvs, me.id]);

  // Approved leave of people this person may see (others' data never reaches the screen), plus your own pending requests.
  const offThatDay = lvs.filter((l) => {
    if (l.from > pick || l.to < pick) return false;
    if (l.status === 'pending') return l.empId === me.id;
    if (l.status !== 'approved') return false;
    return canViewLeaveOf(me, role, emps.find((x) => x.id === l.empId), depts);
  });
  const holiday = holidayName(pick);
  const pickDate = new Date(Number(pick.slice(0, 4)), Number(pick.slice(5, 7)) - 1, Number(pick.slice(8, 10)));
  const shift = (n: number) => setCursor(new Date(y, m + n, 1));

  return (
    <HeroScreen
      designHeight={230}
      lift={30}
      fade
      hero={
        <View style={[styles.between, { marginTop: 6 }]}>
          <View style={[styles.row, { gap: 12, flex: 1 }]}>
            <PersonAvatar person={me} size={46} square />
            <View style={{ flex: 1 }}>
              <Txt size={13} color="#D8DDE8">
                {tr('بەخێربێیتەوە', 'Welcome back', 'مرحبًا بعودتك')}
              </Txt>
              <Txt size={20} weight="700" color="#FFFFFF" numberOfLines={1}>
                {me.fullName || '—'}
              </Txt>
            </View>
          </View>
          <GlassIcon icon="notifications-outline" dot={unreadCount ? t.acc : undefined} onPress={() => router.navigate('/notifications')} />
        </View>
      }
    >
      <View style={styles.px}>
        <Card raised style={{ padding: 16 }}>
          <View style={[styles.between, { marginBottom: 8 }]}>
            <Pressable onPress={() => shift(-1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel={tr('مانگی پێشوو', 'Previous month', 'الشهر السابق')}>
              <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={16} color={t.text} />
            </Pressable>
            <Txt size={16} weight="700">
              {MONTHS[lang][m]} {y}
            </Txt>
            <Pressable onPress={() => shift(1)} style={[styles.nav, { backgroundColor: t.bg }]} accessibilityLabel={tr('مانگی داهاتوو', 'Next month', 'الشهر التالي')}>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={t.text} />
            </Pressable>
          </View>
          <MonthGrid year={y} month={m} marks={marks} selected={pick} onPressDay={setPick} empId={me.id} />
          <View style={[styles.row, { gap: 14, marginTop: 2, flexWrap: 'wrap' }]}>
            <View style={[styles.row, { gap: 6 }]}>
              <View style={[styles.dot, { backgroundColor: t.petrol }]} />
              <Txt size={12} color="muted">
                {tr('مۆڵەتی من', 'My leave', 'إجازتي')}
              </Txt>
            </View>
            <View style={[styles.row, { gap: 6 }]}>
              <View style={[styles.dot, { backgroundColor: t.amberSoft, borderWidth: 1, borderColor: t.amber }]} />
              <Txt size={12} color="muted">
                {tr('چاوەڕوان', 'Pending', 'قيد الانتظار')}
              </Txt>
            </View>
            <View style={[styles.row, { gap: 6 }]}>
              <View style={[styles.dot, { backgroundColor: t.amber }]} />
              <Txt size={12} color="muted">
                {tr('پشووی فەرمی', 'Official holiday', 'عطلة رسمية')}
              </Txt>
            </View>
          </View>
        </Card>
      </View>

      <View style={[styles.px, { marginTop: 18, gap: 10 }]}>
        <Txt size={16} weight="700">
          {longDay(pickDate, lang)}
        </Txt>
        {holiday ? (
          <Card style={[styles.item, { borderColor: t.amber }]}>
            <Ionicons name="sunny-outline" size={20} color={t.amber} />
            <Txt weight="700" style={{ flex: 1 }}>
              {holiday}
            </Txt>
          </Card>
        ) : null}
        {offThatDay.length === 0 ? <Empty text={tr('کەس لەم ڕۆژەدا لە مۆڵەت نییە.', 'Nobody is off on this day.', 'لا أحد في إجازة هذا اليوم.')} /> : null}
        {offThatDay.map((l) => {
          const e = emps.find((x) => x.id === l.empId);
          const color = leaveTypeColor(l.type);
          const pending = l.status === 'pending' ? statusOf(l, tr) : null;
          return (
            <Card key={l.id} style={styles.item}>
              <PersonAvatar person={e} name={l.empName} size={38} />
              <View style={{ flex: 1 }}>
                <Txt weight="700" numberOfLines={1}>
                  {e?.fullName || l.empName}
                  {e?.hrCode ? <Txt size={12} color="muted">{'  ·  ' + e.hrCode}</Txt> : null}
                </Txt>
                <Txt size={12} color="muted" style={{ writingDirection: 'ltr', textAlign: rtl ? 'right' : 'left' }}>
                  {dmy(l.from) + (l.to !== l.from ? '  →  ' + dmy(l.to) : '')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.tag, { backgroundColor: color + '22' }]}>
                  <Txt size={11} weight="800" color={color}>
                    {leaveTypeLabel(l.type, lang)}
                  </Txt>
                </View>
                {pending ? (
                  <View style={[styles.tag, { backgroundColor: pending.color + '22' }]}>
                    <Txt size={11} weight="800" color={pending.color}>
                      {pending.label}
                    </Txt>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })}
        <PrimaryButton
          icon="add"
          label={tr('داواکاری مۆڵەت', 'Request day off', 'طلب إجازة')}
          onPress={() => router.push({ pathname: '/request/new', params: { date: pick } })}
          style={{ marginTop: 6 }}
        />
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 },
  tag: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
});

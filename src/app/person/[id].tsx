// Someone else's leave, opened from a request, the timesheet or watching:
// their balances and history, with no way to change anything.
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BalanceTable } from '../../components/balances';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { Empty, LeaveArchive, LeaveCard, SectionTitle } from '../../components/leave';
import { PersonAvatar } from '../../components/PersonAvatar';
import { Card, Txt } from '../../components/ui';
import { canViewLeaveOf, deptName, FULL_ROLES } from '../../lib/rules';
import type { Leave } from '../../lib/types';
import { useData } from '../../state/data';
import { useT } from '../../state/session';

export default function PersonScreen() {
  const tr = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { emps, depts, lvs, me, role, canSeeBal, myPeople, inbox, decided, watching } = useData();
  const person = emps.find((e) => e.id === id);

  // Reachable only for people whose leave this person has a reason to see.
  const allowed =
    !!person &&
    (FULL_ROLES.includes(role) ||
      canViewLeaveOf(me, role, person, depts) ||
      myPeople.some((p) => p.id === id) ||
      [...inbox, ...decided, ...watching].some((l) => l.empId === id));

  const history = person ? lvs.filter((l) => l.empId === person.id) : [];
  return (
    <HeroScreen
      designHeight={196}
      viewY={240}
      withTabBar={false}
      hero={<HeroTitle back title={person?.fullName || '—'} over={person ? deptName(person, depts) : undefined} />}
    >
      <View style={{ gap: 18 }}>
        {!person || !allowed ? (
          <View style={styles.px}>
            <Card raised style={{ padding: 8 }}>
              <Empty text={tr('ئەم کەسە نەدۆزرایەوە.', 'This person could not be found.', 'لم يتم العثور على هذا الشخص.')} />
            </Card>
          </View>
        ) : (
          <>
            <View style={styles.px}>
              <Card raised style={[styles.row, { padding: 14, gap: 12 }]}>
                <PersonAvatar person={person} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={16} weight="800">
                    {person.fullName}
                  </Txt>
                  <Txt size={12.5} color="muted">
                    {[person.hrCode ? 'HR ' + person.hrCode : null, person.position].filter(Boolean).join(' · ') || '—'}
                  </Txt>
                </View>
              </Card>
            </View>
            {canSeeBal(person.id) ? (
              <View>
                <View style={styles.px}>
                  <SectionTitle>{tr('ماوەی مۆڵەتەکان', 'Leave balances', 'أرصدة الإجازات')}</SectionTitle>
                </View>
                <BalanceTable person={person} />
              </View>
            ) : null}
            <View style={[styles.px, { gap: 10 }]}>
              <SectionTitle>{tr('مێژووی مۆڵەت', 'Leave history', 'سجل الإجازات')}</SectionTitle>
              <LeaveArchive items={history} render={(l: Leave) => <LeaveCard key={l.id} l={l} mode="view" showPerson={false} />} emptyText={tr('هیچ داواکارییەک نییە.', 'No requests yet.', 'لا توجد طلبات بعد.')} />
            </View>
          </>
        )}
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
});

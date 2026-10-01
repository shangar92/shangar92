// Balance: what is left of each leave type, the numbers behind it, pending
// requests, and your whole history.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BalanceRings, BalanceTable } from '../../components/balances';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { ChipRow, Empty, LeaveArchive, LeaveCard, SectionTitle } from '../../components/leave';
import { PrimaryButton } from '../../components/ui';
import { leaveTypeColor, leaveTypeLabel, leaveYearOf } from '../../lib/rules';
import type { Leave } from '../../lib/types';
import { useData } from '../../state/data';
import { useSession, useT } from '../../state/session';

export default function BalanceTab() {
  const tr = useT();
  const { lang } = useSession();
  const { me, lvs } = useData();
  const [filter, setFilter] = useState('__all__');
  const year = leaveYearOf(new Date());
  const mine = lvs.filter((l) => l.empId === me.id);
  const pending = mine.filter((l) => l.status === 'pending');
  const history = mine.filter((l) => filter === '__all__' || l.type === filter);
  const usedTypes = [...new Set(mine.map((l) => l.type))];
  const edit = (l: Leave) => router.push({ pathname: '/request/new', params: { id: l.id } });
  const card = (l: Leave) => <LeaveCard key={l.id} l={l} mode="mine" onEdit={edit} />;

  return (
    <HeroScreen designHeight={196} hero={<HeroTitle title={tr('ماوە', 'Balance', 'الرصيد')} over={me.fullName} />}>
      <View style={{ gap: 20 }}>
        <BalanceRings person={me} />

        <View>
          <View style={styles.px}>
            <SectionTitle sub={tr('تەنها بۆ بینینە — گۆڕانکاری لەلایەن HR ـەوە دەکرێت.', 'View only — changes are made by HR.', 'للعرض فقط — التغييرات تتم من قبل الموارد البشرية.')}>
              {tr('ماوەی مۆڵەتەکانم ' + year, 'My leave balances ' + year, 'أرصدة إجازاتي ' + year)}
            </SectionTitle>
          </View>
          <BalanceTable person={me} />
        </View>

        <View style={[styles.px, { gap: 10 }]}>
          <SectionTitle>{tr('داواکاری چاوەڕوان', 'Pending requests', 'الطلبات المعلقة')}</SectionTitle>
          {pending.length === 0 ? <Empty text={tr('هیچ داواکارییەکی چاوەڕوان نییە.', 'No pending requests.', 'لا توجد طلبات معلقة.')} /> : null}
          {pending.map(card)}
        </View>

        <View style={{ gap: 10 }}>
          <View style={styles.px}>
            <SectionTitle>{tr('مێژوو', 'History', 'السجل')}</SectionTitle>
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            <ChipRow
              value={filter}
              onChange={setFilter}
              items={[{ id: '__all__', label: tr('هەموو', 'All', 'الكل') }, ...usedTypes.map((c) => ({ id: c, label: leaveTypeLabel(c, lang), color: leaveTypeColor(c) }))]}
            />
          </View>
          <View style={styles.px}>
            <LeaveArchive items={history} render={card} emptyText={tr('هیچ داواکارییەک نییە.', 'No requests yet.', 'لا توجد طلبات بعد.')} />
          </View>
        </View>

        <View style={styles.px}>
          <PrimaryButton icon="add" label={tr('داواکاری مۆڵەت', 'Request day off', 'طلب إجازة')} onPress={() => router.push('/request/new')} />
        </View>
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
});

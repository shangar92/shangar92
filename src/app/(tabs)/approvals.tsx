// Approvals: requests waiting on you, and what you have already decided.
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { Empty, LeaveArchive, LeaveCard, SectionTitle } from '../../components/leave';
import { Card } from '../../components/ui';
import type { Leave } from '../../lib/types';
import { useData } from '../../state/data';
import { useT } from '../../state/session';

export default function ApprovalsTab() {
  const tr = useT();
  const { inbox, decided } = useData();
  const openPerson = (id: string) => router.push({ pathname: '/person/[id]', params: { id } });
  const card = (l: Leave) => <LeaveCard key={l.id} l={l} mode="approver" onOpenPerson={openPerson} />;

  return (
    <HeroScreen designHeight={196} viewY={240} hero={<HeroTitle title={tr('ئەپروڤ', 'Approvals', 'الموافقات')} />}>
      <View style={[styles.px, { gap: 10 }]}>
        <Card raised style={{ padding: 16 }}>
          <SectionTitle
            sub={tr(
              'ئەم داواکارییانە چاوەڕوانی واژووی تۆن. دوای ئەپروڤکردن، ئەگەر ئەپروڤەری دیکەی پێویست بێت، خۆکارانە دەنێردرێت بۆیان.',
              'These are waiting on you. Once you approve, anything that needs a further signature is passed on automatically.',
              'هذه الطلبات بانتظارك. بعد موافقتك، يُرسل ما يحتاج توقيعًا آخر تلقائيًا.',
            )}
          >
            {tr('داواکارییەکان بۆ ئەپروڤکردن', 'Requests for your approval', 'طلبات بانتظار موافقتك')}
          </SectionTitle>
        </Card>
        {inbox.length === 0 ? <Empty text={tr('هیچ داواکارییەک چاوەڕوانی تۆ نییە.', 'Nothing is waiting on you.', 'لا يوجد ما ينتظرك.')} /> : null}
        {inbox.map(card)}

        {decided.length > 0 ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            <SectionTitle sub={tr('ئەو داواکارییانەی واژووت کردوون یان ڕەتت کردوونەتەوە.', 'Requests you have signed or refused.', 'الطلبات التي وقعتها أو رفضتها.')}>
              {tr('بڕیارەکانی پێشووت', 'Decided by you', 'قراراتك السابقة')}
            </SectionTitle>
            <LeaveArchive items={decided} render={card} />
          </View>
        ) : null}
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
});

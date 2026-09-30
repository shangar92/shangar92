// Watching: leave in the units you watch (set on the website's Teams page). View only.
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { LeaveArchive, LeaveCard, SectionTitle } from '../../components/leave';
import { Card } from '../../components/ui';
import type { Leave } from '../../lib/types';
import { useData } from '../../state/data';
import { useT } from '../../state/session';

export default function WatchingTab() {
  const tr = useT();
  const { watching } = useData();
  const openPerson = (id: string) => router.push({ pathname: '/person/[id]', params: { id } });
  return (
    <HeroScreen designHeight={196} viewY={240} hero={<HeroTitle title={tr('چاودێری', 'Watching', 'المتابعة')} />}>
      <View style={[styles.px, { gap: 10 }]}>
        <Card raised style={{ padding: 16 }}>
          <SectionTitle sub={tr('تەنها بۆ بینینە — کێ داوای کردووە و کێ پەسەندکراوە.', 'View only — who has asked and who has been approved.', 'للعرض فقط — من طلب ومن تمت الموافقة عليه.')}>
            {tr('مۆڵەتەکانی ئەو بەشانەی چاودێریان دەکەیت', 'Leave in the units you watch', 'الإجازات في الأقسام التي تتابعها')}
          </SectionTitle>
        </Card>
        <LeaveArchive
          items={watching}
          render={(l: Leave) => <LeaveCard key={l.id} l={l} mode="view" onOpenPerson={openPerson} />}
          emptyText={tr('هیچ داواکارییەک نییە.', 'No requests.', 'لا توجد طلبات.')}
        />
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
});

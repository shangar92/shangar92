// Notifications: decisions, changes and approval requests sent to you, plus
// announcements addressed to you or your unit.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { APP_NAME } from '../../components/auth';
import { Empty } from '../../components/leave';
import { PersonAvatar } from '../../components/PersonAvatar';
import { Card, IconBox, Txt } from '../../components/ui';
import { dmy, isoLocal } from '../../lib/dates';
import { leaveTypeLabel, unitSubtree } from '../../lib/rules';
import type { Person } from '../../lib/types';
import { useData } from '../../state/data';
import { useSession, useT } from '../../state/session';
import { useTheme } from '../../theme';

type Item = { id: string; date: string; ts: number; text: string; unread?: boolean; ann?: boolean; by?: Person };

export default function NotificationsTab() {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const { me, lvs, emps, anns, depts, myNotifs, markNotifsSeen } = useData();

  // Opening the tab marks your notices as read.
  useEffect(() => {
    if (myNotifs.some((n) => !n.read)) markNotifsSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: Item[] = [];
  myNotifs.forEach((n) => {
    if (n.target === 'announcements') return;
    items.push({
      id: n.id,
      date: n.date || (n.ts ? isoLocal(new Date(n.ts)) : ''),
      ts: n.ts || 0,
      unread: !n.read,
      text: lang === 'en' ? n.text || n.textKu || '' : n.textKu || n.text || '',
    });
  });
  // With no notices yet, show the decisions on your own requests instead.
  if (!items.length) {
    lvs
      .filter((l) => l.empId === me.id && l.status !== 'pending')
      .forEach((l) => {
        const by = emps.find((e) => e.id === l.approverId);
        const ok = l.status === 'approved';
        items.push({
          id: l.id,
          date: l.decidedAt || l.from,
          ts: 0,
          by,
          text: tr(
            'داواکاری ' + leaveTypeLabel(l.type, lang) + 'ی تۆ لە ' + l.from + ' بۆ ' + l.to + ' ' + (ok ? 'پەسەندکرا' : 'ڕەتکرایەوە') + (by ? ' لەلایەن ' + by.fullName : ''),
            'Your ' + leaveTypeLabel(l.type, 'en') + ' request from ' + l.from + ' to ' + l.to + ' has been ' + (ok ? 'accepted' : 'rejected') + (by ? ' by ' + by.fullName : ''),
            'طلب ' + leaveTypeLabel(l.type, 'ar') + ' من ' + l.from + ' إلى ' + l.to + (ok ? ' تمت الموافقة عليه' : ' تم رفضه') + (by ? ' من قبل ' + by.fullName : ''),
          ),
        });
      });
  }
  // Announcements for everyone, for your unit, or for you.
  anns.forEach((a) => {
    if (Array.isArray(a.people) && a.people.length && !a.people.includes(me.id)) return;
    if (a.depts && Array.isArray(a.depts) && !a.depts.some((u) => unitSubtree(depts, u).includes(String(me.dept)))) return;
    items.push({ id: a.id, date: a.date, ts: 0, text: a.text || '', ann: true });
  });
  items.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || b.ts - a.ts);

  return (
    <HeroScreen designHeight={196} hero={<HeroTitle title={tr('ئاگادارییەکان', 'Notifications', 'الإشعارات')} />}>
      <View style={[styles.px, { gap: 10 }]}>
        {items.length === 0 ? (
          <Card raised style={{ padding: 8 }}>
            <Empty text={tr('هیچ ئاگادارییەک نییە.', 'Nothing yet.', 'لا شيء بعد.')} />
          </Card>
        ) : null}
        {items.map((n, i) => (
          <Card
            key={n.id + i}
            raised={i === 0}
            style={[styles.item, n.unread && { borderColor: t.petrol, backgroundColor: t.petrolSoft }]}
          >
            {n.ann ? (
              <View style={[styles.brand, { backgroundColor: t.petrol }]}>
                <Txt size={11} weight="800" color="#FFFFFF">
                  KDF
                </Txt>
              </View>
            ) : n.by ? (
              <PersonAvatar person={n.by} size={38} />
            ) : (
              <IconBox icon="notifications-outline" bg={t.petrolSoft} fg={t.petrol} size={38} iconSize={19} />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              {n.ann ? (
                <Txt size={11} weight="800" color="petrol">
                  {APP_NAME}
                </Txt>
              ) : null}
              <Txt size={13}>{n.text}</Txt>
              <Txt size={11} color="faint">
                {dmy(n.date)}
              </Txt>
            </View>
            {n.unread ? <View style={[styles.unread, { backgroundColor: t.amber }]} /> : null}
          </Card>
        ))}
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13 },
  brand: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});

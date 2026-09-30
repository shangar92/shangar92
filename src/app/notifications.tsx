import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '../components/HeroScreen';
import { Card, Glass, GlassIcon, IconBox, Label, Txt } from '../components/ui';
import type { Notice } from '../data';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { goBack } from '../navigation';

type Filter = 'all' | 'approval' | 'hr';

export default function NotificationsScreen() {
  const { t } = useTheme();
  const { notices, markAllRead, dismissNotice } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const tones: Record<Notice['tone'], { fg: string; bg: string }> = {
    green: { fg: t.green, bg: t.greenSoft },
    amber: { fg: t.amber, bg: t.amberSoft },
    petrol: { fg: t.petrol, bg: t.petrolSoft },
    red: { fg: t.red, bg: t.redSoft },
  };
  const approvals = notices.filter((n) => n.kind === 'approval').length;
  const visible = notices.filter((n) => filter === 'all' || n.kind === filter);
  const groups = (['Today', 'Yesterday'] as const)
    .map((day) => ({ day, items: visible.filter((n) => n.day === day) }))
    .filter((g) => g.items.length);

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'approval', label: approvals ? `Approvals · ${approvals}` : 'Approvals' },
    { key: 'hr', label: 'HR' },
  ];

  return (
    <HeroScreen
      designHeight={196}
      viewY={240}
      withTabBar={false}
      hero={
        <View style={[styles.between, { marginTop: 8 }]}>
          <View style={[styles.row, { gap: 12 }]}>
            <GlassIcon icon="chevron-back" onPress={() => goBack()} />
            <Txt size={24} weight="700" color="#FFFFFF" style={{ letterSpacing: -0.5 }}>
              Notifications
            </Txt>
          </View>
          <Glass onPress={markAllRead}>
            <Txt size={13} weight="600" color="#FFFFFF">
              Mark all read
            </Txt>
          </Glass>
        </View>
      }
    >
      <View style={styles.px}>
        <Card raised style={[styles.row, { padding: 6, gap: 4, borderRadius: 18 }]}>
          {tabs.map((tab) => {
            const on = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[styles.tab, on && { backgroundColor: t.acc }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Txt size={13} weight="600" color={on ? t.btnInk : t.muted}>
                  {tab.label}
                </Txt>
              </Pressable>
            );
          })}
        </Card>
      </View>

      {groups.map((g) => (
        <View key={g.day}>
          <Label style={{ marginTop: 16, paddingHorizontal: 20 }}>{g.day}</Label>
          <View style={[styles.px, { gap: 10, marginTop: 8 }]}>
            {g.items.map((n) => (
              <Card key={n.id} style={styles.item}>
                <IconBox icon={n.icon} bg={tones[n.tone].bg} fg={tones[n.tone].fg} />
                <View style={{ flex: 1 }}>
                  <View style={styles.between}>
                    <Txt weight="700" style={{ flex: 1 }}>
                      {n.title}
                    </Txt>
                    {n.unread ? <View style={[styles.unread, { backgroundColor: t.amber }]} /> : null}
                  </View>
                  <Txt size={13} color="muted" style={{ marginTop: 2, lineHeight: 19 }}>
                    {n.body}
                  </Txt>
                  {n.action === 'correction' ? (
                    <View style={[styles.row, { gap: 8, marginTop: 10 }]}>
                      <Pressable
                        onPress={() => {
                          dismissNotice(n.id);
                          router.push({ pathname: '/request/new', params: { type: 'fingerprint' } });
                        }}
                        style={[styles.action, { backgroundColor: t.acc }]}
                      >
                        <Txt size={13} weight="600" color={t.btnInk}>
                          Submit correction
                        </Txt>
                      </Pressable>
                      <Pressable onPress={() => dismissNotice(n.id)} style={[styles.action, { borderWidth: 1, borderColor: t.line }]}>
                        <Txt size={13} weight="600">
                          Later
                        </Txt>
                      </Pressable>
                    </View>
                  ) : (
                    <Txt size={12} color="faint" style={{ marginTop: 6 }}>
                      {n.time}
                    </Txt>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>
      ))}
      {groups.length === 0 ? (
        <Txt color="muted" style={{ textAlign: 'center', marginTop: 32 }}>
          You’re all caught up.
        </Txt>
      ) : null}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 13 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  unread: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  action: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
});

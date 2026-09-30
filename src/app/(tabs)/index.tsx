import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BalanceRing } from '../../components/BalanceRing';
import { HeroScreen } from '../../components/HeroScreen';
import { RequestCard } from '../../components/RequestCard';
import { Avatar, Card, Glass, GlassIcon, Txt } from '../../components/ui';
import { leaveTypeById, LeaveTypeId, me, remainingDays } from '../../data';
import { useStore } from '../../store';
import { mix, useTheme } from '../../theme';

const rings: { type: LeaveTypeId; from: 'r1a' | 'r2a' | 'r3a'; to: 'r1b' | 'r2b' | 'r3b' }[] = [
  { type: 'annual', from: 'r1a', to: 'r1b' },
  { type: 'unpaid', from: 'r2a', to: 'r2b' },
  { type: 'fingerprint', from: 'r3a', to: 'r3b' },
];

export default function HomeScreen() {
  const { t } = useTheme();
  const { requests, notices } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const unread = notices.some((n) => n.unread);
  const list = requests.filter((r) => filter === 'all' || r.status === 'pending').slice(0, 5);

  return (
    <HeroScreen
      designHeight={230}
      viewY={200}
      lift={30}
      fade
      hero={
        <>
          <View style={styles.between}>
            <View style={[styles.row, { gap: 12 }]}>
              <Avatar initials={me.initials} color={mix(t.btn1, t.petrol, 0.5)} size={46} square />
              <View>
                <Txt size={13} color="#D8DDE8">
                  Welcome back
                </Txt>
                <Txt size={20} weight="700" color="#FFFFFF">
                  {me.name}
                </Txt>
              </View>
            </View>
            <GlassIcon icon="notifications-outline" dot={unread ? t.acc : undefined} onPress={() => router.push('/notifications')} />
          </View>
          <View style={[styles.row, { gap: 8, marginTop: 18, flexWrap: 'wrap' }]}>
            <Glass>
              <Txt size={12} weight="600" color="#FFFFFF">
                {me.company} · {me.unit}
              </Txt>
            </Glass>
            <Glass>
              <Txt size={12} weight="600" color="#FFFFFF">
                ● On site · day {me.rotation.day}/{me.rotation.length}
              </Txt>
            </Glass>
          </View>
        </>
      }
    >
      <View style={styles.px}>
        <Card raised style={{ paddingTop: 18, paddingBottom: 16, paddingHorizontal: 10, borderRadius: 26 }}>
          <View style={[styles.between, { paddingHorizontal: 10 }]}>
            <Txt size={16} weight="700">
              Balances {new Date().getFullYear()}
            </Txt>
            <Pressable onPress={() => router.push('/request/new')} hitSlop={8}>
              <Txt size={13} weight="600" color="petrol">
                Request ›
              </Txt>
            </Pressable>
          </View>
          <View style={[styles.row, { marginTop: 16 }]}>
            {rings.map((ring) => {
              const type = leaveTypeById[ring.type];
              return (
                <View key={ring.type} style={{ flex: 1, alignItems: 'center' }}>
                  <BalanceRing
                    id={ring.type}
                    left={remainingDays(requests, ring.type)}
                    total={type.total}
                    from={t[ring.from]}
                    to={t[ring.to]}
                  />
                  <Txt size={14} weight="700" color={t[ring.from]} kurdish style={{ marginTop: 8 }}>
                    {type.label}
                  </Txt>
                  <Txt size={11} color="faint">
                    {type.short}
                  </Txt>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      <View style={[styles.px, styles.between, { marginTop: 20 }]}>
        <Txt size={17} weight="700">
          Recent
        </Txt>
        <View style={[styles.row, { gap: 6 }]}>
          {(['all', 'pending'] as const).map((f) => {
            const on = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.chip,
                  on ? { backgroundColor: t.acc } : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line },
                ]}
              >
                <Txt size={12} weight="600" color={on ? t.btnInk : t.muted}>
                  {f === 'all' ? 'All' : 'Pending'}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.px, { gap: 10, marginTop: 10 }]}>
        {list.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
        {list.length === 0 ? (
          <Txt color="muted" style={{ textAlign: 'center', paddingVertical: 24 }}>
            Nothing waiting for approval.
          </Txt>
        ) : null}
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { HeroScreen } from '../../components/HeroScreen';
import { Avatar, Card, GhostButton, GlassIcon, Pill, PrimaryButton, Txt, useStatusColors } from '../../components/ui';
import {
  approvalSteps,
  formatDays,
  formatRange,
  leaveTypeById,
  me,
  personById,
  requestDays,
  statusLabel,
  TimeOffRequest,
} from '../../data';
import { useStore } from '../../store';
import { useTheme } from '../../theme';
import { goBack } from '../../navigation';

type StepState = 'done' | 'current' | 'failed' | 'todo';

function stepStates(r: TimeOffRequest): StepState[] {
  return approvalSteps.map((_, i) => {
    if (r.status === 'approved' || i < r.stage) return 'done';
    if (i === r.stage) return r.status === 'declined' ? 'failed' : 'current';
    return 'todo';
  });
}

export default function RequestDetailScreen() {
  const { t } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, withdraw } = useStore();
  const statusColors = useStatusColors();
  const request = requests.find((r) => r.id === id);
  const [confirming, setConfirming] = useState(false);

  if (!request) {
    return (
      <View style={[styles.empty, { backgroundColor: t.bg }]}>
        <Txt size={16} weight="700">
          This request is no longer here.
        </Txt>
        <GhostButton label="Go back" onPress={() => goBack()} style={{ paddingHorizontal: 24, marginTop: 16 }} />
      </View>
    );
  }

  const type = leaveTypeById[request.type];
  const status = statusColors[request.status];
  const states = stepStates(request);
  const doneCount = states.filter((s) => s === 'done').length;
  const handover = request.handover ? personById[request.handover] : undefined;

  const stepText = (i: number): { title: string; sub: string } => {
    const s = states[i];
    switch (i) {
      case 0:
        return { title: 'Submitted', sub: `by you · ${request.submittedAt}` };
      case 1:
        return s === 'done'
          ? { title: 'Line manager approved', sub: me.manager }
          : s === 'failed'
            ? { title: 'Line manager declined', sub: me.manager }
            : { title: 'Line manager', sub: `Waiting for ${me.manager}` };
      case 2:
        return s === 'done'
          ? { title: 'HR approved', sub: 'Human Resources' }
          : s === 'failed'
            ? { title: 'HR declined', sub: 'Human Resources' }
            : { title: 'HR review', sub: 'Usually within 1 working day' };
      default:
        return { title: 'Confirmed', sub: 'Added to payroll & calendar' };
    }
  };

  const canChange = request.status === 'pending';

  return (
    <HeroScreen
      designHeight={230}
      viewY={175}
      withTabBar={false}
      hero={
        <>
          <View style={[styles.between, { marginTop: 6 }]}>
            <GlassIcon icon="chevron-back" onPress={() => goBack()} />
          </View>
          <Txt size={13} color="#E4E7EF" style={{ marginTop: 12 }}>
            {request.code} · {type.english} leave
          </Txt>
          <Txt size={26} weight="700" color="#FFFFFF" style={{ letterSpacing: -0.5, marginTop: 2 }}>
            {formatDays(requestDays(request))} · {formatRange(request.from, request.to, false)}
          </Txt>
        </>
      }
      footer={
        canChange && confirming ? (
          <>
            <GhostButton label="Keep it" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
            <GhostButton
              label="Yes, withdraw"
              color={t.red}
              onPress={() => {
                withdraw(request.id);
                goBack();
              }}
              style={{ flex: 1.4, backgroundColor: t.redSoft, borderColor: t.red }}
            />
          </>
        ) : canChange ? (
          <>
            <GhostButton label="Withdraw" color={t.red} onPress={() => setConfirming(true)} style={{ flex: 1 }} />
            <PrimaryButton
              label="Edit request"
              onPress={() => router.push({ pathname: '/request/new', params: { id: request.id } })}
              style={{ flex: 1.4 }}
            />
          </>
        ) : undefined
      }
    >
      <View style={styles.px}>
        <Card raised style={{ padding: 16 }}>
          <View style={styles.between}>
            <Pill label={request.status === 'pending' ? 'In review' : statusLabel(request)} fg={status.fg} bg={status.bg} />
            <Txt size={12} color="faint">
              {request.status === 'approved' ? 'All steps done' : `Step ${Math.min(doneCount + 1, 4)} of 4`}
            </Txt>
          </View>
          <View style={[styles.row, { gap: 4, marginTop: 12 }]}>
            {states.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.progress,
                  { backgroundColor: s === 'done' ? t.green : s === 'current' ? t.amber : s === 'failed' ? t.red : t.line },
                ]}
              />
            ))}
          </View>

          <View style={{ marginTop: 18 }}>
            {approvalSteps.map((_, i) => {
              const s = states[i];
              const { title, sub } = stepText(i);
              const last = i === approvalSteps.length - 1;
              const dot =
                s === 'done'
                  ? { bg: t.green, fg: '#FFFFFF', border: t.green, icon: 'checkmark' as const }
                  : s === 'current'
                    ? { bg: t.amberSoft, fg: t.amber, border: t.amber, icon: 'time-outline' as const }
                    : s === 'failed'
                      ? { bg: t.redSoft, fg: t.red, border: t.red, icon: 'close' as const }
                      : { bg: t.bg, fg: t.faint, border: t.line, icon: 'shield-checkmark-outline' as const };
              return (
                <View key={i} style={[styles.step, !last && { paddingBottom: 22 }]}>
                  {!last ? <View style={[styles.connector, { backgroundColor: s === 'done' ? t.green : t.line }]} /> : null}
                  <View style={[styles.dot, { backgroundColor: dot.bg, borderColor: dot.border }]}>
                    <Ionicons name={dot.icon} size={16} color={dot.fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="700" color={s === 'todo' ? 'faint' : 'text'}>
                      {title}
                    </Txt>
                    <Txt size={13} color={s === 'todo' ? 'faint' : 'muted'}>
                      {sub}
                    </Txt>
                    {i === 1 && s === 'done' && request.managerNote ? (
                      <View style={[styles.quote, { backgroundColor: t.bg }]}>
                        <Txt size={13} color="muted">
                          “{request.managerNote}”
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      {handover ? (
        <View style={[styles.px, { marginTop: 12 }]}>
          <Card style={[styles.row, { gap: 12, paddingVertical: 14, paddingHorizontal: 16 }]}>
            <Avatar initials={handover.initials} color={t.petrol} size={40} />
            <View style={{ flex: 1 }}>
              <Txt size={12} color="muted">
                Work handover to
              </Txt>
              <Txt weight="700">{handover.name}</Txt>
            </View>
            <Ionicons name="swap-horizontal" size={20} color={t.petrol} />
          </Card>
        </View>
      ) : null}

      {request.note ? (
        <View style={[styles.px, { marginTop: 12 }]}>
          <Card style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
            <Txt size={12} color="muted">
              Your note
            </Txt>
            <Txt style={{ marginTop: 2 }}>{request.note}</Txt>
          </Card>
        </View>
      ) : null}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { flex: 1, height: 5, borderRadius: 3 },
  step: { flexDirection: 'row', gap: 14 },
  connector: { position: 'absolute', left: 15, top: 34, bottom: 2, width: 2 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  quote: { marginTop: 6, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

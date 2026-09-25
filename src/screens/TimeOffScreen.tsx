import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatRange, leaveTypeById, leaveTypes, RequestStatus, TimeOffRequest } from '../data';
import { colors, gradients, radius } from '../theme';
import { BalanceCard } from '../components/BalanceCard';
import { FilterChips } from '../components/FilterChips';
import { RequestCard } from '../components/RequestCard';
import { SegmentedControl } from '../components/SegmentedControl';

type Props = {
  requests: TimeOffRequest[];
  topInset: number;
  bottomInset: number;
  onEdit: (r: TimeOffRequest) => void;
  onDelete: (r: TimeOffRequest) => void;
};

type Segment = 'requests' | 'balance';

export function TimeOffScreen({ requests, topInset, bottomInset, onEdit, onDelete }: Props) {
  const [segment, setSegment] = useState<Segment>('balance');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const pending = requests.filter((r) => r.status === 'pending');
  const history = useMemo(
    () => requests.filter((r) => r.status !== 'pending' && (typeFilter === 'all' || r.type === typeFilter)),
    [requests, typeFilter],
  );
  const byStatus = useMemo(
    () => requests.filter((r) => statusFilter === 'all' || r.status === statusFilter),
    [requests, statusFilter],
  );

  const annual = leaveTypeById.annual;
  const annualLeft = (annual.total ?? 0) - annual.used;
  const nextLeave = [...requests]
    .filter((r) => r.status !== 'rejected')
    .sort((a, b) => b.from.localeCompare(a.from))[0];

  const renderList = (list: TimeOffRequest[]) =>
    list.map((r) => (
      <RequestCard
        key={r.id}
        request={r}
        onEdit={r.status !== 'rejected' ? () => onEdit(r) : undefined}
        onDelete={() => onDelete(r)}
      />
    ));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SH</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Good morning 👋</Text>
          <Text style={styles.name}>Time off</Text>
        </View>
        <View style={styles.headerBtn}>
          <Ionicons name="search" size={20} color={colors.text} />
        </View>
      </View>

      <View style={styles.px}>
        <SegmentedControl<Segment>
          options={[
            { value: 'requests', label: 'Requests' },
            { value: 'balance', label: 'Balance' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {segment === 'balance' ? (
        <>
          {/* Hero */}
          <View style={styles.px}>
            <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroBlobA} />
              <View style={styles.heroBlobB} />
              <Text style={styles.heroLabel}>Annual leave available</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroValue}>{annualLeft}</Text>
                <Text style={styles.heroUnit}>/ {annual.total} days</Text>
              </View>
              <View style={styles.heroBar}>
                <View style={[styles.heroBarFill, { width: `${(annual.used / (annual.total ?? 1)) * 100}%` }]} />
              </View>
              {nextLeave && (
                <View style={styles.heroFooter}>
                  <Ionicons name="airplane" size={14} color="#fff" />
                  <Text style={styles.heroFooterText}>
                    Last leave · {formatRange(nextLeave.from, nextLeave.to)}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Balance cards */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your balances</Text>
            <Text style={styles.sectionLink}>2026</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
            decelerationRate="fast"
            snapToInterval={170}
          >
            {leaveTypes.map((t) => (
              <BalanceCard key={t.id} type={t} />
            ))}
          </ScrollView>

          {/* Pending */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending requests</Text>
            {pending.length > 0 && (
              <View style={styles.count}>
                <Text style={styles.countText}>{pending.length}</Text>
              </View>
            )}
          </View>
          <View style={[styles.px, styles.list]}>
            {pending.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="checkmark-done" size={22} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTitle}>You're all caught up</Text>
                  <Text style={styles.emptySub}>No pending vacation requests</Text>
                </View>
              </View>
            ) : (
              renderList(pending)
            )}
          </View>

          {/* History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <Text style={styles.sectionLink}>{history.length} items</Text>
          </View>
          <FilterChips
            options={[{ value: 'all', label: 'All' }, ...leaveTypes.map((t) => ({ value: t.id, label: t.label }))]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <View style={[styles.px, styles.list, { marginTop: 14 }]}>
            {history.length === 0 ? <Text style={styles.none}>Nothing here yet</Text> : renderList(history)}
          </View>
        </>
      ) : (
        <>
          <View style={{ marginTop: 20 }}>
            <FilterChips
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Approved' },
                { value: 'rejected', label: 'Declined' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as RequestStatus | 'all')}
            />
          </View>
          <View style={[styles.px, styles.list, { marginTop: 14 }]}>
            {byStatus.length === 0 ? <Text style={styles.none}>No requests</Text> : renderList(byStatus)}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 18 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  hello: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: { marginTop: 18, borderRadius: radius.xl, padding: 22, overflow: 'hidden' },
  heroBlobA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -60,
    right: -40,
  },
  heroBlobB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -50,
    right: 70,
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  heroValue: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -2 },
  heroUnit: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '600' },
  heroBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 12, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  heroFooterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionLink: { fontSize: 14, fontWeight: '600', color: colors.textFaint },
  cardsRow: { gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  list: { gap: 12 },
  count: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  none: { textAlign: 'center', color: colors.textFaint, paddingVertical: 24 },
});

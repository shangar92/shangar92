// A person's leave balances for the current leave year, as the website shows
// them: a ring per leave type, and the table behind the numbers (base,
// carried, available now, used, remaining).

import { ScrollView, StyleSheet, View } from 'react-native';
import { round1 } from '../lib/dates';
import { TL } from '../lib/i18n';
import { allLeaveTypes, balanceFor, fmtBal, HOURLY_CODE, leaveYearOf, typeAllowedFor } from '../lib/rules';
import type { Person } from '../lib/types';
import { useData } from '../state/data';
import { useSession, useT } from '../state/session';
import { mix, useTheme } from '../theme';
import { BalanceRing } from './BalanceRing';
import { Card, Txt } from './ui';

export function useBalances(person: Person) {
  const { lvs, leavePolicies } = useData();
  const year = leaveYearOf(new Date());
  const rows = allLeaveTypes()
    .map((t) => ({ t, b: balanceFor(person, t.code, lvs, leavePolicies, year, new Date()) }))
    .filter((r) => typeAllowedFor(person, r.t.code) || r.b.used > 0);
  return { year, rows };
}

export function BalanceRings({ person }: { person: Person }) {
  const { lang } = useSession();
  const tr = useT();
  const { rows } = useBalances(person);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 4 }}>
      {rows.map(({ t, b }) => {
        const total = b.entitlement == null ? 0 : b.entitlement;
        const isH = t.code === HOURLY_CODE;
        return (
          <Card key={t.code} style={styles.ringCard}>
            <BalanceRing
              id={'r-' + t.code}
              ratio={total > 0 ? b.used / total : 0}
              value={isH ? String(round1(b.hours || 0)) : fmtBal(b.used, b)}
              of={isH ? ' ' + tr('کاتژمێر', 'h', 'س') : '/' + fmtBal(b.entitlement, b)}
              from={t.color}
              to={mix(t.color, '#FFFFFF', 0.35)}
            />
            <Txt size={12} weight="800" color={t.color} numberOfLines={2} style={{ textAlign: 'center', marginTop: 6 }}>
              {TL(lang, t)}
            </Txt>
            {!isH && b.available != null ? (
              <Txt size={11} color="muted" style={{ textAlign: 'center' }}>
                {tr('بەردەست: ', 'available: ', 'المتاح: ') + fmtBal(b.available, b)}
              </Txt>
            ) : null}
          </Card>
        );
      })}
    </ScrollView>
  );
}

export function BalanceTable({ person }: { person: Person }) {
  const { t } = useTheme();
  const { lang } = useSession();
  const tr = useT();
  const { rows } = useBalances(person);
  const head = [
    tr('جۆر', 'Type', 'النوع'),
    tr('بنەڕەت', 'Base', 'الأساس'),
    tr('گواستراوە', 'Carried', 'المرحّل'),
    tr('بەردەست ئێستا', 'Available now', 'المتاح الآن'),
    tr('بەکارهاتوو', 'Used', 'المستخدم'),
    tr('ماوە', 'Remaining', 'المتبقي'),
  ];
  const W = [150, 64, 70, 88, 76, 76];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.table, { borderColor: t.line, backgroundColor: t.surface }]}>
        <View style={[styles.tr, { backgroundColor: t.navy }]}>
          {head.map((h, i) => (
            <View key={i} style={[styles.td, { width: W[i] }]}>
              <Txt size={11.5} weight="700" color="#FFFFFF" style={{ textAlign: i ? 'center' : undefined }}>
                {h}
              </Txt>
            </View>
          ))}
        </View>
        {rows.map(({ t: lt, b }, r) => {
          const isH = lt.code === HOURLY_CODE;
          const cells = [
            isH ? '—' : fmtBal(b.base, b),
            b.carryIn ? '+' + fmtBal(b.carryIn, b) : '—',
            isH ? '—' : fmtBal(b.available, b),
            isH ? round1(b.hours || 0) + ' ' + tr('کاتژمێر', 'h', 'س') : fmtBal(b.used || 0, b),
            isH ? '—' : b.remaining != null ? fmtBal(b.remaining, b) : fmtBal(b.available, b),
          ];
          return (
            <View key={lt.code} style={[styles.tr, r % 2 ? { backgroundColor: t.field } : null, { borderTopWidth: 1, borderTopColor: t.line }]}>
              <View style={[styles.td, styles.typeCell, { width: W[0] }]}>
                <View style={[styles.swatch, { backgroundColor: lt.color }]} />
                <Txt size={12} weight="700" numberOfLines={2} style={{ flexShrink: 1 }}>
                  {TL(lang, lt)}
                </Txt>
              </View>
              {cells.map((c, i) => (
                <View key={i} style={[styles.td, { width: W[i + 1] }]}>
                  <Txt size={12.5} weight={i === 2 || i === 4 ? '800' : '500'} color={i === 2 ? '#16A34A' : 'text'} style={{ textAlign: 'center', writingDirection: 'ltr' }}>
                    {c}
                  </Txt>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ringCard: { width: 132, padding: 12, alignItems: 'center' },
  table: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginHorizontal: 20 },
  tr: { flexDirection: 'row', alignItems: 'center' },
  td: { paddingHorizontal: 8, paddingVertical: 9, justifyContent: 'center' },
  typeCell: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  swatch: { width: 9, height: 9, borderRadius: 3 },
});

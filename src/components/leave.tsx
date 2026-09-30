// Leave request cards and lists, following the website's employee app: a card
// shows the type, dates and status, and opens to show the approval progress,
// documents and what can be done with the request.

import { ReactNode, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dmy, parseLocalDate, round1 } from '../lib/dates';
import { fetchLeaveDoc, openPdf } from '../lib/files';
import { isRtl, monthLabel } from '../lib/i18n';
import {
  balanceFor,
  fmtBal,
  HOURLY_CODE,
  leaveDaysCharged,
  leaveTypeColor,
  leaveTypeLabel,
  leaveTypeTextColor,
  leaveYearOf,
  policyFor,
  stageLabel,
} from '../lib/rules';
import type { Leave, LeaveDoc } from '../lib/types';
import { useData } from '../state/data';
import { useSession, useT } from '../state/session';
import { useTheme } from '../theme';
import { PersonAvatar } from './PersonAvatar';
import { Card, Txt } from './ui';

export const PENDING_C = '#D4A006';
const OK = '#16A34A';
const BAD = '#DC2626';

export function statusOf(l: Leave, tr: ReturnType<typeof useT>) {
  if (l.status === 'approved') return { label: tr('پەسەندکرا', 'Accepted', 'مقبول'), color: OK };
  if (l.status === 'rejected') return { label: tr('ڕەتکرایەوە', 'Rejected', 'مرفوض'), color: BAD };
  return { label: tr('چاوەڕوان', 'Pending', 'قيد الانتظار'), color: PENDING_C };
}

export function Empty({ text }: { text: string }) {
  return (
    <Txt color="muted" style={{ textAlign: 'center', paddingVertical: 22 }}>
      {text}
    </Txt>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 2, marginBottom: 10 }}>
      <Txt size={16} weight="700">
        {children}
      </Txt>
      {sub ? (
        <Txt size={12} color="muted">
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

function Tag({ text, color, soft }: { text: string; color: string; soft?: boolean }) {
  return (
    <View style={[styles.tag, { backgroundColor: soft ? color + '22' : color }]}>
      <Txt size={11.5} weight="700" color={soft ? color : leaveTypeTextColor('', true)} style={{ textAlign: 'center' }}>
        {text}
      </Txt>
    </View>
  );
}

function SmallButton({ icon, label, onPress, tone }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; tone?: 'danger' | 'ok' }) {
  const { t } = useTheme();
  const color = tone === 'danger' ? BAD : tone === 'ok' ? '#FFFFFF' : t.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.smallBtn,
        tone === 'ok' ? { backgroundColor: OK, borderColor: OK } : { borderColor: tone === 'danger' ? BAD + '66' : t.line },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Txt size={12.5} weight="700" color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Opens a request's document: images inside the app, PDFs in the phone's viewer. */
export function DocButton({ doc }: { doc: LeaveDoc }) {
  const tr = useT();
  const { t } = useTheme();
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [err, setErr] = useState('');
  async function open() {
    setBusy(true);
    setErr('');
    try {
      const data = await fetchLeaveDoc(doc);
      if (!data) setErr(tr('بەڵگەنامەکە نەدۆزرایەوە', 'The document could not be found', 'لم يتم العثور على المستند'));
      else if (data.dataUrl.startsWith('data:application/pdf')) await openPdf(data.name, data.dataUrl);
      else setImage(data.dataUrl);
    } catch (e) {
      console.error(e);
      setErr(tr('نەکرایەوە', "Couldn't open it", 'تعذر الفتح'));
    }
    setBusy(false);
  }
  return (
    <View style={{ gap: 4 }}>
      <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
        <Ionicons name="document-attach-outline" size={16} color={t.muted} />
        <Txt size={12.5} weight="700" style={{ flexShrink: 1 }}>
          {doc.name}
        </Txt>
        {busy ? <ActivityIndicator size="small" color={t.muted} /> : <SmallButton icon="eye-outline" label={tr('کردنەوە', 'Open', 'فتح')} onPress={open} />}
      </View>
      {err ? (
        <Txt size={12} color={BAD}>
          {err}
        </Txt>
      ) : null}
      <Modal visible={!!image} transparent animationType="fade" onRequestClose={() => setImage(null)}>
        <View style={styles.viewer}>
          <Pressable style={styles.viewerClose} onPress={() => setImage(null)} accessibilityLabel={tr('داخستن', 'Close', 'إغلاق')}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
          {image ? <Image source={{ uri: image }} style={styles.viewerImg} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

type CardMode = 'mine' | 'approver' | 'view';

/**
 * One leave request. "mine": the person's own, with edit and remove.
 * "approver": someone else's, with approve / reject when it is waiting on you.
 * "view": read only.
 */
export function LeaveCard({
  l,
  mode,
  onEdit,
  onOpenPerson,
  showPerson = mode !== 'mine',
}: {
  l: Leave;
  mode: CardMode;
  onEdit?: (l: Leave) => void;
  onOpenPerson?: (id: string) => void;
  /** Name and photo of whose request it is; off on a person's own history. */
  showPerson?: boolean;
}) {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const rtl = isRtl(lang);
  const data = useData();
  const { emps, admins, lvs, leavePolicies, me, removeMine, approve, reject, approveChange, rejectChange, canSeeBal } = data;
  const [open, setOpen] = useState(false);

  const emp = emps.find((e) => e.id === l.empId);
  const isH = l.type === HOURLY_CODE;
  const days = emp ? leaveDaysCharged(l, emp, policyFor(l.type, leavePolicies, emp)) : l.days || 0;
  const amount = isH ? round1(l.hours || 0) : l.halfDay ? 0.5 : round1(mode === 'mine' ? l.days || days : days);
  const unit = isH ? tr('کاتژمێر', 'hours', 'ساعات') : tr('ڕۆژ', 'days', 'أيام');
  const st = statusOf(l, tr);
  const chain = Array.isArray(l.chain) ? l.chain : [];
  const step = Number(l.step) || 0;
  const canAct = mode === 'approver' && l.status === 'pending' && l.approverId === me.id;
  const canActChange = mode === 'approver' && !!l.change && l.approverId === me.id;
  const tone = leaveTypeColor(l.type);
  const bal =
    mode === 'approver' && emp && !isH && canSeeBal(emp.id)
      ? balanceFor(emp, l.type, lvs, leavePolicies, leaveYearOf(l.from || new Date()), l.from ? parseLocalDate(l.from) : new Date())
      : null;
  const short = !!bal && bal.available != null && days > bal.available;
  const waitingOn = chain[step]?.name || [...emps, ...admins].find((e) => e.id === l.approverId)?.fullName || null;
  const typeText = leaveTypeLabel(l.type, lang) + (l.halfDay ? ' · ' + tr('نیو ڕۆژ', 'Half day', 'نصف يوم') : '');
  const dates = isH || !l.to || l.to === l.from ? dmy(l.from) : dmy(l.from) + '  →  ' + dmy(l.to);

  return (
    <Card style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.head}>
        <View style={[styles.bar, { backgroundColor: tone }]} />
        {showPerson ? <PersonAvatar person={emp} name={l.empName} size={36} /> : null}
        <View style={{ flex: 1, gap: 5 }}>
          {showPerson ? (
            <Txt weight="700" numberOfLines={1}>
              {emp?.fullName || l.empName || '—'}
              {emp?.hrCode ? <Txt size={12} color="muted">{'  ·  ' + emp.hrCode}</Txt> : null}
            </Txt>
          ) : null}
          <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
            <Tag text={typeText} color={tone} />
            <Txt size={13} weight="700">
              {amount} <Txt size={11.5} color="muted">{unit}</Txt>
            </Txt>
          </View>
          <Txt size={12} color="muted" style={{ writingDirection: 'ltr', textAlign: rtl ? 'right' : 'left' }}>
            {dates}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {l.change && mode !== 'mine' ? (
            <Tag
              text={l.change.kind === 'cancel' ? tr('داوای سڕینەوە', 'Cancellation asked', 'طلب إلغاء') : tr('داوای گۆڕانکاری', 'Change asked', 'طلب تغيير')}
              color="#B45309"
              soft
            />
          ) : !canAct ? (
            <Tag text={st.label} color={st.color} soft />
          ) : null}
          {bal && bal.available != null ? (
            <Txt size={11} weight="700" color={short ? BAD : OK}>
              {fmtBal(bal.available, bal)} {tr('بەردەست', 'available', 'متاح')}
            </Txt>
          ) : null}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.faint} />
      </Pressable>

      {canAct ? (
        <View style={[styles.row, styles.actions]}>
          <SmallButton icon="checkmark" label={tr('پەسەندکردن', 'Approve', 'موافقة')} onPress={() => approve(l.id)} tone="ok" />
          <SmallButton icon="close" label={tr('ڕەتکردنەوە', 'Reject', 'رفض')} onPress={() => reject(l.id)} tone="danger" />
        </View>
      ) : null}

      {open ? (
        <View style={styles.body}>
          {l.reason ? <Fact label={tr('هۆکار', 'Reason', 'السبب')} value={l.reason} /> : null}
          {l.decidedBy ? <Fact label={tr('بڕیاردەر', 'Decided by', 'صاحب القرار')} value={l.decidedBy + ' · ' + dmy(l.decidedAt)} /> : null}
          {l.decisionNote ? <Fact label={tr('هۆکاری ڕەتکردنەوە', 'Reason for rejecting', 'سبب الرفض')} value={l.decisionNote} tone={BAD} /> : null}
          {mode !== 'mine' && emp && onOpenPerson ? (
            <Pressable onPress={() => onOpenPerson(emp.id)} style={[styles.row, { gap: 6 }]}>
              <Ionicons name="person-circle-outline" size={16} color={t.petrol} />
              <Txt size={12.5} weight="700" color="petrol">
                {tr('بینینی مۆڵەتەکانی ئەم کەسە', "See this person's leave", 'عرض إجازات هذا الشخص')}
              </Txt>
            </Pressable>
          ) : null}

          {isH && !(Number(l.hours) > 0) ? (
            <Note tone={BAD}>
              {tr('هیچ کاتژمێرێک تۆمار نەکراوە، بۆیە لە ماوە کەم نابێتەوە. دەستکاری بکە و کاتژمێرەکان بنووسە.',
                'No hours were recorded, so nothing has come off the balance. Edit it and enter the hours.',
                'لم تُسجّل ساعات، لذلك لم يُخصم شيء من الرصيد. عدّل الطلب وأدخل الساعات.')}
            </Note>
          ) : null}

          {l.status === 'pending' && waitingOn ? (
            <Note tone={PENDING_C}>
              {tr('چاوەڕوانی: ', 'Waiting on: ', 'بانتظار: ') + waitingOn + (chain[step] ? ' (' + stageLabel(chain[step].stage, lang) + ')' : '')}
            </Note>
          ) : null}

          {chain.length > 1 || (l.signs || []).length > 0 ? (
            <View style={[styles.box, { backgroundColor: t.field }]}>
              <Txt size={11.5} weight="800" color="muted">
                {tr('پرۆسەی ئەپروڤکردن', 'Approval progress', 'مراحل الموافقة')}
              </Txt>
              {chain.map((c, i) => {
                const sg = (l.signs || [])[i];
                const done = l.status === 'approved' || i < step;
                const now = l.status === 'pending' && i === step;
                const color = done ? OK : now ? PENDING_C : t.muted;
                return (
                  <Txt key={c.id + i} size={12} color={color} style={{ opacity: done || now ? 1 : 0.7 }}>
                    {(done ? '✓ ' : now ? '● ' : '○ ') + c.name + ' · ' + stageLabel(c.stage, lang) + (sg?.at ? ' · ' + dmy(sg.at) : '')}
                  </Txt>
                );
              })}
            </View>
          ) : null}

          {(l.edits || []).map((e, i) => (
            <Txt key={'e' + i} size={11.5} color="#B45309">
              {'✎ ' + e.by + ' ' + tr('ڕۆژەکانی گۆڕی بۆ', 'changed the days to', 'غيّر الأيام إلى') + ' ' + dmy(e.fromNow) + ' → ' + dmy(e.toNow) + ' (' + round1(e.daysNow || 0) + ')' + (e.note ? ' · ' + e.note : '')}
            </Txt>
          ))}

          {l.doc ? <DocButton doc={l.doc} /> : null}

          {l.change ? (
            <Note tone="#B45309">
              {mode === 'mine'
                ? l.change.kind === 'cancel'
                  ? tr('داوای سڕینەوە نێردراوە — چاوەڕوانی ئەپروڤە. تا ئەو کاتە مۆڵەتەکە وەک خۆی ماوە.', 'Cancellation sent — waiting for approval. Until then this leave stands.', 'أُرسل طلب الإلغاء — بانتظار الموافقة. تبقى الإجازة حتى ذلك الحين.')
                  : tr('داوای گۆڕانکاری نێردراوە — چاوەڕوانی ئەپروڤە. تا ئەو کاتە مۆڵەتەکەی پێشوو وەک خۆی ماوە.', 'Change sent — waiting for approval. Until then the original leave stands.', 'أُرسل طلب التغيير — بانتظار الموافقة. تبقى الإجازة الأصلية حتى ذلك الحين.')
                : (l.change.kind === 'cancel'
                    ? tr('داوای سڕینەوەی ئەم مۆڵەتە کراوە', 'Cancellation requested', 'طُلب الإلغاء')
                    : tr('داوای گۆڕانکاری کراوە', 'Change requested', 'طُلب تغيير') +
                      ': ' + dmy(l.change.from) + ' → ' + dmy(l.change.to) + ' · ' + round1(l.change.days || 0) + ' ' + tr('ڕۆژ', 'day(s)', 'يوم') +
                      (l.change.type && l.change.type !== l.type ? ' · ' + leaveTypeLabel(l.change.type, lang) : '') +
                      (l.change.reason ? ' · ' + l.change.reason : '')) +
                  '\n' + tr('داواکراوە لەلایەن ', 'Asked by ', 'بطلب من ') + (l.change.by || '—') + ' · ' + dmy(l.change.at)}
            </Note>
          ) : null}

          {canActChange ? (
            <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
              <SmallButton icon="checkmark" label={tr('پەسەندکردنی گۆڕانکاری', 'Approve change', 'الموافقة على التغيير')} onPress={() => approveChange(l.id)} tone="ok" />
              <SmallButton icon="close" label={tr('ڕەتکردنەوەی گۆڕانکاری', 'Refuse change', 'رفض التغيير')} onPress={() => rejectChange(l.id)} tone="danger" />
            </View>
          ) : null}

          {bal && bal.entitlement != null ? (
            <Txt size={12} weight="700">
              {tr('ماوەی ئەم کەسە: ', 'Their balance: ', 'رصيده: ')}
              <Txt size={12} weight="800" color={short ? BAD : OK}>
                {fmtBal(bal.available, bal)}
              </Txt>
              <Txt size={12} color="muted">{' / ' + fmtBal(bal.entitlement, bal)}</Txt>
              {short && l.status === 'pending' ? <Txt size={12} weight="800" color={BAD}>{'  ' + tr('لە ماوەکەی زیاترە', 'Exceeds their balance', 'يتجاوز رصيده')}</Txt> : null}
            </Txt>
          ) : null}

          {mode === 'mine' && l.status !== 'rejected' && !l.change ? (
            <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
              {onEdit ? <SmallButton icon="create-outline" label={tr('دەستکاری', 'Edit', 'تعديل')} onPress={() => onEdit(l)} /> : null}
              <SmallButton icon="trash-outline" label={tr('سڕینەوە', 'Remove', 'إزالة')} onPress={() => removeMine(l)} tone="danger" />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Txt size={11} color="faint" weight="600">
        {label}
      </Txt>
      <Txt size={13} weight="600" color={tone || 'text'}>
        {value}
      </Txt>
    </View>
  );
}

function Note({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <View style={[styles.box, { backgroundColor: tone + '18' }]}>
      <Txt size={12} weight="700" color={tone} style={{ lineHeight: 19 }}>
        {children}
      </Txt>
    </View>
  );
}

function Folder({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={[styles.folder, { backgroundColor: t.surface, borderColor: t.line }]}>
        <Ionicons name="folder-outline" size={17} color={t.petrol} />
        <Txt weight="700" style={{ flex: 1 }}>
          {title}
        </Txt>
        <View style={[styles.count, { backgroundColor: t.chipSoft }]}>
          <Txt size={11.5} weight="700" color="chipInk">
            {count}
          </Txt>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={t.faint} />
      </Pressable>
      {open ? <View style={{ gap: 10, paddingStart: 10 }}>{children}</View> : null}
    </View>
  );
}

/** Current and future requests in full; earlier ones filed into month and year folders, as on the website. */
export function LeaveArchive({ items, render, emptyText }: { items: Leave[]; render: (l: Leave) => ReactNode; emptyText?: string }) {
  const { lang } = useSession();
  const tr = useT();
  const now = new Date();
  const curYM = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const curY = String(now.getFullYear());
  const sorted = items.slice().sort((a, b) => String(b.from || '').localeCompare(String(a.from || '')));
  if (!sorted.length) return emptyText ? <Empty text={emptyText} /> : null;
  const loose: Leave[] = [];
  const months: Record<string, Leave[]> = {};
  const years: Record<string, Record<string, Leave[]>> = {};
  sorted.forEach((x) => {
    const ym = String(x.from || '').slice(0, 7) || curYM;
    if (ym >= curYM) return loose.push(x);
    const y = ym.slice(0, 4);
    if (y === curY) (months[ym] = months[ym] || []).push(x);
    else {
      years[y] = years[y] || {};
      (years[y][ym] = years[y][ym] || []).push(x);
    }
  });
  return (
    <View style={{ gap: 10 }}>
      {loose.map(render)}
      {Object.keys(months)
        .sort()
        .reverse()
        .map((ym) => (
          <Folder key={ym} title={monthLabel(ym, lang)} count={months[ym].length}>
            {months[ym].map(render)}
          </Folder>
        ))}
      {Object.keys(years)
        .sort()
        .reverse()
        .map((y) => (
          <Folder key={y} title={tr('ساڵی ', 'Year ', 'سنة ') + y} count={Object.values(years[y]).reduce((n, l) => n + l.length, 0)}>
            {Object.keys(years[y])
              .sort()
              .reverse()
              .map((ym) => (
                <Folder key={ym} title={monthLabel(ym, lang)} count={years[y][ym].length}>
                  {years[y][ym].map(render)}
                </Folder>
              ))}
          </Folder>
        ))}
    </View>
  );
}

/** Horizontal chips, used to filter by leave type. */
export function ChipRow({ items, value, onChange }: { items: { id: string; label: string; color?: string }[]; value: string; onChange: (id: string) => void }) {
  const { t } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 2 }}>
      {items.map((it) => {
        const on = it.id === value;
        const c = it.color || t.text;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={[styles.chip, { borderColor: on ? c : t.line, backgroundColor: on ? c + '1c' : t.surface }]}
          >
            <Txt size={12.5} weight="700" color={on ? c : 'muted'}>
              {it.label}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, paddingStart: 16 },
  bar: { position: 'absolute', start: 0, top: 0, bottom: 0, width: 4 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  actions: { gap: 8, paddingHorizontal: 13, paddingBottom: 12, marginTop: -4 },
  body: { gap: 10, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2 },
  box: { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, gap: 3 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
  folder: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  count: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  viewerClose: { position: 'absolute', top: 48, right: 20, zIndex: 2, padding: 8 },
  viewerImg: { width: '100%', height: '80%' },
});

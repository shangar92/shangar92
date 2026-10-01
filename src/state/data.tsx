// Live company data and every action the employee app can take. The actions
// follow the Day Off website step for step, including the notifications they
// send and what they record, so the website and this app stay in agreement.

import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { isoLocal, uid } from '../lib/dates';
import { deleteProfilePhoto, uploadProfilePhoto } from '../lib/files';
import { logActivity, logLeaveChange, useRecordCollection, useStateDoc } from '../lib/records';
import {
  empsWithin,
  findMyRecord,
  leaveCells,
  lvLine,
  lvLineKu,
  notifReadBy,
  notifVisible,
  permFor,
  Policies,
  scopedEmpIds,
  setCustomLeaveTypes,
  setHolidays,
  unitSubtree,
  watchersFor,
  watchesEmp,
} from '../lib/rules';
import type { Announcement, ChainStep, Leave, LeaveDoc, Notif, Person, Role, Unit } from '../lib/types';
import { useFeedback } from './feedback';
import { useSession, useT } from './session';

/** What the request form hands over. */
export type LeaveDraft = {
  type: string;
  from: string;
  to: string;
  reason: string;
  halfDay: boolean;
  docNote?: string;
  doc: LeaveDoc | null;
  days: number;
  hours?: number;
  chain: ChainStep[];
  approverId: string;
};

type Data = {
  ready: boolean;
  role: Role;
  me: Person;
  emps: Person[];
  admins: Person[];
  depts: Unit[];
  lvs: Leave[];
  anns: Announcement[];
  leavePolicies: Policies;
  myNotifs: (Notif & { read: boolean })[];
  unreadCount: number;
  timesheetCells: Record<string, string>;
  // What this person looks after
  inbox: Leave[];
  decided: Leave[];
  isApprover: boolean;
  isWatcher: boolean;
  watching: Leave[];
  myPeople: Person[];
  canSeeBal: (empId: string) => boolean;
  // Actions
  submitLeave: (r: LeaveDraft) => void;
  saveMine: (was: Leave, r: LeaveDraft) => void;
  removeMine: (l: Leave) => Promise<void>;
  approve: (id: string) => void;
  reject: (id: string) => void;
  approveChange: (id: string) => void;
  rejectChange: (id: string) => Promise<void>;
  markNotifsSeen: () => void;
  setMyPhoto: (picked: { uri: string; width: number; height: number } | null) => Promise<unknown>;
  clearMustChange: () => void;
};

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession();
  const tr = useT();
  const { toast, confirm, prompt } = useFeedback();
  const role = (profile?.role || 'employee') as Role;
  const cu = profile?.cu || null;

  const onWriteFailed = useCallback(
    (coll: string, detail: string) => toast(tr('پاشەکەوت نەکرا', 'Not saved', 'لم يتم الحفظ') + ' (' + coll + ': ' + detail + ')'),
    [toast, tr],
  );
  const [emps, setEmps, empsReady] = useRecordCollection<Person>('employees_v2', onWriteFailed);
  const [admins, setAdmins] = useRecordCollection<Person>('admins_v2', onWriteFailed);
  const [lvs, setLvs, lvsReady] = useRecordCollection<Leave>('leaves_v2', onWriteFailed);
  const [depts] = useRecordCollection<Unit>('departments_v2', onWriteFailed);
  const [notifs, setNotifs] = useRecordCollection<Notif>('notifications_v2', onWriteFailed);
  const [anns] = useStateDoc<Announcement[]>('announcements', []);
  const [rolePerms] = useStateDoc<Record<string, Record<string, unknown>>>('rolePerms', {});
  const [leavePolicies] = useStateDoc<Policies>('leavePolicies', {});
  const [customTypes] = useStateDoc<unknown[]>('customLeaveTypes', []);
  const [holidays] = useStateDoc<unknown[]>('holidays', []);
  const [payroll] = useStateDoc<Record<string, string>>('payroll', {});
  const [payrollHrd] = useStateDoc<Record<string, string>>('payrollHrd', {});

  // The rules read these module-wide, as on the website.
  setHolidays(holidays);
  setCustomLeaveTypes(customTypes);

  // The signed-in person's live record (by id, then by email).
  const myEmail = String(cu?.email || '').toLowerCase();
  const me: Person =
    admins.find((x) => x.id === cu?.id) ||
    emps.find((x) => x.id === cu?.id) ||
    (myEmail ? emps.find((x) => String(x.email || '').toLowerCase() === myEmail) : undefined) ||
    (myEmail ? admins.find((x) => String(x.email || '').toLowerCase() === myEmail) : undefined) ||
    (cu as Person);
  const myRecord = findMyRecord(emps, cu) || me;
  const actor = useMemo(() => ({ id: me?.id, name: me?.fullName, role }), [me?.id, me?.fullName, role]);
  const empNameOf = useCallback((id: string) => (emps.find((e) => e.id === id) || ({} as Person)).fullName || '—', [emps]);

  const myNotifs = useMemo(
    () =>
      notifs
        .filter((n) => notifVisible(n, role, me))
        .map((n) => ({ ...n, read: notifReadBy(n, me) }))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0)),
    [notifs, role, me],
  );
  const unreadCount = myNotifs.filter((n) => !n.read && n.target !== 'announcements').length;

  const timesheetCells = useMemo(() => ({ ...leaveCells(lvs), ...payroll, ...payrollHrd }), [lvs, payroll, payrollHrd]);

  // --- What this person looks after (as the website's employee app) -------
  const myPeople = useMemo(() => {
    if (!me?.id) return [];
    const ids = new Set<string>();
    emps.forEach((e) => {
      if (e.approverId === me.id) ids.add(e.id);
    });
    depts
      .filter((u) => u.managerId === me.id)
      .forEach((u) => {
        const units = new Set(unitSubtree(depts, u.id));
        emps.forEach((e) => {
          if (e.dept && units.has(e.dept)) ids.add(e.id);
        });
      });
    const scope = permFor(role, rolePerms, 'timesheet');
    if (scope && scope !== 'deny') empsWithin(String(scope), myRecord, emps, depts).forEach((e) => ids.add(e.id));
    return emps.filter((e) => ids.has(e.id));
  }, [emps, depts, me, role, rolePerms, myRecord]);

  const inbox = useMemo(
    () => lvs.filter((l) => l.approverId === me?.id && (l.status === 'pending' || l.change) && l.empId !== me?.id),
    [lvs, me?.id],
  );
  const decided = useMemo(
    () =>
      lvs
        .filter(
          (l) =>
            l.empId !== me?.id &&
            !inbox.includes(l) &&
            ((l.signs || []).some((sg) => sg.id && sg.id === me?.id) ||
              (l.decidedById && l.decidedById === me?.id) ||
              (l.approverId === me?.id && l.status !== 'pending')),
        )
        .sort((a, b) => String(b.decidedAt || b.from || '').localeCompare(String(a.decidedAt || a.from || ''))),
    [lvs, inbox, me?.id],
  );
  const isApprover =
    depts.some((d) => d.managerId === me?.id) ||
    emps.some((e) => e.approverId === me?.id) ||
    lvs.some((l) => l.approverId === me?.id && l.empId !== me?.id);
  const isWatcher = !!me?.id && (depts.some((u) => (u.watchers || []).includes(me.id)) || emps.some((e) => (e.watchers || []).includes(me.id)));
  const watching = useMemo(
    () =>
      isWatcher
        ? lvs
            .filter(
              (l) =>
                l.empId !== me?.id &&
                (l.status === 'pending' || l.status === 'approved') &&
                watchesEmp(me?.id, emps.find((e) => e.id === l.empId), depts),
            )
            .sort((a, b) => {
              const r = (x: Leave) => (x.status === 'pending' ? 0 : 1);
              if (r(a) !== r(b)) return r(a) - r(b);
              return String(b.from || '').localeCompare(String(a.from || ''));
            })
            .slice(0, 150)
        : [],
    [isWatcher, lvs, me?.id, emps, depts],
  );

  // Whose balance this person may see next to a request (Settings → View balance).
  const canSeeBal = useCallback(
    (empId: string) => {
      if (empId === me?.id || empId === myRecord?.id) return true;
      const s = permFor(role, rolePerms, 'viewBalance');
      if (s === 'all') return true;
      if (!s || s === 'deny') return false;
      const ids = scopedEmpIds(String(s), myRecord, emps, depts);
      return ids === null || ids.has(empId);
    },
    [me?.id, myRecord, role, rolePerms, emps, depts],
  );

  // --- Actions --------------------------------------------------------------
  const addNotif = useCallback(
    (text: string, textKu: string, target: string, to: string, meta?: Record<string, unknown>) => {
      const toVal = to || 'all';
      const entry = { id: uid('n'), text, textKu, target, to: toVal, date: isoLocal(new Date()), read: false, ts: Date.now(), ...(meta || {}) } as Notif;
      // Each recipient keeps their own 300 most recent.
      setNotifs((p) => {
        const rest = (p || []).filter((n) => n.to !== toVal);
        const mine = [entry, ...(p || []).filter((n) => n.to === toVal)];
        return [...(mine.length > 300 ? mine.slice(0, 300) : mine), ...rest];
      });
    },
    [setNotifs],
  );

  const submitLeave = useCallback(
    (r: LeaveDraft) => {
      const name = myRecord?.fullName || me?.fullName || '—';
      setLvs((p) => [
        {
          id: uid('lv'), empId: me.id, empName: name, type: r.type, from: r.from, to: r.to, reason: r.reason,
          halfDay: r.halfDay, docNote: r.docNote, doc: r.doc, days: r.days, hours: r.hours, status: 'pending',
          approverId: r.approverId, chain: r.chain, step: 0, signs: [], createdAt: isoLocal(new Date()),
        } as Leave,
        ...p,
      ]);
      addNotif('New leave request from ' + name, 'داواکاری مۆڵەتی نوێ لە ' + name, 'leave', 'person:' + r.approverId, { leaveType: r.type, forDoctor: true });
      watchersFor(myRecord, depts).forEach((w) =>
        addNotif(name + ' requested leave (' + r.from + ' → ' + r.to + ')', name + ' داوای مۆڵەتی کرد (' + r.from + ' → ' + r.to + ')', 'leave', 'person:' + w, { leaveType: r.type }),
      );
      toast(tr('داواکاری مۆڵەت نێردرا', 'Leave request sent', 'تم إرسال طلب الإجازة'));
    },
    [setLvs, addNotif, me, myRecord, depts, toast, tr],
  );

  const requestLeaveChange = useCallback(
    (id: string, change: Leave['change']) => {
      let targets: string[] = [];
      let who = 'An employee';
      let ltype: string | null = null;
      setLvs((p) =>
        p.map((l) => {
          if (l.id !== id) return l;
          who = l.empName || who;
          ltype = l.type;
          const ids = new Set([l.approverId, ...(Array.isArray(l.chain) ? l.chain.map((c) => c.id) : [])].filter(Boolean) as string[]);
          targets = [...ids];
          return { ...l, change: { ...change!, at: isoLocal(new Date()), by: me?.fullName || '—' } };
        }),
      );
      const isCancel = change && change.kind === 'cancel';
      targets.forEach((t) =>
        addNotif(
          who + (isCancel ? ' asked to cancel approved leave' : ' asked to change approved leave') + ' — your approval is needed',
          who + (isCancel ? ' داوای سڕینەوەی مۆڵەتێکی پەسەندکراو دەکات' : ' داوای گۆڕینی مۆڵەتێکی پەسەندکراو دەکات') + ' — پێویستی بە ئەپروڤی تۆیە',
          'leave', 'person:' + t, { leaveType: ltype, forDoctor: true },
        ),
      );
    },
    [setLvs, addNotif, me?.fullName],
  );

  const saveMine = useCallback(
    (was: Leave, r: LeaveDraft) => {
      const name = myRecord?.fullName || me?.fullName;
      if (was.status === 'approved') {
        // Approved leave is only proposed for change; the original stands until agreed.
        requestLeaveChange(was.id, { kind: 'edit', type: r.type, from: r.from, to: r.to, reason: r.reason, halfDay: r.halfDay, doc: r.doc, days: r.days, hours: r.hours });
        logLeaveChange({ empId: me?.id, empName: name, action: 'change-request', type: was.type, from: was.from, to: was.to, newType: r.type, newFrom: r.from, newTo: r.to });
        toast(tr('گۆڕانکاری نێردرا — تا ئەپروڤ نەکرێت مۆڵەتەکەی پێشوو وەک خۆی دەمێنێتەوە', 'Change requested — the original leave stands until it is approved', 'تم طلب التغيير — تبقى الإجازة الأصلية حتى تتم الموافقة'));
        return;
      }
      setLvs((p) =>
        p.map((x) =>
          x.id !== was.id
            ? x
            : {
                ...x, type: r.type, from: r.from, to: r.to, reason: r.reason, halfDay: r.halfDay, docNote: r.docNote, doc: r.doc,
                hours: r.hours, days: r.days,
                // Back to square one: the edited request starts its approval again.
                status: 'pending', approverId: r.approverId, chain: r.chain, step: 0, signs: [],
                decidedBy: null, decidedAt: null, decisionNote: null, editedAt: isoLocal(new Date()),
              },
        ),
      );
      logLeaveChange({ empId: me?.id, empName: name, action: 'edit', type: was.type, from: was.from, to: was.to, newType: r.type, newFrom: r.from, newTo: r.to });
      addNotif((name || 'An employee') + ' changed a leave request — it needs approving again', 'داواکاری مۆڵەتی ' + (name || 'کارمەندێک') + ' گۆڕدرا — پێویستی بە ئەپروڤی دووبارەیە', 'leave', 'person:' + r.approverId, { leaveType: r.type, forDoctor: true });
      toast(tr('گۆڕدرا — چاوەڕوانی ئەپروڤی دووبارەیە', 'Updated — waiting to be approved again', 'تم التحديث — بانتظار الموافقة مجددًا'));
    },
    [requestLeaveChange, setLvs, addNotif, me?.id, me?.fullName, myRecord?.fullName, toast, tr],
  );

  const removeMine = useCallback(
    async (l: Leave) => {
      const name = myRecord?.fullName || me?.fullName;
      if (l.status === 'approved') {
        const ok = await confirm({
          title: tr('داوای سڕینەوە', 'Ask to cancel', 'طلب الإلغاء'),
          text: tr('داوای سڕینەوەی ئەم مۆڵەتە بکرێت؟ تا ئەپروڤەرەکەت ڕازی نەبێت، مۆڵەتەکە وەک خۆی دەمێنێتەوە.', 'Ask to cancel this leave? Until your approver agrees, it stays exactly as it is.', 'هل تطلب إلغاء هذه الإجازة؟ تبقى كما هي حتى يوافق المسؤول.'),
          yes: tr('ناردن', 'Send', 'إرسال'),
          no: tr('پاشگەزبوونەوە', 'Cancel', 'إلغاء'),
        });
        if (!ok) return;
        requestLeaveChange(l.id, { kind: 'cancel' });
        logLeaveChange({ empId: me?.id, empName: name, action: 'cancel-request', type: l.type, from: l.from, to: l.to });
        toast(tr('داوای سڕینەوە نێردرا — چاوەڕوانی ئەپروڤە', 'Cancellation requested — waiting for approval', 'تم طلب الإلغاء — بانتظار الموافقة'));
        return;
      }
      const ok = await confirm({
        title: tr('لابردنی داواکاری', 'Remove request', 'إزالة الطلب'),
        text: tr('ئەم داواکارییە لابردرێت؟ ڕۆژەکانی دەگەڕێنەوە بۆ ماوەکەت.', 'Remove this request? Its days go back into your balance.', 'هل تريد إزالة هذا الطلب؟ تعود أيامه إلى رصيدك.'),
        yes: tr('لابردن', 'Remove', 'إزالة'),
        no: tr('پاشگەزبوونەوە', 'Cancel', 'إلغاء'),
        danger: true,
      });
      if (!ok) return;
      setLvs((p) => p.filter((x) => x.id !== l.id));
      logLeaveChange({ empId: me?.id, empName: name, action: 'delete', type: l.type, from: l.from, to: l.to, status: l.status });
      if (l.approverId)
        addNotif((name || 'An employee') + ' withdrew a leave request (' + l.from + ' → ' + l.to + ')', (name || 'کارمەندێک') + ' داواکاری مۆڵەتێکی لابرد (' + l.from + ' → ' + l.to + ')', 'leave', 'person:' + l.approverId, { leaveType: l.type });
      toast(tr('داواکاری لابرا — ڕۆژەکانی گەڕانەوە', 'Request removed — its days are back', 'أزيل الطلب — عادت أيامه'));
    },
    [confirm, requestLeaveChange, setLvs, addNotif, me?.id, me?.fullName, myRecord?.fullName, toast, tr],
  );

  const approve = useCallback(
    (id: string) => {
      let empId: string | null = null;
      let advancedTo: ChainStep | null = null;
      let finished = false;
      let ltype: string | null = null;
      let rec: Leave | null = null;
      setLvs((p) =>
        p.map((l) => {
          if (l.id !== id) return l;
          empId = l.empId;
          ltype = l.type;
          rec = l;
          const chain = Array.isArray(l.chain) ? l.chain : [];
          const step = Number(l.step) || 0;
          const sign = { id: me?.id || null, by: me?.fullName || '—', at: isoLocal(new Date()), stage: (chain[step] && chain[step].stage) || 'manager' };
          const signs = [...(l.signs || []), sign];
          if (chain.length > step + 1) {
            advancedTo = chain[step + 1];
            return { ...l, signs, step: step + 1, approverId: chain[step + 1].id, status: 'pending' };
          }
          finished = true;
          return { ...l, signs, status: 'approved', decidedBy: me?.fullName || '—', decidedById: me?.id || null, decidedAt: isoLocal(new Date()) };
        }),
      );
      const next = advancedTo as ChainStep | null;
      if (next) {
        toast(tr('واژووکرا — نێردرا بۆ ' + next.name, 'Signed — passed to ' + next.name, 'تم التوقيع — أُرسل إلى ' + next.name));
        addNotif('A leave request needs your approval', 'داواکاری مۆڵەتێک چاوەڕوانی ئەپروڤی تۆیە', 'leave', 'person:' + next.id, { leaveType: ltype, forDoctor: true });
        if (empId) addNotif('Your request was signed and passed to ' + next.name, 'داواکارییەکەت واژووکرا و نێردرا بۆ ' + next.name, 'leave', 'person:' + empId, { leaveType: ltype });
      } else if (finished) {
        toast(tr('پەسەندکرا — لە ماوەی مۆڵەت کەم کرایەوە', 'Approved — balance deducted', 'تمت الموافقة — خُصمت من الرصيد'));
        addNotif('Your leave request was approved', 'داواکاری مۆڵەتەکەت پەسەندکرا', 'leave', empId ? 'person:' + empId : 'all', { leaveType: ltype, status: 'approved' });
        const who = emps.find((e) => e.id === empId);
        watchersFor(who, depts).forEach((w) =>
          addNotif(empNameOf(empId!) + "'s leave was approved (" + lvLine(rec) + ')', 'مۆڵەتی ' + empNameOf(empId!) + ' پەسەندکرا (' + lvLineKu(rec) + ')', 'leave', 'person:' + w, { leaveType: ltype }),
        );
      }
      if (empId)
        logActivity(actor, (finished ? 'Approved ' : 'Signed ') + lvLine(rec) + ' for ' + empNameOf(empId), (finished ? 'مۆڵەتی ' : 'واژووی مۆڵەتی ') + empNameOf(empId) + (finished ? ' پەسەند کرد' : ' کرد') + ' (' + lvLineKu(rec) + ')', { kind: 'leave', empId });
    },
    [setLvs, me?.id, me?.fullName, addNotif, emps, depts, empNameOf, actor, toast, tr],
  );

  const reject = useCallback(
    (id: string) => {
      let empId: string | null = null;
      let ltype: string | null = null;
      let rec: Leave | null = null;
      setLvs((p) =>
        p.map((l) => {
          if (l.id !== id) return l;
          empId = l.empId;
          ltype = l.type;
          rec = l;
          return { ...l, status: 'rejected', decidedBy: me?.fullName || '—', decidedById: me?.id || null, decidedAt: isoLocal(new Date()), decisionNote: '' };
        }),
      );
      if (empId) addNotif('Your leave request was rejected', 'داواکاری مۆڵەتەکەت ڕەتکرایەوە', 'leave', 'person:' + empId, { leaveType: ltype });
      toast(tr('داواکاری ڕەتکرایەوە', 'Request rejected', 'تم رفض الطلب'));
      if (empId) logActivity(actor, 'Rejected ' + lvLine(rec) + ' for ' + empNameOf(empId), 'مۆڵەتی ' + empNameOf(empId) + ' ڕەت کردەوە (' + lvLineKu(rec) + ')', { kind: 'leave', empId });
    },
    [setLvs, me?.id, me?.fullName, addNotif, empNameOf, actor, toast, tr],
  );

  const approveChange = useCallback(
    (id: string) => {
      let empId: string | null = null;
      let kind: string | null = null;
      let ltype: string | null = null;
      setLvs((p) => {
        const rec = p.find((l) => l.id === id);
        if (!rec || !rec.change) return p;
        empId = rec.empId;
        kind = rec.change.kind;
        ltype = rec.type;
        if (kind === 'cancel') return p.filter((l) => l.id !== id);
        const c = rec.change;
        return p.map((l) =>
          l.id !== id
            ? l
            : {
                ...l, type: c.type!, from: c.from!, to: c.to!, reason: c.reason, halfDay: c.halfDay,
                doc: c.doc !== undefined ? c.doc : l.doc, days: c.days, hours: c.hours !== undefined ? c.hours : l.hours,
                change: null, changedBy: me?.fullName || '—', changedAt: isoLocal(new Date()),
              },
        );
      });
      if (empId) {
        addNotif(kind === 'cancel' ? 'Your cancellation was approved' : 'Your change was approved', kind === 'cancel' ? 'داواکاری سڕینەوەکەت پەسەندکرا' : 'گۆڕانکارییەکەت پەسەندکرا', 'leave', 'person:' + empId, { leaveType: ltype });
        logActivity(actor, 'Approved a ' + (kind === 'cancel' ? 'cancellation' : 'change') + ' of ' + empNameOf(empId) + "'s leave", (kind === 'cancel' ? 'سڕینەوەی' : 'گۆڕانکاری') + ' مۆڵەتی ' + empNameOf(empId) + ' پەسەند کرد', { kind: 'leave', empId });
      }
      toast(kind === 'cancel' ? tr('سڕینەوە پەسەندکرا', 'Cancellation approved', 'تمت الموافقة على الإلغاء') : tr('گۆڕانکاری پەسەندکرا', 'Change approved', 'تمت الموافقة على التغيير'));
    },
    [setLvs, me?.fullName, addNotif, empNameOf, actor, toast, tr],
  );

  const rejectChange = useCallback(
    async (id: string) => {
      const why = await prompt({
        title: tr('ڕەتکردنەوەی گۆڕانکاری', 'Refuse change', 'رفض التغيير'),
        text: tr('هۆکاری ڕەتکردنەوەی گۆڕانکاری (ئیختیاری):', 'Reason for refusing the change (optional):', 'سبب رفض التغيير (اختياري):'),
        yes: tr('ڕەتکردنەوە', 'Refuse', 'رفض'),
        no: tr('پاشگەزبوونەوە', 'Cancel', 'إلغاء'),
        danger: true,
        input: {},
      });
      if (why === null) return;
      let empId: string | null = null;
      let ltype: string | null = null;
      setLvs((p) =>
        p.map((l) => {
          if (l.id !== id || !l.change) return l;
          empId = l.empId;
          ltype = l.type;
          return { ...l, change: null };
        }),
      );
      if (empId) {
        addNotif('Your change was refused — the original leave stands' + (why.trim() ? ': ' + why.trim() : ''), 'گۆڕانکارییەکەت ڕەتکرایەوە — مۆڵەتەکەی پێشوو وەک خۆی ماوە' + (why.trim() ? ': ' + why.trim() : ''), 'leave', 'person:' + empId, { leaveType: ltype });
        logActivity(actor, 'Refused a change to ' + empNameOf(empId) + "'s leave", 'گۆڕانکاری مۆڵەتی ' + empNameOf(empId) + ' ڕەت کردەوە', { kind: 'leave', empId });
      }
      toast(tr('گۆڕانکاری ڕەتکرایەوە — داواکارییەکە وەک خۆی مایەوە', 'Change refused — the request is unchanged', 'رُفض التغيير — بقي الطلب كما هو'));
    },
    [prompt, setLvs, addNotif, empNameOf, actor, toast, tr],
  );

  const markNotifsSeen = useCallback(() => {
    if (!me?.id) return;
    setNotifs((p) =>
      p.map((n) => (!notifReadBy(n, me) && notifVisible(n, role, me) ? { ...n, readBy: { ...(n.readBy || {}), [me.id]: true } } : n)),
    );
  }, [setNotifs, me, role]);

  const setMyPhoto = useCallback(
    async (picked: { uri: string; width: number; height: number } | null) => {
      if (!me?.id) return;
      try {
        let url = '';
        if (picked) url = await uploadProfilePhoto(me.id, picked);
        else await deleteProfilePhoto(me.id);
        if (admins.some((x) => x.id === me.id)) setAdmins((p) => p.map((x) => (x.id === me.id ? { ...x, photoUrl: url } : x)));
        else setEmps((p) => p.map((x) => (x.id === me.id ? { ...x, photoUrl: url } : x)));
        toast(picked ? tr('وێنەی پرۆفایل نوێکرایەوە', 'Profile photo updated', 'تم تحديث الصورة') : tr('وێنە سڕایەوە', 'Photo removed', 'أزيلت الصورة'));
      } catch (err) {
        console.error('Profile photo error:', err);
        return err;
      }
    },
    [me, admins, setAdmins, setEmps, toast, tr],
  );

  const clearMustChange = useCallback(() => {
    const myId = me?.id;
    const myMail = String(me?.email || '').toLowerCase();
    const match = (x: Person) => (myId && x.id === myId) || (myMail && String(x.email || '').toLowerCase() === myMail);
    setEmps((p) => p.map((e) => (match(e) ? { ...e, mustChangePassword: false } : e)));
    setAdmins((p) => p.map((a) => (match(a) ? { ...a, mustChangePassword: false } : a)));
  }, [me?.id, me?.email, setEmps, setAdmins]);

  const value: Data = {
    ready: empsReady && lvsReady,
    role, me, emps, admins, depts, lvs, anns: Array.isArray(anns) ? anns : [], leavePolicies: leavePolicies || {},
    myNotifs, unreadCount, timesheetCells, inbox, decided, isApprover, isWatcher, watching, myPeople, canSeeBal,
    submitLeave, saveMine, removeMine, approve, reject, approveChange, rejectChange, markNotifsSeen, setMyPhoto, clearMustChange,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

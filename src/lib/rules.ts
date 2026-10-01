// The leave rules of the Day Off web app (Khurmalla Day Off), ported one to
// one so this app computes exactly what the website computes: which days a
// request costs, balances, accrual and carry-over, who has to sign, and who
// may see what. Keep this file in step with the web app when its rules change.

import { isoLocal, parseLocalDate, r3, round1 } from './dates';
import { Lang, T, TL } from './i18n';
import type { ChainStep, Holiday, Leave, LeaveType, Notif, Person, Policy, Role, Unit } from './types';

// ---------------------------------------------------------------------------
// Leave types
// ---------------------------------------------------------------------------

export const LEAVE_TYPES: LeaveType[] = [
  { code: 'P', ku: 'ئاسایی', en: 'Regular Leave', ar: 'اجازة اعتيادية', color: '#16A34A' },
  { code: 'U', ku: 'بێ مووچە', en: 'Unpaid Leave', ar: 'اجازة بدون راتب', color: '#7A2222' },
  { code: 'S', ku: 'نەخۆشی', en: 'Sick Leave', ar: 'اجازة مرضية', color: '#B45309' },
  { code: 'CA', ku: 'پرسە A', en: 'Bereavement A', ar: 'عزاء A', color: '#222222' },
  { code: 'CB', ku: 'پرسە B', en: 'Bereavement B', ar: 'عزاء B', color: '#5A5A5A' },
  { code: 'E', ku: 'فەرمی', en: 'Official Duty', ar: 'مهمة رسمية', color: '#3B6FC9' },
  { code: 'M', ku: 'هاوسەرگیری', en: 'Marriage Leave', ar: 'اجازة زواج', color: '#D9A0A6' },
  { code: 'F', ku: 'بیرچوونی پەنجەمۆر', en: 'Forgotten Fingerprint', ar: 'نسيان بصمة', color: '#8A8A8A' },
  { code: 'B', ku: 'باوکانە', en: 'Paternity Leave', ar: 'اجازة أبوة', color: '#5BB8E0' },
  { code: 'HR', ku: 'مۆڵەتی کاتژمێری', en: 'Hourly Leave', ar: 'إجازة ساعية', color: '#004C81', unit: 'hour' },
  { code: 'HJ', ku: 'حەج', en: 'Hajj Leave', ar: 'اجازة حج', color: '#C99A2E' },
  { code: 'UM', ku: 'عومرە', en: 'Umrah Leave', ar: 'اجازة عمرة', color: '#E0B65C' },
];

let CUSTOM_TYPES: LeaveType[] = [];
export function setCustomLeaveTypes(list: unknown) {
  CUSTOM_TYPES = Array.isArray(list) ? (list as LeaveType[]) : [];
}
export function allLeaveTypesRaw(): LeaveType[] {
  const byCode: Record<string, LeaveType> = {};
  LEAVE_TYPES.forEach((t) => (byCode[t.code] = { ...t }));
  CUSTOM_TYPES.forEach((t) => (byCode[t.code] = { ...(byCode[t.code] || {}), ...t }));
  return Object.values(byCode);
}
export function allLeaveTypes() {
  return allLeaveTypesRaw().filter((t) => !t.hidden);
}
export function leaveTypeOf(code: string) {
  return allLeaveTypesRaw().find((x) => x.code === code);
}
export function leaveTypeLabel(code: string, lang: Lang) {
  const t = leaveTypeOf(code);
  return t ? TL(lang, t) : code;
}
export function leaveTypeColor(code: string) {
  return leaveTypeOf(code)?.color ?? '#8A8A8A';
}
export function leaveTypeTextColor(code: string, onFill?: boolean) {
  const t = leaveTypeOf(code);
  if (t?.textColor) return t.textColor;
  return onFill ? '#FFFFFF' : t ? t.color : '#8A8A8A';
}

export const HOURLY_CODE = 'HR';
export const HOURS_PER_DAY = 8;
export const INITIAL_PASSWORD = 'Kar2026';

// ---------------------------------------------------------------------------
// Holidays and working days
// ---------------------------------------------------------------------------

let HOLIDAYS: Record<string, { name: string; only: string[] | null }> = {};
export function setHolidays(list: unknown) {
  const m: typeof HOLIDAYS = {};
  (Array.isArray(list) ? (list as Holiday[]) : []).forEach((h) => {
    if (h && h.date) m[h.date] = { name: h.name || '', only: h.only || null };
  });
  HOLIDAYS = m;
}
export function isHoliday(d: Date | string, empId?: string | null) {
  const iso = typeof d === 'string' ? d : isoLocal(d);
  const h = HOLIDAYS[iso];
  if (!h) return false;
  // A holiday granted to specific people applies only to them.
  if (h.only && Array.isArray(h.only) && h.only.length) return empId ? h.only.includes(empId) : false;
  return true;
}
export function holidayName(d: Date | string) {
  const v = HOLIDAYS[typeof d === 'string' ? d : isoLocal(d)];
  return v && v.name ? v.name : null;
}

export function shiftOf(emp?: Person | null) {
  const v = String((emp && emp.shiftType) || '').trim().toUpperCase();
  return v === 'D' || v === 'N' || v === '8' ? v : '8';
}
/** What a day is for this person before any leave: "8", "D", "N", "R" (rota rest) or "" (weekend). */
export function baseCell(emp: Person | null | undefined, day: Date) {
  const shift = shiftOf(emp);
  const dow = day.getDay();
  if (shift === '8') return dow === 5 || dow === 6 ? '' : '8';
  const ep = Math.floor(day.getTime() / 86400000);
  const off = shift === 'N' ? 3 : 0;
  return ((ep + off) % 14 + 14) % 14 < 7 ? shift : 'R';
}
export function computeCell(emp: Person, day: Date, ov: Record<string, string>) {
  const iso = isoLocal(day);
  if (isHoliday(day, emp && emp.id)) return 'HD';
  const o = ov[emp.id + '|' + iso];
  if (o) return o;
  return baseCell(emp, day);
}
export function isWorkingDay(emp: Person | null | undefined, day: Date) {
  const b = baseCell(emp, day);
  return b !== '' && b !== 'R';
}
/** Whether a day inside a leave period costs anything. Sick leave counts every day. */
export function countsAsLeaveDay(emp: Person | null | undefined, day: Date, code: string) {
  if (isHoliday(day, emp && emp.id)) return false;
  if (code === 'S') return true;
  const dow = day.getDay();
  if (dow === 5 || dow === 6) return false;
  return isWorkingDay(emp, day);
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

export const DEFAULT_POLICY: Policy = {
  balanceMode: 'unlimited',
  daysPerYear: 0,
  allowHalfDay: false,
  requiresReason: false,
  requiresDocument: false,
  countWeekends: false,
  allowNegative: false,
  accrual: false,
  hoursPerDay: 8,
  maxPerRequest: 0,
  maxPerMonth: 0,
  onceOnly: false,
  tier1: 2,
  tier2: 5,
  limitBasis: 'month',
  doctorApproval: false,
  doctorOrder: 1,
  allowOverBalance: false,
  overFreeDays: 0,
  overApprovers: 3,
  carryover: false,
  carryoverMax: 0,
  approver2On: true,
  approver2Id: null,
  approver3On: true,
  approver3Id: null,
  lifetimeOnce: false,
  carryoverDeadline: false,
  carryoverDeadlineMonths: 3,
};

export const BUILTIN_POLICY: Record<string, Policy> = {
  HR: { balanceMode: 'unlimited', unit: 'hour', hoursPerDay: 8, requiresReason: true, tier1: 0, tier2: 0 },
  P: {
    balanceMode: 'limited', daysPerYear: 24, allowHalfDay: true, accrual: true,
    carryover: true, carryoverMax: 5, maxPerRequest: 0, maxPerMonth: 0, requiresReason: false,
    tier1: 5, tier1LowBalance: 2, tier2: 0, approver2On: true, approver2Role: 'gd', approver3On: false, limitBasis: 'month',
    carryoverDeadline: false, carryoverDeadlineMonths: 3,
    allowOverBalance: false,
  },
  U: {
    balanceMode: 'limited', daysPerYear: 30, requiresReason: true,
    accrual: false, carryover: false, maxPerRequest: 0, maxPerMonth: 0, limitBasis: 'year',
    tier1: 2, tier2: 2, allowOverBalance: false,
  },
  S: {
    balanceMode: 'limited', daysPerYear: 30, requiresReason: true, requiresDocument: true,
    countWeekends: true, allowOverBalance: true, overFreeDays: 1, overApprovers: 4,
  },
  CA: { balanceMode: 'unlimited', maxPerRequest: 4, tier1: 0 },
  CB: { balanceMode: 'unlimited', maxPerRequest: 1, tier1: 0 },
  E: { balanceMode: 'unlimited', tier1: 0 },
  B: { balanceMode: 'unlimited', maxPerRequest: 2, tier1: 0 },
  M: {
    balanceMode: 'limited', daysPerYear: 5, maxPerRequest: 0, onceOnly: false,
    tier1: 5, tier2: 5, allowOverBalance: true, overFreeDays: 5, overApprovers: 3,
  },
  F: { balanceMode: 'limited', daysPerYear: 24, maxPerMonth: 2, maxPerRequest: 1, tier1: 0 },
  HJ: {
    balanceMode: 'limited', daysPerYear: 20, maxPerRequest: 20,
    lifetimeOnce: true, countWeekends: true, accrual: false, carryover: false, tier1: 0,
  },
  UM: {
    balanceMode: 'limited', daysPerYear: 5, maxPerRequest: 5,
    lifetimeOnce: true, countWeekends: false, accrual: false, carryover: false, tier1: 0,
  },
};

export type Policies = Record<string, Policy>;

/** Company default, then the built-in rule, then company settings, then this person's own. */
export function policyFor(code: string, policies: Policies | undefined, emp?: Person | null): Policy {
  const base = { ...DEFAULT_POLICY, ...(BUILTIN_POLICY[code] || {}), ...((policies || {})[code] || {}) };
  const own = emp && emp.policies && emp.policies[code];
  return own ? { ...base, ...own } : base;
}

export function typeAllowedFor(emp: Person | null | undefined, code: string) {
  const off = emp && emp.disabledTypes;
  return !(Array.isArray(off) && off.includes(code));
}
export function typesFor(emp: Person | null | undefined) {
  return allLeaveTypes().filter((t) => typeAllowedFor(emp, t.code));
}

// ---------------------------------------------------------------------------
// Leave years (21 Dec -> 20 Dec) and payroll periods (21st -> 20th)
// ---------------------------------------------------------------------------

export const LEAVE_YEAR_START_DAY = 21;
export function leaveYearOf(d: Date | string): number {
  const dt = typeof d === 'string' ? parseLocalDate(d) : d;
  return dt.getMonth() === 11 && dt.getDate() >= LEAVE_YEAR_START_DAY ? dt.getFullYear() + 1 : dt.getFullYear();
}
export function periodOf(dateStr: string) {
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return null;
  const shifted = new Date(d.getFullYear(), d.getMonth() + (d.getDate() >= LEAVE_YEAR_START_DAY ? 1 : 0), 1);
  return shifted.getFullYear() + '-' + String(shifted.getMonth() + 1).padStart(2, '0');
}
/** The days of payroll month "YYYY-MM": the 21st of the month before to the 20th. */
export function getPayPeriodDays(month: string) {
  const [y, m] = month.split('-').map(Number);
  const sd = new Date(y, m - 2, 21);
  const ed = new Date(y, m - 1, 20);
  const days: Date[] = [];
  const cur = new Date(sd);
  while (cur <= ed) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}
export function currentPayPeriod(d?: Date) {
  const dt = d || new Date();
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  const shifted = day >= 21 ? (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }) : { y, m };
  return shifted.y + '-' + String(shifted.m).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Cost of a request
// ---------------------------------------------------------------------------

export function leaveDaysCharged(lv: Pick<Leave, 'from' | 'to' | 'halfDay'> & { type?: string }, emp: Person | null | undefined, _policy?: Policy) {
  if (!lv || !lv.from || !lv.to || !emp) return 0;
  const end = parseLocalDate(lv.to);
  const d = parseLocalDate(lv.from);
  let n = 0;
  let guard = 0;
  if (end < d) return 0;
  while (d <= end && guard++ < 400) {
    if (countsAsLeaveDay(emp, d, lv.type || '')) n++;
    d.setDate(d.getDate() + 1);
  }
  if (lv.halfDay) return n > 0 ? 0.5 : 0;
  return n;
}

export function usedInPeriod(emp: Person, code: string, lvs: Leave[], _policies: Policies, period: string) {
  let total = 0;
  (lvs || []).forEach((l) => {
    if (!emp || l.empId !== emp.id || l.type !== code || l.status === 'rejected') return;
    if (!l.from || !l.to) return;
    const end = parseLocalDate(l.to);
    const d = parseLocalDate(l.from);
    let guard = 0;
    while (d <= end && guard++ < 400) {
      if (periodOf(isoLocal(d)) === period && countsAsLeaveDay(emp, d, code)) total += l.halfDay ? 0.5 : 1;
      d.setDate(d.getDate() + 1);
    }
  });
  return round1(total);
}

export function daysPerPeriod(from: string, to: string, emp: Person, _pol: Policy, halfDay: boolean, code: string) {
  const out: Record<string, number> = {};
  if (!from || !to || !emp) return out;
  const end = parseLocalDate(to);
  const d = parseLocalDate(from);
  let guard = 0;
  while (d <= end && guard++ < 400) {
    if (countsAsLeaveDay(emp, d, code)) {
      const per = periodOf(isoLocal(d))!;
      out[per] = (out[per] || 0) + (halfDay ? 0.5 : 1);
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function alreadyTakenOnce(emp: Person, code: string, lvs: Leave[]) {
  const reopenedAt = emp && emp.onceOnlyOverride && emp.onceOnlyOverride[code];
  return (lvs || []).some(
    (l) =>
      emp &&
      l.empId === emp.id &&
      l.type === code &&
      l.status !== 'rejected' &&
      (!reopenedAt || String(l.from || '') > reopenedAt || String(l.createdAt || '') > reopenedAt),
  );
}

export function overlappingLeave(lvs: Leave[], empId: string | undefined, from: string, to: string, ignoreId?: string) {
  if (!from || !to) return [];
  return (lvs || []).filter(
    (l) => l.empId === empId && l.id !== ignoreId && l.status !== 'rejected' && l.from && l.to && l.from <= to && l.to >= from,
  );
}

// ---------------------------------------------------------------------------
// Hourly leave: every 8 hours come off the regular balance as one day
// ---------------------------------------------------------------------------

export function hoursPerDayFor(policies: Policies, emp?: Person | null) {
  const v = Number(policyFor(HOURLY_CODE, policies, emp).hoursPerDay);
  return v > 0 ? v : HOURS_PER_DAY;
}
export function hourlyByPeriod(empId: string, lvs: Leave[]) {
  const map: Record<string, number> = {};
  (lvs || []).forEach((l) => {
    if (l.empId !== empId || l.type !== HOURLY_CODE || l.status !== 'approved') return;
    const per = periodOf(l.from);
    if (!per) return;
    map[per] = (map[per] || 0) + (Number(l.hours) || 0);
  });
  return Object.keys(map)
    .sort()
    .map((per) => ({ period: per, hours: map[per] }));
}
export function hourlyHoursInYear(empId: string | undefined, lvs: Leave[], year: number) {
  return (lvs || []).reduce((n, l) => {
    if (l.empId !== empId || l.type !== HOURLY_CODE || l.status !== 'approved') return n;
    if (leaveYearOf(l.from) !== year) return n;
    return n + (Number(l.hours) || 0);
  }, 0);
}
export function hourlyDaysCharged(empId: string | undefined, lvs: Leave[], year: number, _asOf: Date | null, policies: Policies, emp?: Person | null) {
  const total = hourlyHoursInYear(empId, lvs, year);
  if (total <= 0) return 0;
  return total / hoursPerDayFor(policies, emp);
}
export function hourlyEnabledFor(emp?: Person | null) {
  return allLeaveTypes().some((t) => t.code === HOURLY_CODE) && typeAllowedFor(emp, HOURLY_CODE);
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

export function usageIn(emp: Person, code: string, lvs: Leave[], policies: Policies, year: number) {
  let used = 0;
  let pending = 0;
  (lvs || []).forEach((l) => {
    if (!emp || l.empId !== emp.id || l.type !== code || !l.from) return;
    if (leaveYearOf(l.from) !== year) return;
    const days = leaveDaysCharged(l, emp, policyFor(code, policies, emp));
    if (l.status === 'approved') used += days;
    else if (l.status === 'pending') pending += days;
  });
  return { used, pending };
}

export function entitlementFor(emp: Person, code: string, policies: Policies) {
  const pol = policyFor(code, policies, emp);
  if (pol.balanceMode !== 'limited') return null;
  const own = emp && emp.entitlements && emp.entitlements[code];
  if (own != null && own !== '') return Number(own) || 0;
  return Number(pol.daysPerYear) || 0;
}

export function openingFor(emp: Person, code: string) {
  const ob = emp && emp.openingBalance && emp.openingBalance[code];
  if (!ob || ob.days == null || ob.year == null) return null;
  const cur = emp.entitlements && emp.entitlements[code];
  const curNone = cur == null || cur === '';
  const wasNone = ob.ent == null || ob.ent === '';
  const same = (curNone && wasNone) || (!curNone && !wasNone && Number(cur) === Number(ob.ent));
  return same ? { year: Number(ob.year), days: Number(ob.days) } : null;
}

const CARRY_LOOKBACK = 6;

export function accrualMonthsElapsed(year: number, asOf: Date | null | undefined, hireDate?: string) {
  let start = new Date(year - 1, 11, LEAVE_YEAR_START_DAY);
  if (hireDate) {
    const h = parseLocalDate(hireDate);
    if (h && !isNaN(h.getTime())) {
      const hStart = new Date(h.getFullYear(), h.getMonth() - (h.getDate() < LEAVE_YEAR_START_DAY ? 1 : 0), LEAVE_YEAR_START_DAY);
      if (hStart > start) start = hStart;
    }
  }
  const d = asOf || new Date();
  if (d < start) return 0;
  let months = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
  if (d.getDate() < LEAVE_YEAR_START_DAY) months -= 1;
  return Math.max(0, Math.min(12, months + 1));
}

export type Balance = {
  entitlement: number | null;
  base: number | null;
  carryIn: number;
  carryExpired?: boolean;
  carryLost?: number;
  carryDeadline?: Date | null;
  accrued: number | null;
  available: number | null;
  monthsElapsed: number;
  perMonth?: number;
  hourlyDays?: number;
  used: number;
  pending: number;
  remaining: number | null;
  opening?: boolean;
  per: number;
  hourlyOn: boolean;
  hours: number | null;
};

export function balanceFor(emp: Person, code: string, lvs: Leave[], policies: Policies, year: number, asOf?: Date | null): Balance {
  const pol = policyFor(code, policies, emp);
  const entBase = entitlementFor(emp, code, policies);
  const per = hoursPerDayFor(policies, emp);
  const hourlyOn = code === 'P' && (hourlyEnabledFor(emp) || hourlyHoursInYear(emp && emp.id, lvs, year) > 0);
  if (entBase == null) {
    const u = usageIn(emp, code, lvs, policies, year);
    return {
      entitlement: null, base: null, carryIn: 0, accrued: null, available: null, monthsElapsed: 0,
      used: round1(u.used), pending: round1(u.pending), remaining: null, per, hourlyOn,
      hours: code === HOURLY_CODE ? hourlyHoursInYear(emp && emp.id, lvs, year) : null,
    };
  }
  const ob = openingFor(emp, code);
  const openingNow = !!(ob && ob.year === year);
  const base = openingNow ? ob!.days : entBase;
  let carry = 0;
  const hireYear = emp && emp.hireDate ? leaveYearOf(emp.hireDate) : null;
  let start = Math.max(hireYear != null ? hireYear : year, year - CARRY_LOOKBACK);
  if (ob && ob.year <= year) start = Math.max(start, ob.year);
  for (let y = start; y < year; y++) {
    const u = usageIn(emp, code, lvs, policies, y);
    const baseY = ob && ob.year === y ? ob.days : entBase;
    const closing = baseY + carry - u.used - (code === 'P' ? hourlyDaysCharged(emp && emp.id, lvs, y, null, policies, emp) : 0);
    carry = pol.carryover ? Math.min(Math.max(0, closing), Number(pol.carryoverMax) || 0) : 0;
  }
  const u = usageIn(emp, code, lvs, policies, year);
  const hourlyDays = code === 'P' ? hourlyDaysCharged(emp && emp.id, lvs, year, asOf || null, policies, emp) : 0;
  const used = u.used + hourlyDays;
  const entitlement = r3(base + carry);

  let carryExpired = false;
  let carryLost = 0;
  let carryDeadline: Date | null = null;
  if (carry > 0 && pol.carryoverDeadline) {
    const asOfDate = asOf || new Date();
    const months = Number(pol.carryoverDeadlineMonths) || 3;
    carryDeadline = new Date(year - 1, 11, LEAVE_YEAR_START_DAY);
    carryDeadline.setMonth(carryDeadline.getMonth() + months);
    if (asOfDate > carryDeadline) {
      carryExpired = true;
      carryLost = carry;
      carry = 0;
    }
  }
  const accrualOn = !!pol.accrual;
  const monthsElapsed = accrualOn ? accrualMonthsElapsed(year, asOf, emp && emp.hireDate) : 12;
  const perMonth = accrualOn ? round1((Number(pol.daysPerYear) || 0) / 12) : 0;
  const accrued = !accrualOn ? base : Math.max(0, r3(base - round1(perMonth * (12 - monthsElapsed))));
  const available = r3(accrued + carry - used);

  return {
    entitlement,
    base,
    carryIn: r3(carry),
    carryExpired,
    carryLost: r3(carryLost),
    carryDeadline,
    accrued: r3(accrued),
    available,
    monthsElapsed,
    perMonth,
    hourlyDays: r3(hourlyDays),
    used: r3(used),
    pending: round1(u.pending),
    remaining: r3(entitlement - used),
    opening: openingNow,
    per,
    hourlyOn,
    hours: code === HOURLY_CODE ? hourlyHoursInYear(emp && emp.id, lvs, year) : null,
  };
}

/** A balance as the web app writes it: days, or "days.hours" when hourly leave is in play. */
export function fmtBal(v: number | null | undefined, b?: Pick<Balance, 'per' | 'hourlyOn'> | null) {
  if (v == null) return '∞';
  const n = Number(v);
  if (!isFinite(n)) return '∞';
  const per = b && b.per > 0 ? b.per : HOURS_PER_DAY;
  if (!(b && b.hourlyOn) || !Number.isInteger(per)) return String(round1(n));
  const abs = Math.abs(n);
  const hrs = Math.round(abs * per);
  const d = Math.floor(hrs / per);
  const h = hrs - d * per;
  return (n < 0 && hrs > 0 ? '-' : '') + d + (h ? '.' + h : '');
}

/** "empId|YYYY-MM-DD" -> leave type code, for every approved leave day. */
export function leaveCells(lvs: Leave[]) {
  const out: Record<string, string> = {};
  (lvs || []).forEach((l) => {
    if (l.status !== 'approved' || !l.from || !l.to) return;
    const end = parseLocalDate(l.to);
    const d = parseLocalDate(l.from);
    let guard = 0;
    while (d <= end && guard++ < 400) {
      out[l.empId + '|' + isoLocal(d)] = l.type;
      d.setDate(d.getDate() + 1);
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Units (directorate -> department -> section)
// ---------------------------------------------------------------------------

export function unitById(units: Unit[], id?: string | null) {
  return (units || []).find((u) => u.id === id) || null;
}
export function childUnits(units: Unit[], parentId: string | null) {
  return (units || []).filter((u) => (u.parentId || null) === (parentId || null));
}
export function unitPath(units: Unit[], id?: string | null) {
  const out: Unit[] = [];
  let cur = unitById(units, id);
  let guard = 0;
  while (cur && guard++ < 10) {
    out.unshift(cur);
    cur = cur.parentId ? unitById(units, cur.parentId) : null;
  }
  return out;
}
export function unitSubtree(units: Unit[], id: string) {
  const out: string[] = [];
  const stack = [id];
  let guard = 0;
  while (stack.length && guard++ < 500) {
    const cur = stack.pop();
    if (!cur) continue;
    out.push(cur);
    childUnits(units, cur).forEach((c) => stack.push(c.id));
  }
  return out;
}
export function deptName(emp: Person | null | undefined, depts: Unit[]) {
  const d = unitById(depts, emp && emp.dept);
  return d ? d.name : '—';
}

// ---------------------------------------------------------------------------
// Roles and who may see whose leave
// ---------------------------------------------------------------------------

export const FULL_ROLES: Role[] = ['superadmin', 'gm', 'hrmanager'];
export const ADMIN_ROLES: Role[] = ['superadmin', 'gm', 'hrmanager'];
export const DEPT_ROLES: Role[] = ['deptmanager', 'deptadmin'];

export function visibleDeptsFor(emp: Person | null, role: Role, units: Unit[]) {
  if (FULL_ROLES.includes(role)) return null;
  if (!emp) return [];
  if (emp.canSeeTeamLeave === false) return [];
  const extra = Array.isArray(emp.visibleDepts) ? emp.visibleDepts : [];
  const path = emp.dept ? unitPath(units || [], emp.dept) : [];
  const top = path.length ? path[0].id : emp.dept;
  const directorate = top ? unitSubtree(units || [], top) : [];
  return [...new Set([emp.dept, ...directorate, ...extra].filter(Boolean) as string[])];
}
function scopeFor(viewer: Person, units: Unit[]) {
  const ids = new Set<string>();
  (units || []).filter((u) => u.managerId === viewer.id).forEach((u) => unitSubtree(units, u.id).forEach((x) => ids.add(x)));
  return ids;
}
export function canViewLeaveOf(viewer: Person | null, role: Role, target: Person | undefined, units: Unit[]) {
  if (FULL_ROLES.includes(role)) return true;
  if (!viewer || !target) return false;
  if (viewer.id === target.id) return true;
  const scope = scopeFor(viewer, units);
  if (target.dept && scope.has(target.dept)) return true;
  const allowed = visibleDeptsFor(viewer, role, units);
  if (allowed === null) return true;
  return !!target.dept && allowed.includes(target.dept);
}

export function watchersFor(emp: Person | null | undefined, units: Unit[]) {
  const out = new Set<string>((emp && emp.watchers) || []);
  if (emp && emp.dept) unitPath(units, emp.dept).forEach((u) => (u.watchers || []).forEach((w) => out.add(w)));
  if (emp) out.delete(emp.id);
  return [...out];
}
export function watchesEmp(viewerId: string | undefined, emp: Person | undefined, units: Unit[]) {
  return !!viewerId && watchersFor(emp, units).includes(viewerId);
}

// Permissions: which parts of the company a role reaches. Only what the
// employee app uses is ported (the timesheet reach).
const PERM_TYPES: Record<string, 'bool' | 'scope'> = { dashboard: 'bool', timesheet: 'scope', viewBalance: 'scope' };
const DEFAULT_ROLE_PERMS: Record<string, Record<string, boolean | string>> = {
  employee: { dashboard: true },
  doctor: { dashboard: false },
  secadmin: { dashboard: true, timesheet: 'unit', viewBalance: 'unit' },
  secmanager: { dashboard: true, timesheet: 'unit', viewBalance: 'unit' },
  deptadmin: { dashboard: true, timesheet: 'unit', viewBalance: 'unit' },
  deptmanager: { dashboard: true, timesheet: 'unit', viewBalance: 'unit' },
  director: { dashboard: true, timesheet: 'unit', viewBalance: 'unit' },
  hrmanager: { dashboard: true, timesheet: 'all', viewBalance: 'all' },
  gm: { dashboard: true, timesheet: 'all', viewBalance: 'all' },
  staffadmin: { dashboard: true },
  hradmin: { dashboard: true },
  superadmin: { dashboard: true, timesheet: 'all', viewBalance: 'all' },
};
export function permFor(role: Role, perms: Record<string, Record<string, unknown>> | undefined, key: string): boolean | string {
  const type = PERM_TYPES[key] || 'bool';
  const saved = (perms || {})[role];
  const wasSet = !!saved && Object.prototype.hasOwnProperty.call(saved, key);
  if (role === 'superadmin') return type === 'bool' ? true : 'all';
  if (!wasSet && ADMIN_ROLES.includes(role)) return type === 'bool' ? true : 'all';
  const table = (wasSet ? saved : DEFAULT_ROLE_PERMS[role] || {}) as Record<string, unknown>;
  const v = table[key];
  if (type === 'bool') return v === true;
  return (v as string) || 'deny';
}
export function scopedEmpIds(scope: string, me: Person | null, emps: Person[], depts: Unit[]): Set<string> | null {
  if (scope === 'all') return null;
  if (!scope || scope === 'deny' || !me) return new Set();
  if (scope === 'subs') return new Set((emps || []).filter((e) => e.approverId === me.id).map((e) => e.id));
  const adminUnits = Array.isArray(me.adminUnits) ? me.adminUnits : [];
  if (scope === 'dir') {
    const own = (depts || []).filter((u) => u.managerId === me.id).map((u) => u.id);
    const start = own.length ? own : me.dept ? [me.dept] : [];
    const tops = new Set(start.map((id) => {
      const p = unitPath(depts, id);
      return p.length ? p[0].id : id;
    }));
    const ids = new Set<string>();
    tops.forEach((t) => unitSubtree(depts, t).forEach((u) => ids.add(u)));
    adminUnits.forEach((r) => unitSubtree(depts, r).forEach((u) => ids.add(u)));
    return new Set((emps || []).filter((e) => e.dept && ids.has(e.dept)).map((e) => e.id));
  }
  const own = (depts || []).filter((u) => u.managerId === me.id).map((u) => u.id);
  const roots = own.length ? own : me.dept ? [me.dept] : [];
  const ids = new Set<string>();
  [...roots, ...adminUnits].forEach((r) => unitSubtree(depts, r).forEach((u) => ids.add(u)));
  const out = new Set((emps || []).filter((e) => e.dept && ids.has(e.dept)).map((e) => e.id));
  (emps || []).forEach((e) => {
    if (e.approverId === me.id) out.add(e.id);
  });
  return out;
}
export function empsWithin(scope: string, me: Person | null, emps: Person[], depts: Unit[]) {
  const ids = scopedEmpIds(scope, me, emps, depts);
  return ids === null ? emps : (emps || []).filter((e) => ids.has(e.id));
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function findMyRecord(emps: Person[], cu: { id?: string; email?: string } | null) {
  if (!cu) return null;
  const byId = (emps || []).find((e) => e.id === cu.id);
  if (byId) return byId;
  const mail = String(cu.email || '').trim().toLowerCase();
  if (!mail) return null;
  return (
    (emps || []).find((e) => String(e.email || '').trim().toLowerCase() === mail) ||
    (emps || []).find((e) => (e.altEmails || []).includes(mail)) ||
    null
  );
}
export function isSuspended(rec?: Person | null) {
  return !!(rec && rec.disabled);
}
export function mustChangePassword(rec?: Person | null) {
  return !!(rec && rec.mustChangePassword);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function notifReadBy(n: Notif, cu: Person | null) {
  if (!n) return true;
  const id = cu && cu.id;
  if (id && n.readBy && n.readBy[id]) return true;
  return !!(n.read && id && n.to === 'person:' + id);
}
export function notifVisible(n: Notif, role: Role, cu: Person | null) {
  if (role === 'doctor') return n.leaveType === 'S' && n.forDoctor === true;
  const to = n.to || 'all';
  if (n.target === 'announcements') return !!(cu && cu.id && to === 'person:' + cu.id);
  if (to === 'all') return true;
  if (FULL_ROLES.includes(role)) return true;
  if (cu?.id && to === 'person:' + cu.id) return true;
  if (cu?.dept && to === 'depthead:' + cu.dept && DEPT_ROLES.includes(role)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Who signs a request
// ---------------------------------------------------------------------------

function teamApproverFor(emp: Person, units: Unit[]) {
  if (!emp || !emp.dept) return null;
  const path = unitPath(units, emp.dept);
  for (let i = path.length - 1; i >= 0; i--) {
    const a = path[i].approverId;
    if (a && a !== emp.id) return a;
  }
  return null;
}
function teamSecondApproverFor(emp: Person, units: Unit[]) {
  if (!emp || !emp.dept) return null;
  const path = unitPath(units, emp.dept);
  for (let i = path.length - 1; i >= 0; i--) {
    const u = path[i];
    if (u.approverId || u.approver2Id) {
      if (Number(u.approvalSteps) === 2 && u.approver2Id && u.approver2Id !== emp.id) return u.approver2Id;
      return null;
    }
  }
  return null;
}

export type Approver = { id: string; name: string; source?: string; unit?: string };

/** The line manager: the person's own approver, then their unit's, then the unit heads upward, then HR. */
export function resolveApprover(cu: { id?: string; email?: string } | null, emps: Person[], admins: Person[], units: Unit[]): Approver | null {
  const me = findMyRecord(emps, cu);
  const lookup = (id: string) => (emps || []).find((e) => e.id === id) || (admins || []).find((a) => a.id === id);
  if (me && me.approverId) {
    const a = lookup(me.approverId);
    if (a && a.id !== me.id) return { id: a.id, name: a.fullName || '—', source: 'manual' };
  }
  if (me && me.dept) {
    const teamId = teamApproverFor(me, units);
    const ta = teamId && lookup(teamId);
    if (ta) return { id: ta.id, name: ta.fullName || '—', source: 'team' };
    const path = unitPath(units, me.dept);
    for (let i = path.length - 1; i >= 0; i--) {
      const mgrId = path[i].managerId;
      if (!mgrId || mgrId === me.id) continue;
      const m = emps.find((e) => e.id === mgrId);
      if (m) return { id: m.id, name: m.fullName || '—', source: path[i].kind, unit: path[i].name };
    }
  }
  const list = admins || [];
  const hr = list.find((a) => a.role === 'hrmanager') || list.find((a) => a.role === 'gm') || list.find((a) => a.role === 'superadmin');
  if (hr) return { id: hr.id, name: hr.fullName || '—', source: 'hr' };
  return null;
}
function roleHolder(emps: Person[], admins: Person[], role: Role) {
  const a = (admins || []).find((x) => x.role === role);
  if (a) return { id: a.id, name: a.fullName || '—' };
  const e = (emps || []).find((x) => x.role === role || (role === 'doctor' && x.profileType === 'doctor'));
  return e ? { id: e.id, name: e.fullName || '—' } : null;
}
export const hrDirectorOf = (emps: Person[], admins: Person[]) => roleHolder(emps, admins, 'hrmanager');
export const doctorOf = (emps: Person[], admins: Person[]) => roleHolder(emps, admins, 'doctor');
export const generalDirectorOf = (emps: Person[], admins: Person[]) => roleHolder(emps, admins, 'gm');

export function stageLabel(stage: string, lang: Lang) {
  return stage === 'doctor'
    ? T(lang, 'دکتۆر', 'Doctor', 'الطبيب')
    : stage === 'hr'
      ? T(lang, 'بەڕێوەبەری HR', 'HR Director', 'مدير الموارد البشرية')
      : stage === 'gd'
        ? T(lang, 'بەڕێوەبەری گشتی', 'General Director', 'المدير العام')
        : stage === 'team2'
          ? T(lang, 'ئەپروڤەری دووەم', 'Second approver', 'الموافق الثاني')
          : T(lang, 'بەڕێوەبەری راستەوخۆ', 'Line manager', 'المدير المباشر');
}

function limitTotalFor(emp: Person, type: string, from: string, to: string, halfDay: boolean, days: number, lvs: Leave[], policies: Policies) {
  if (!emp || !from || !to) return Number(days) || 0;
  const pol = policyFor(type, policies, emp);
  if (pol.limitBasis === 'year') {
    const u = usageIn(emp, type, lvs, policies, leaveYearOf(from));
    return round1(u.used + u.pending + (Number(days) || 0));
  }
  const split = daysPerPeriod(from, to, emp, pol, halfDay, type);
  let max = 0;
  Object.keys(split).forEach((per) => {
    max = Math.max(max, usedInPeriod(emp, type, lvs, policies, per) + split[per]);
  });
  return Math.max(max, Number(days) || 0);
}

function approverCountFor(emp: Person, type: string, from: string, to: string, halfDay: boolean, days: number, lvs: Leave[], policies: Policies, exceeds: boolean) {
  if (type === HOURLY_CODE) return 1;
  const pol = policyFor(type, policies, emp);
  let t1 = Number(pol.tier1) || 0;
  const t2 = Number(pol.tier2) || 0;
  if (type === 'P' && pol.tier1LowBalance != null && emp && from) {
    const year = leaveYearOf(parseLocalDate(from));
    const asOf = parseLocalDate(from);
    const available = Number(balanceFor(emp, type, lvs, policies, year, asOf).available) || 0;
    if (available < t1) t1 = Number(pol.tier1LowBalance) || 0;
  }
  if (exceeds && pol.allowOverBalance && days > (Number(pol.overFreeDays) || 0)) {
    return Math.min(3, Math.max(1, Number(pol.overApprovers) || 3));
  }
  const total = limitTotalFor(emp, type, from, to, halfDay, days, lvs, policies);
  if (t1 <= 0) return 1;
  if (total <= t1) return 1;
  if (t2 <= 0) return 2;
  if (total <= t2) return 2;
  return 3;
}

const SICK_GD_THRESHOLD = 10;

export function approvalChainFor(o: {
  emp: Person;
  type: string;
  from: string;
  to: string;
  halfDay: boolean;
  days: number;
  lvs: Leave[];
  policies: Policies;
  emps: Person[];
  admins: Person[];
  depts: Unit[];
  exceeds: boolean;
}): ChainStep[] {
  const { emp, type, from, to, halfDay, days, lvs, policies, emps, admins, depts, exceeds } = o;
  const out: ChainStep[] = [];
  const mgr = emp ? resolveApprover({ id: emp.id }, emps, admins, depts) : null;
  if (mgr) out.push({ id: mgr.id, name: mgr.name, stage: 'manager' });
  const t2 = emp ? teamSecondApproverFor(emp, depts) : null;
  if (t2 && !out.some((x) => x.id === t2)) {
    const p = (emps || []).find((x) => x.id === t2) || (admins || []).find((x) => x.id === t2);
    if (p) out.push({ id: p.id, name: p.fullName || '—', stage: 'team2' });
  }
  const n = approverCountFor(emp, type, from, to, halfDay, days, lvs, policies, exceeds);
  const pol = policyFor(type, policies, emp);
  const needsDoctor = type === 'S' || pol.doctorApproval;

  // Sick leave: doctor -> line manager -> (GD when over 10 days) -> HR Director.
  if (type === 'S') {
    const dayCount = Number(days) || 0;
    if (dayCount > SICK_GD_THRESHOLD) {
      const g = generalDirectorOf(emps, admins);
      if (g && !out.some((x) => x.id === g.id)) out.push({ id: g.id, name: g.name, stage: 'gd' });
    }
    const h = hrDirectorOf(emps, admins);
    if (h && !out.some((x) => x.id === h.id)) out.push({ id: h.id, name: h.name, stage: 'hr' });
    const d = doctorOf(emps, admins);
    if (d && !out.some((x) => x.id === d.id)) {
      const raw = pol.doctorOrder == null ? 1 : pol.doctorOrder;
      const entry = { id: d.id, name: d.name, stage: 'doctor' };
      if (raw === 'last' || Number(raw) > out.length) out.push(entry);
      else out.splice(Math.max(1, Number(raw) || 1) - 1, 0, entry);
    }
    return out;
  }

  const namedApprover = (id?: string | null) => {
    if (!id) return null;
    const e = (emps || []).find((x) => x.id === id) || (admins || []).find((x) => x.id === id);
    return e ? { id: e.id, name: e.fullName || '—' } : null;
  };
  if (n >= 2 && pol.approver2On !== false) {
    const fallback2 = pol.approver2Role === 'gd' ? generalDirectorOf(emps, admins) : hrDirectorOf(emps, admins);
    const picked = namedApprover(pol.approver2Id) || fallback2;
    if (picked && !out.some((x) => x.id === picked.id)) {
      out.push({ id: picked.id, name: picked.name, stage: pol.approver2Role === 'gd' ? 'gd' : 'second' });
    }
  }
  if (n >= 3 && pol.approver3On !== false) {
    const picked = namedApprover(pol.approver3Id) || generalDirectorOf(emps, admins);
    if (picked && !out.some((x) => x.id === picked.id)) out.push({ id: picked.id, name: picked.name, stage: 'third' });
  }
  if (needsDoctor) {
    const d = doctorOf(emps, admins);
    if (d && !out.some((x) => x.id === d.id)) {
      const raw = pol.doctorOrder;
      const entry = { id: d.id, name: d.name, stage: 'doctor' };
      if (raw === 'last' || Number(raw) > out.length) out.push(entry);
      else out.splice(Math.max(1, Number(raw) || 2) - 1, 0, entry);
    }
  }
  return out;
}

/** One line describing a request, for notifications ("P 2026-10-18 → 2026-10-21"). */
export function lvLine(l: Pick<Leave, 'type' | 'from' | 'to'> | null) {
  if (!l) return '';
  return leaveTypeLabel(l.type, 'en') + ' ' + l.from + (l.to && l.to !== l.from ? ' → ' + l.to : '');
}
export function lvLineKu(l: Pick<Leave, 'type' | 'from' | 'to'> | null) {
  if (!l) return '';
  return leaveTypeLabel(l.type, 'ku') + ' ' + l.from + (l.to && l.to !== l.from ? ' → ' + l.to : '');
}

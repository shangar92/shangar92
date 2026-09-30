import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type LeaveTypeId = 'annual' | 'unpaid' | 'official' | 'paternity' | 'fingerprint';
export type RequestStatus = 'pending' | 'approved' | 'declined';

export type LeaveType = {
  id: LeaveTypeId;
  label: string; // Kurdish (Sorani)
  english: string;
  short: string;
  icon: IconName;
  total: number | null; // null = unlimited
};

export const leaveTypes: LeaveType[] = [
  { id: 'annual', label: 'ئاسایی', english: 'Annual', short: 'Annual', icon: 'sunny-outline', total: 25 },
  { id: 'unpaid', label: 'بێ مووچە', english: 'Unpaid', short: 'Unpaid', icon: 'wallet-outline', total: 30 },
  { id: 'official', label: 'فرمی', english: 'Official', short: 'Official', icon: 'briefcase-outline', total: null },
  { id: 'paternity', label: 'باوکانە', english: 'Paternity', short: 'Paternity', icon: 'heart-outline', total: 3 },
  { id: 'fingerprint', label: 'پەنجەمۆر', english: 'Missed check-in', short: 'Check-in', icon: 'finger-print-outline', total: 6 },
];

export const leaveTypeById = Object.fromEntries(leaveTypes.map((t) => [t.id, t])) as Record<LeaveTypeId, LeaveType>;

export type Person = {
  id: string;
  initials: string;
  name: string;
  role: string;
  color: string;
  status: 'site' | 'leave' | 'off';
};

export const team: Person[] = [
  { id: 'ak', initials: 'AK', name: 'Aram Karim', role: 'Drilling Engineer', color: '#4F46E5', status: 'leave' },
  { id: 'rn', initials: 'RN', name: 'Rawand Nawzad', role: 'HSE Supervisor', color: '#0E6E74', status: 'site' },
  { id: 'ds', initials: 'DS', name: 'Dilan Salih', role: 'Geologist', color: '#B45309', status: 'off' },
  { id: 'hm', initials: 'HM', name: 'Hawre Mahmood', role: 'Mechanical Tech', color: '#0B1F3A', status: 'site' },
  { id: 'sh2', initials: 'SA', name: 'Soran Aziz', role: 'Rig Supervisor', color: '#7C3AED', status: 'site' },
  { id: 'lj', initials: 'LJ', name: 'Lana Jamal', role: 'Logistics Coordinator', color: '#BE185D', status: 'leave' },
];

export const personById = Object.fromEntries(team.map((p) => [p.id, p])) as Record<string, Person>;

export const me = {
  initials: 'SH',
  name: 'Shangar Ahmed',
  role: 'Mobile Engineer · IT Department',
  company: 'ENERGY CO.',
  unit: 'Drilling Ops',
  employeeId: 'EC-10482',
  manager: 'Sara Hassan',
  location: 'Erbil HQ · Floor 4',
  years: 5,
  rotation: { day: 10, length: 14, field: 'Field B · Camp 3', homeFrom: '30 Sep' },
};

export type TimeOffRequest = {
  id: string;
  code: string;
  type: LeaveTypeId;
  from: string; // ISO date
  to: string;
  half: boolean;
  status: RequestStatus;
  /** Approval steps finished: 1 = submitted, 2 = manager approved, 3 = HR approved, 4 = confirmed. */
  stage: number;
  handover?: string; // person id
  note?: string;
  managerNote?: string;
  submittedAt: string;
};

export const initialRequests: TimeOffRequest[] = [
  {
    id: 'r1', code: 'LV-2026-0418', type: 'annual', from: '2026-10-18', to: '2026-10-21', half: false,
    status: 'pending', stage: 2, handover: 'rn', managerNote: 'Enjoy the break, Rawand will cover.', submittedAt: '25 Sep, 09:12',
  },
  {
    id: 'r2', code: 'LV-2026-0371', type: 'annual', from: '2026-10-06', to: '2026-10-06', half: false,
    status: 'approved', stage: 4, handover: 'rn', submittedAt: '21 Sep, 08:30',
  },
  {
    id: 'r3', code: 'LV-2026-0302', type: 'annual', from: '2026-08-23', to: '2026-08-23', half: false,
    status: 'approved', stage: 4, note: 'Family visit', submittedAt: '17 Aug, 10:02',
  },
  {
    id: 'r4', code: 'LV-2026-0215', type: 'unpaid', from: '2026-06-14', to: '2026-06-15', half: false,
    status: 'declined', stage: 1, submittedAt: '2 Jun, 14:20',
  },
  {
    id: 'r5', code: 'LV-2026-0188', type: 'fingerprint', from: '2026-07-28', to: '2026-07-28', half: false,
    status: 'approved', stage: 4, submittedAt: '28 Jul, 09:40',
  },
];

/** Days taken earlier this year, before the requests listed above. Pending requests also count, so the days stay reserved. */
const carriedUsed: Partial<Record<LeaveTypeId, number>> = { annual: 3 };

export const holidays: Record<string, string> = {
  '2026-10-14': 'Public holiday',
  '2026-12-25': 'Christmas Day',
};

export type Notice = {
  id: string;
  kind: 'approval' | 'hr';
  icon: IconName;
  tone: 'green' | 'amber' | 'petrol' | 'red';
  title: string;
  body: string;
  time: string;
  day: 'Today' | 'Yesterday';
  unread: boolean;
  action?: 'correction';
};

export const initialNotices: Notice[] = [
  {
    id: 'n1', kind: 'approval', icon: 'checkmark', tone: 'green', title: 'Line manager approved',
    body: 'Sara Hassan approved your 4-day leave (18–21 Oct). Waiting for HR.', time: '11:40', day: 'Today', unread: true,
  },
  {
    id: 'n2', kind: 'hr', icon: 'finger-print-outline', tone: 'amber', title: 'Missed check-in',
    body: 'No fingerprint at Gate 2 this morning.', time: '08:05', day: 'Today', unread: true, action: 'correction',
  },
  {
    id: 'n3', kind: 'hr', icon: 'construct-outline', tone: 'petrol', title: 'Crew change confirmed',
    body: 'Going home 30 Sep. Transport leaves Camp 3 at 07:00.', time: '16:20', day: 'Yesterday', unread: false,
  },
  {
    id: 'n4', kind: 'approval', icon: 'checkmark', tone: 'green', title: 'Leave confirmed',
    body: 'Your annual leave on 6 Oct is confirmed and added to payroll.', time: '10:15', day: 'Yesterday', unread: false,
  },
];

// ---------- dates ----------

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Friday and Saturday are the weekend. */
export function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 5 || d === 6;
}

export function workingDays(from: string, to: string) {
  let n = 0;
  for (let d = parseISO(from); d <= parseISO(to); d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d) && !holidays[toISO(d)]) n++;
  }
  return n;
}

export function requestDays(r: Pick<TimeOffRequest, 'from' | 'to' | 'half'>) {
  return r.half ? 0.5 : workingDays(r.from, r.to);
}

export function formatDate(iso: string) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(iso: string) {
  const d = parseISO(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatRange(from: string, to: string, withYear = true) {
  const a = parseISO(from);
  const b = parseISO(to);
  const year = withYear ? ` ${b.getFullYear()}` : '';
  if (from === to) return `${a.getDate()} ${MONTHS[a.getMonth()]}${year}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]}${year}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}${year}`;
}

export function formatDays(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

// ---------- balances ----------

export function usedDays(requests: TimeOffRequest[], type: LeaveTypeId, exceptId?: string) {
  return requests
    .filter((r) => r.type === type && r.status !== 'declined' && r.id !== exceptId)
    .reduce((sum, r) => sum + requestDays(r), carriedUsed[type] ?? 0);
}

export function remainingDays(requests: TimeOffRequest[], type: LeaveTypeId, exceptId?: string) {
  const total = leaveTypeById[type].total;
  return total === null ? null : Math.max(total - usedDays(requests, type, exceptId), 0);
}

// ---------- approval ----------

export const approvalSteps = ['Submitted', 'Line manager', 'HR review', 'Confirmed'] as const;

export function statusLabel(r: TimeOffRequest) {
  if (r.status === 'approved') return 'Approved';
  if (r.status === 'declined') return 'Declined';
  return r.stage >= 2 ? 'HR review' : 'Manager review';
}

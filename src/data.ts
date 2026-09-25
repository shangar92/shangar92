export type LeaveTypeId = 'annual' | 'unpaid' | 'official' | 'paternity' | 'fingerprint';
export type RequestStatus = 'accepted' | 'pending' | 'rejected';

export type LeaveType = {
  id: LeaveTypeId;
  label: string; // Kurdish (Sorani)
  english: string;
  icon: string; // Ionicons name
  used: number;
  total: number | null; // null = unlimited
  colors: readonly [string, string];
};

export type TimeOffRequest = {
  id: string;
  type: LeaveTypeId;
  days: number;
  from: string; // ISO date
  to: string;
  status: RequestStatus;
  note?: string;
};

export const leaveTypes: LeaveType[] = [
  { id: 'annual', label: 'ئاسایی', english: 'Annual', icon: 'sunny', used: 9, total: 25, colors: ['#FF2D6F', '#FF7A59'] },
  { id: 'unpaid', label: 'بێ مووچە', english: 'Unpaid', icon: 'wallet', used: 0, total: 30, colors: ['#7C3AED', '#C084FC'] },
  { id: 'official', label: 'فرمی', english: 'Official', icon: 'briefcase', used: 0, total: null, colors: ['#0284C7', '#38BDF8'] },
  { id: 'paternity', label: 'باوکانە', english: 'Paternity', icon: 'heart', used: 0, total: 3, colors: ['#059669', '#34D399'] },
  { id: 'fingerprint', label: 'بیرچوونی پەنجەمۆر', english: 'Missed check-in', icon: 'finger-print', used: 1, total: 6, colors: ['#D97706', '#FBBF24'] },
];

export const leaveTypeById = Object.fromEntries(leaveTypes.map((t) => [t.id, t])) as Record<LeaveTypeId, LeaveType>;

export const initialRequests: TimeOffRequest[] = [
  { id: 'r1', type: 'annual', days: 1, from: '2026-08-23', to: '2026-08-23', status: 'accepted', note: 'Family visit' },
  { id: 'r2', type: 'annual', days: 0.5, from: '2026-08-10', to: '2026-08-10', status: 'accepted', note: 'Doctor appointment' },
  { id: 'r3', type: 'fingerprint', days: 1, from: '2026-07-28', to: '2026-07-28', status: 'accepted' },
  { id: 'r4', type: 'annual', days: 3, from: '2026-07-01', to: '2026-07-03', status: 'accepted', note: 'Summer trip' },
  { id: 'r5', type: 'unpaid', days: 2, from: '2026-06-14', to: '2026-06-15', status: 'rejected' },
  { id: 'r6', type: 'annual', days: 4.5, from: '2026-05-04', to: '2026-05-08', status: 'accepted' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatRange(from: string, to: string) {
  if (from === to) return formatDate(from);
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  if (fy === ty && fm === tm) return `${fd} – ${td} ${MONTHS[tm - 1]} ${ty}`;
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function toISO(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function formatDays(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

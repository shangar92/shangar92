// Shapes of the records the Day Off web app keeps in Firestore. Only the
// fields this app reads are listed; records carry more, and every write keeps
// whatever else is there.

export type Role =
  | 'employee'
  | 'secadmin'
  | 'secmanager'
  | 'deptadmin'
  | 'deptmanager'
  | 'director'
  | 'doctor'
  | 'hrmanager'
  | 'gm'
  | 'hradmin'
  | 'staffadmin'
  | 'superadmin';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

/** A policy value set per leave type (company-wide or for one person). */
export type Policy = Record<string, any>;

export type Person = {
  id: string;
  fullName?: string;
  email?: string;
  altEmails?: string[];
  hrCode?: string;
  position?: string;
  mobile?: string;
  hireDate?: string;
  dept?: string | null;
  approverId?: string | null;
  watchers?: string[];
  shiftType?: string;
  profileType?: Role;
  role?: Role;
  photoUrl?: string;
  disabled?: boolean;
  mustChangePassword?: boolean;
  entitlements?: Record<string, number | string>;
  openingBalance?: Record<string, { days: number; year: number; ent?: number | string | null }>;
  policies?: Record<string, Policy>;
  disabledTypes?: string[];
  onceOnlyOverride?: Record<string, string>;
  visibleDepts?: string[];
  canSeeTeamLeave?: boolean;
  adminUnits?: string[];
  isApprover?: boolean;
  tsOrder?: number;
  [key: string]: unknown;
};

export type Unit = {
  id: string;
  name: string;
  kind?: 'director' | 'department' | 'section' | string;
  parentId?: string | null;
  managerId?: string | null;
  approverId?: string | null;
  approver2Id?: string | null;
  approvalSteps?: number;
  watchers?: string[];
  [key: string]: unknown;
};

export type ChainStep = { id: string; name: string; stage: string };

export type LeaveDoc = { id: string; name: string; mime?: string };

export type LeaveChange = {
  kind: 'edit' | 'cancel';
  type?: string;
  from?: string;
  to?: string;
  reason?: string;
  halfDay?: boolean;
  doc?: LeaveDoc | null;
  days?: number;
  hours?: number;
  at?: string;
  by?: string;
};

export type Leave = {
  id: string;
  empId: string;
  empName?: string;
  type: string;
  from: string;
  to: string;
  reason?: string;
  halfDay?: boolean;
  docNote?: string;
  doc?: LeaveDoc | null;
  days?: number;
  hours?: number;
  status: LeaveStatus;
  approverId?: string | null;
  chain?: ChainStep[];
  step?: number;
  signs?: { id: string | null; by: string; at: string; stage: string }[];
  createdAt?: string;
  decidedBy?: string | null;
  decidedById?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  change?: LeaveChange | null;
  edits?: {
    by: string;
    fromWas: string;
    toWas: string;
    daysWas?: number;
    fromNow: string;
    toNow: string;
    daysNow?: number;
    note?: string | null;
  }[];
  grantedBy?: string;
  grantedByName?: string;
  editedByName?: string;
  [key: string]: unknown;
};

export type Notif = {
  id: string;
  text: string;
  textKu: string;
  target: string;
  to: string;
  date: string;
  read: boolean;
  ts: number;
  readBy?: Record<string, boolean>;
  leaveType?: string;
  forDoctor?: boolean;
  status?: string;
  [key: string]: unknown;
};

export type Announcement = {
  id: string;
  text: string;
  date: string;
  people?: string[];
  depts?: string[];
  [key: string]: unknown;
};

export type Holiday = { date: string; name?: string; only?: string[] | null };

export type LeaveType = {
  code: string;
  ku: string;
  en: string;
  ar?: string;
  color: string;
  textColor?: string;
  unit?: 'hour';
  hidden?: boolean;
};

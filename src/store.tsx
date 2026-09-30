import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { initialNotices, initialRequests, MONTHS, Notice, TimeOffRequest } from './data';

export type RequestDraft = Pick<TimeOffRequest, 'type' | 'from' | 'to' | 'half' | 'handover' | 'note'>;

type Store = {
  requests: TimeOffRequest[];
  notices: Notice[];
  submit: (draft: RequestDraft, editingId?: string) => string;
  withdraw: (id: string) => void;
  markAllRead: () => void;
  dismissNotice: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

function stamp(d = new Date()) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState(initialRequests);
  const [notices, setNotices] = useState(initialNotices);

  const store = useMemo<Store>(
    () => ({
      requests,
      notices,
      submit: (draft, editingId) => {
        if (editingId) {
          // Editing sends the request back to the start of the approval chain.
          setRequests((rs) =>
            rs.map((r) => (r.id === editingId ? { ...r, ...draft, status: 'pending', stage: 1, managerNote: undefined, submittedAt: stamp() } : r)),
          );
          return editingId;
        }
        const id = `r${Date.now()}`;
        const code = `LV-${new Date().getFullYear()}-${String(Math.floor(Date.now() / 1000) % 10000).padStart(4, '0')}`;
        setRequests((rs) => [{ ...draft, id, code, status: 'pending', stage: 1, submittedAt: stamp() }, ...rs]);
        return id;
      },
      withdraw: (id) => setRequests((rs) => rs.filter((r) => r.id !== id)),
      markAllRead: () => setNotices((ns) => ns.map((n) => ({ ...n, unread: false }))),
      dismissNotice: (id) => setNotices((ns) => ns.filter((n) => n.id !== id)),
    }),
    [requests, notices],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

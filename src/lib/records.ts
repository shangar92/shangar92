// Live Firestore data, read and written the same way the Day Off website does.
//
// Employees, administrators, units, leave requests and notifications are one
// document per record in "<name>_v2" collections. Settings (leave policies,
// holidays, announcements …) are single documents in app_state holding
// { value }.

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteField,
  doc,
  FieldPath,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { isoLocal, uid } from './dates';

export type WithId = { id: string; [key: string]: any };
type Updater<T> = T[] | ((prev: T[]) => T[]);

/**
 * A live per-record collection. The setter takes the whole next list (or an
 * updater, like useState) and writes only what changed: new records whole,
 * edited records field by field, removed records deleted. That is what keeps
 * two people editing different fields of one record from undoing each other.
 */
export function useRecordCollection<T extends WithId>(collName: string, onWriteFailed?: (coll: string, detail: string) => void) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const latest = useRef<T[]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = onSnapshot(
      collection(db, collName),
      (snap) => {
        const rows: T[] = [];
        snap.forEach((d) => rows.push({ ...(d.data() as object), id: d.id } as T));
        latest.current = rows;
        setItems(rows);
        setReady(true);
      },
      (err) => {
        console.error('Read error [' + collName + ']:', err);
        if (dead) return;
        dead = true;
        timer = setTimeout(() => setRetry((r) => r + 1), 4000);
      },
    );
    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [collName, retry]);

  function setState(updater: Updater<T>) {
    const prev = latest.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (!Array.isArray(next)) return;
    const prevById = new Map(prev.map((r) => [r.id, r]));
    const nextById = new Map(next.map((r) => [r.id, r]));
    const removed = prev.filter((r) => !nextById.has(r.id)).map((r) => r.id);
    const addedOrChanged = next.filter((r) => {
      const before = prevById.get(r.id);
      if (!before) return true;
      if (before === r) return false;
      return JSON.stringify(before) !== JSON.stringify(r);
    });
    if (!removed.length && !addedOrChanged.length) return;

    // Show it now; the snapshot confirms in a moment.
    latest.current = next;
    setItems(next);

    const changes = addedOrChanged
      .map((r) => {
        const id = r.id || uid('r');
        const before = prevById.get(r.id);
        const full = clean({ ...r, id });
        if (!before) return { id, full, args: null as unknown[] | null };
        const args: unknown[] = [];
        const keys = new Set([...Object.keys(before), ...Object.keys(r)]);
        keys.forEach((k) => {
          if (k === 'id') return;
          const x = before[k];
          const y = r[k];
          if (x === y) return;
          if (JSON.stringify(x) === JSON.stringify(y)) return;
          args.push(new FieldPath(k), y === undefined ? deleteField() : clean(y));
        });
        return args.length ? { id, full, args } : null;
      })
      .filter(Boolean) as { id: string; full: object; args: unknown[] | null }[];

    async function writeAll() {
      const col = collection(db, collName);
      for (let i = 0; i < removed.length; i += 400) {
        const batch = writeBatch(db);
        removed.slice(i, i + 400).forEach((id) => batch.delete(doc(col, id)));
        await batch.commit();
      }
      for (let i = 0; i < changes.length; i += 400) {
        const part = changes.slice(i, i + 400);
        const batch = writeBatch(db);
        part.forEach((c) => {
          if (c.args) {
            const [field, value, ...more] = c.args as [FieldPath, unknown, ...unknown[]];
            batch.update(doc(col, c.id), field, value, ...more);
          } else batch.set(doc(col, c.id), c.full);
        });
        try {
          await batch.commit();
        } catch (err: any) {
          // A record that no longer exists cannot be updated; write it whole.
          if (err && err.code === 'not-found') {
            const b2 = writeBatch(db);
            part.forEach((c) => b2.set(doc(col, c.id), c.full));
            await b2.commit();
          } else throw err;
        }
      }
    }

    const run = queue.current.then(writeAll).catch(async (err) => {
      console.error('Write error [' + collName + '] — retrying:', err);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await new Promise((r) => setTimeout(r, 500 + attempt * 700));
          await writeAll();
          return;
        } catch (err2) {
          console.error('Retry ' + (attempt + 1) + ' failed [' + collName + ']:', err2);
        }
      }
      setItems(latest.current);
      if (collName === 'notifications_v2') return;
      onWriteFailed?.(collName, (err && (err.code || err.message)) || 'unknown');
    });
    queue.current = run.catch(() => {});
  }

  return [items, setState, ready] as const;
}

/** A live settings document (app_state/<key>), read only. The app never writes these. */
export function useStateDoc<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = onSnapshot(
      doc(db, 'app_state', key),
      (snap) => {
        const v = snap.exists() ? (snap.data() as { value?: T }).value : undefined;
        setValue(v === undefined || v === null ? fallback : v);
        setReady(true);
      },
      (err) => {
        console.error('Read error [app_state/' + key + ']:', err);
        if (dead) return;
        dead = true;
        timer = setTimeout(() => setRetry((r) => r + 1), 4000);
      },
    );
    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry]);
  return [value, ready] as const;
}

/** Firestore refuses undefined inside objects and arrays; JSON drops it. */
function clean<V>(v: V): V {
  if (v === undefined || v === null || typeof v !== 'object') return v;
  return JSON.parse(JSON.stringify(v));
}

/** Adds an entry to app_state/leaveChangeLog, newest first, keeping 1000. */
export function logLeaveChange(entry: Record<string, unknown>) {
  const e = clean({ id: uid('lc'), ts: Date.now(), at: isoLocal(new Date()), ...entry });
  const ref = doc(db, 'app_state', 'leaveChangeLog');
  runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists() && Array.isArray(snap.data().value) ? snap.data().value : [];
    tx.set(ref, { value: [e, ...cur].slice(0, 1000) });
  }).catch((err) => console.error('Leave change log failed:', err));
}

let ACTIVITY_BLOCKED = false;
/**
 * The website's activity log. Like the website, nothing is logged for plain
 * employees or the super admin; managers' decisions are.
 */
export function logActivity(actor: { id?: string; name?: string; role?: string } | null, en: string, ku: string, extra?: Record<string, unknown>) {
  try {
    if (!actor || !actor.id || actor.role === 'employee' || actor.role === 'superadmin') return;
    const entry = clean({
      id: uid('act'), ts: Date.now(), at: isoLocal(new Date()),
      by: actor.name || '—', byId: actor.id, role: actor.role || '', text: en, textKu: ku || en, ...(extra || {}),
    });
    const legacy = () => {
      const ref = doc(db, 'app_state', 'activityLog');
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const cur = snap.exists() && Array.isArray(snap.data().value) ? snap.data().value : [];
        tx.set(ref, { value: [entry, ...cur].slice(0, 500) });
      }).catch((err) => console.error('Activity log write failed:', err));
    };
    if (ACTIVITY_BLOCKED) return legacy();
    setDoc(doc(db, 'activity_v2', entry.id), entry).catch((err) => {
      if (/permission|insufficient/i.test(String((err && (err.code || err.message)) || ''))) {
        ACTIVITY_BLOCKED = true;
        legacy();
      } else console.error('Activity log write failed:', err);
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
}

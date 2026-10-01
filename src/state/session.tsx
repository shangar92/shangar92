// Sign-in and language. A Firebase account is matched to its profile by email,
// administrators first, exactly as the Day Off website does.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Lang, T } from '../lib/i18n';
import type { Person, Role } from '../lib/types';

type Profile = { role: Role; cu: Person };

type Session = {
  lang: Lang;
  setLang: (l: Lang) => void;
  checked: boolean;
  profile: Profile | null;
  authErr: string;
  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (p: string) => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);
const LANG_KEY = 'dayoff_lang';

async function resolveProfile(email: string): Promise<Profile | null> {
  const emailLc = (email || '').trim().toLowerCase();
  const as = await getDocs(collection(db, 'admins_v2'));
  let hit: Person | null = null;
  as.forEach((d) => {
    const x = { ...(d.data() as object), id: d.id } as Person;
    if (!hit && String(x.email || '').trim().toLowerCase() === emailLc) hit = x;
  });
  if (hit) return { role: ((hit as Person).role || 'superadmin') as Role, cu: hit };
  const emps = collection(db, 'employees_v2');
  for (const v of [...new Set([emailLc, (email || '').trim()])].filter(Boolean)) {
    const s = await getDocs(query(emps, where('email', '==', v), limit(1)));
    if (!s.empty) {
      const x = { ...(s.docs[0].data() as object), id: s.docs[0].id } as Person;
      return { role: (x.profileType || 'employee') as Role, cu: x };
    }
  }
  const s2 = await getDocs(query(emps, where('altEmails', 'array-contains', emailLc), limit(1)));
  if (!s2.empty) {
    const x = { ...(s2.docs[0].data() as object), id: s2.docs[0].id } as Person;
    return { role: (x.profileType || 'employee') as Role, cu: x };
  }
  return null;
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timed out after ' + Math.round(ms / 1000) + 's')), ms);
    }),
  ]);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ku');
  const [checked, setChecked] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authErr, setAuthErr] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => {
        if (v === 'ku' || v === 'en' || v === 'ar') setLangState(v);
      })
      .catch(() => {});
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setProfile(null);
          return;
        }
        const prof = await withTimeout(resolveProfile(user.email || ''), 20000);
        if (prof) {
          setAuthErr('');
          setProfile(prof);
        } else {
          setAuthErr(
            T(lang, 'هیچ پرۆفایلێک بۆ ئەم ئیمەیلە نەدۆزرایەوە. داوای لە سوپەرئادمین بکە پرۆفایلت دروستبکات.',
              'No profile matches this email. Ask a superadmin to create one for you.',
              'لا يوجد ملف شخصي لهذا البريد الإلكتروني. اطلب من المدير إنشاء ملف لك.'),
          );
          await signOut(auth);
          setProfile(null);
        }
      } catch (err: any) {
        console.error('Profile lookup failed:', err);
        const msg = err?.message || 'unknown';
        setAuthErr(
          (/permission|insufficient/i.test(msg)
            ? T(lang, 'ڕێساکانی داتابەیس ڕێگە بە خوێندنەوە نادەن.', 'The database rules are denying access.', 'قواعد قاعدة البيانات تمنع الوصول.')
            : T(lang, 'نەتوانرا پەیوەندی بە سێرڤەرەوە بکرێت. ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵبدەرەوە.',
                "Couldn't reach the server. Check your connection and try again.",
                'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.')) + ' (' + msg + ')',
        );
        setProfile(null);
      } finally {
        setChecked(true);
      }
    });
    // The listener lives for the whole app; lang only affects error wording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<Session>(
    () => ({
      lang,
      setLang,
      checked,
      profile,
      authErr,
      login: async (email, password) => {
        setAuthErr('');
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch {
          setAuthErr(T(lang, 'ئیمەیل یان پاسۆرد هەڵەیە.', 'Incorrect email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'));
        }
      },
      forgotPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        await signOut(auth);
      },
      changePassword: async (p) => {
        if (!auth.currentUser) throw new Error('not-signed-in');
        await updatePassword(auth.currentUser, p);
      },
    }),
    [lang, setLang, checked, profile, authErr],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** Text in the current language: tr(kurdish, english, arabic?). */
export function useT() {
  const { lang } = useSession();
  return useCallback((ku: string, en: string, ar?: string) => T(lang, ku, en, ar), [lang]);
}

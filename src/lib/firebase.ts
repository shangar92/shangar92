// Web: the browser keeps the sign-in between visits.
import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const firstStart = getApps().length === 0;
export const app = firstStart ? initializeApp(firebaseConfig) : getApp();
export const auth = firstStart ? initializeAuth(app, { persistence: browserLocalPersistence }) : getAuth(app);
// Long polling is detected automatically where a network breaks Firestore's
// streaming, the same setting the website uses. ignoreUndefinedProperties
// stops one undefined field from rejecting a whole write.
export const db = firstStart
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    })
  : getFirestore(app);

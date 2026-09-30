// iOS and Android: the sign-in is kept on the phone, so people stay signed in
// between launches like in any phone app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const firstStart = getApps().length === 0;
export const app = firstStart ? initializeApp(firebaseConfig) : getApp();
export const auth = firstStart ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }) : getAuth(app);
export const db = firstStart
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    })
  : getFirestore(app);

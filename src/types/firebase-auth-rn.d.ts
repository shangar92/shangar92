// Firebase ships getReactNativePersistence in its React Native build, but the
// type file TypeScript picks for "firebase/auth" leaves it out.
import 'firebase/auth';
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}

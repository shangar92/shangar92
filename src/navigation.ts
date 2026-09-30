import { router } from 'expo-router';

/** Go back, or to Home when the screen was opened directly (e.g. from a link on the web). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

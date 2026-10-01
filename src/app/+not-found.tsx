import { Redirect } from 'expo-router';

/** Unknown paths (old links, or a web host's own URL) open Home. */
export default function NotFound() {
  return <Redirect href="/" />;
}

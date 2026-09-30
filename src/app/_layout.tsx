import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ForcePasswordScreen, LoadingScreen, LoginScreen, SuspendedScreen } from '../components/auth';
import { isRtl } from '../lib/i18n';
import { isSuspended, mustChangePassword } from '../lib/rules';
import { DataProvider, useData } from '../state/data';
import { FeedbackProvider } from '../state/feedback';
import { SessionProvider, useSession } from '../state/session';
import { ThemeProvider, useTheme } from '../theme';

function SignedIn() {
  const { t } = useTheme();
  const { ready, me, clearMustChange } = useData();
  if (!ready) return <LoadingScreen />;
  // Checked on the live record, so a suspension or a reset takes effect at once.
  if (isSuspended(me)) return <SuspendedScreen />;
  if (mustChangePassword(me)) return <ForcePasswordScreen onDone={clearMustChange} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="person/[id]" />
      <Stack.Screen name="colors" />
    </Stack>
  );
}

function Gate() {
  const { checked, profile, lang } = useSession();
  const { t } = useTheme();
  return (
    // Kurdish and Arabic lay the whole app out right to left.
    <View style={{ flex: 1, backgroundColor: t.bg, direction: isRtl(lang) ? 'rtl' : 'ltr' }}>
      <FeedbackProvider rtl={isRtl(lang)}>
        {!checked ? (
          <LoadingScreen />
        ) : !profile ? (
          <LoginScreen />
        ) : (
          <DataProvider key={profile.cu.id}>
            <SignedIn />
          </DataProvider>
        )}
      </FeedbackProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <Gate />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../store';
import { ThemeProvider, useTheme } from '../theme';

function RootStack() {
  const { t } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="request/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="colors" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StoreProvider>
          <RootStack />
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { Tabs } from 'expo-router';
import { GlassTabBar } from '../../components/GlassTabBar';
import { useTheme } from '../../theme';

// The tabs of the website's employee app. Approvals, Watching and Timesheet
// are only shown to people they apply to (see GlassTabBar).
export default function TabLayout() {
  const { t } = useTheme();
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="balance" />
      <Tabs.Screen name="approvals" />
      <Tabs.Screen name="watching" />
      <Tabs.Screen name="timesheet" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

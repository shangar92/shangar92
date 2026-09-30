import { Tabs } from 'expo-router';
import { GlassTabBar } from '../../components/GlassTabBar';
import { useTheme } from '../../theme';

export default function TabLayout() {
  const { t } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

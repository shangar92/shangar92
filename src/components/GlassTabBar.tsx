import { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '../data';
import { useTheme } from '../theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_HEIGHT = 64;
const BAR_GAP = 16;
/** Space screens leave at the bottom so content can scroll clear of the tab bar (plus the safe area). */
export const TAB_BAR_SPACE = BAR_HEIGHT + BAR_GAP + 28;

const tabs: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  calendar: { label: 'Calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  team: { label: 'Team', icon: 'people-outline', iconActive: 'people' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

function GlassSurface({ children, style }: { children: ReactNode; style: StyleProp<ViewStyle> }) {
  const { dark } = useTheme();
  // Android has no live blur without a blur target, so the tint is made more solid there.
  const tint = dark
    ? Platform.OS === 'android' ? 'rgba(28,30,48,0.92)' : 'rgba(28,30,48,0.38)'
    : Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)';
  return (
    <View
      style={[
        style,
        styles.surface,
        {
          borderColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)',
          boxShadow: dark ? '0 10px 28px rgba(0,0,0,0.3)' : '0 10px 28px rgba(11,31,58,0.16), 0 1px 3px rgba(11,31,58,0.08)',
        },
      ]}
    >
      <BlurView intensity={40} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      {children}
    </View>
  );
}

export function GlassTabBar({ state, navigation }: TabBarProps) {
  const { t, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const idle = dark ? 'rgba(255,255,255,0.85)' : '#4A5263';

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]} pointerEvents="box-none">
      <GlassSurface style={styles.capsule}>
        {state.routes.map((route, index) => {
          const tab = tabs[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? t.acc : idle;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={[
                styles.item,
                focused && { backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={23} color={color} />
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </GlassSurface>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New leave request"
        onPress={() => router.push('/request/new')}
        style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}
      >
        <GlassSurface style={styles.circle}>
          <Ionicons name="add" size={28} color={t.acc} />
        </GlassSurface>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: BAR_GAP, right: BAR_GAP, flexDirection: 'row', alignItems: 'center', gap: 10 },
  surface: { overflow: 'hidden', borderWidth: 1 },
  capsule: { flex: 1, height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, flexDirection: 'row', alignItems: 'center', padding: 4 },
  item: { flex: 1, height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10.5, fontWeight: '600' },
  circle: { width: BAR_HEIGHT, height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, alignItems: 'center', justifyContent: 'center' },
});

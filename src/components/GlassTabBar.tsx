import { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../state/data';
import { useT } from '../state/session';
import { useTheme } from '../theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

const BAR_HEIGHT = 64;
const BAR_GAP = 16;
/** Space screens leave at the bottom so content can scroll clear of the tab bar (plus the safe area). */
export const TAB_BAR_SPACE = BAR_HEIGHT + BAR_GAP + 28;

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

/** The tabs of the web app's employee view. Approvals, Watching and Timesheet appear only for people they apply to. */
export function useVisibleTabs() {
  const tr = useT();
  const { isApprover, isWatcher, myPeople, role, inbox, unreadCount } = useData();
  const all: { name: string; label: string; icon: IconName; iconActive: IconName; show: boolean; badge?: number }[] = [
    { name: 'index', label: tr('ڕۆژژمێر', 'Calendar', 'التقويم'), icon: 'calendar-outline', iconActive: 'calendar', show: true },
    { name: 'balance', label: tr('ماوە', 'Balance', 'الرصيد'), icon: 'time-outline', iconActive: 'time', show: true },
    { name: 'approvals', label: tr('ئەپروڤ', 'Approvals', 'الموافقات'), icon: 'checkbox-outline', iconActive: 'checkbox', show: isApprover, badge: inbox.length },
    { name: 'watching', label: tr('چاودێری', 'Watching', 'المتابعة'), icon: 'eye-outline', iconActive: 'eye', show: isWatcher },
    { name: 'timesheet', label: tr('تایم شیت', 'Timesheet', 'جدول الدوام'), icon: 'grid-outline', iconActive: 'grid', show: myPeople.length > 0 && role !== 'doctor' },
    { name: 'notifications', label: tr('ئاگاداری', 'Notifications', 'الإشعارات'), icon: 'notifications-outline', iconActive: 'notifications', show: true, badge: unreadCount },
    { name: 'profile', label: tr('پرۆفایل', 'Profile', 'الملف الشخصي'), icon: 'person-outline', iconActive: 'person', show: true },
  ];
  return all.filter((t) => t.show);
}

export function GlassTabBar({ state, navigation }: TabBarProps) {
  const { t, dark } = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const tabs = useVisibleTabs();
  const idle = dark ? 'rgba(255,255,255,0.85)' : '#4A5263';
  // With many tabs only the selected one keeps its label, so each stays tappable.
  const crowded = tabs.length > 5;

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]} pointerEvents="box-none">
      <GlassSurface style={styles.capsule}>
        {tabs.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;
          const focused = state.routes[state.index]?.name === tab.name;
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
                crowded && focused && { flex: 2.4 },
                focused && { backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <View>
                <Ionicons name={focused ? tab.iconActive : tab.icon} size={crowded ? 21 : 23} color={color} />
                {tab.badge ? (
                  <View style={[styles.badge, { borderColor: dark ? '#1C1E30' : '#FFFFFF' }]}>
                    <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              {!crowded || focused ? (
                <Text numberOfLines={1} style={[styles.label, { color }]}>
                  {tab.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </GlassSurface>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr('داواکاری مۆڵەت', 'Request day off', 'طلب إجازة')}
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
  item: { flex: 1, height: '100%', borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  label: { fontSize: 10.5, fontWeight: '600' },
  circle: { width: BAR_HEIGHT, height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -5, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
    backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

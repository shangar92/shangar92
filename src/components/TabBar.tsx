import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

export type TabKey = 'calendar' | 'balance' | 'notifications' | 'profile';

const tabs: { key: TabKey; label: string; icon: string; badge?: number }[] = [
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'balance', label: 'Balance', icon: 'pie-chart' },
  { key: 'notifications', label: 'Inbox', icon: 'notifications', badge: 2 },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="light" style={styles.bar}>
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.tab, isActive && styles.tabActive]}>
              <View>
                <Ionicons
                  name={(isActive ? t.icon : `${t.icon}-outline`) as any}
                  size={22}
                  color={isActive ? colors.primary : colors.textFaint}
                />
                {t.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.badge}</Text>
                  </View>
                ) : null}
              </View>
              {isActive && <Text style={styles.label}>{t.label}</Text>}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#1B1B3A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 14, fontWeight: '700', color: colors.primary },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

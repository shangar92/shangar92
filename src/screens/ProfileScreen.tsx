import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadow } from '../theme';

const rows = [
  { icon: 'person-outline', label: 'Personal info' },
  { icon: 'language-outline', label: 'Language', value: 'کوردی' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & security' },
  { icon: 'help-circle-outline', label: 'Help center' },
];

export function ProfileScreen({ topInset, bottomInset }: { topInset: number; bottomInset: number }) {
  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset, paddingHorizontal: 20 }}>
      <Text style={styles.title}>Profile</Text>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SH</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Shangar</Text>
          <Text style={styles.role}>Mobile Engineer · Erbil</Text>
        </View>
      </LinearGradient>
      <View style={styles.stats}>
        {[
          ['16', 'Days left'],
          ['10', 'Days taken'],
          ['0', 'Pending'],
        ].map(([v, l]) => (
          <View key={l} style={styles.stat}>
            <Text style={styles.statValue}>{v}</Text>
            <Text style={styles.statLabel}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={styles.list}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowIcon}>
              <Ionicons name={r.icon as any} size={19} color={colors.text} />
            </View>
            <Text style={styles.rowLabel}>{r.label}</Text>
            {r.value && <Text style={styles.rowValue}>{r.value}</Text>}
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: radius.xl },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800' },
  role: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', ...shadow.card },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, marginTop: 20, paddingHorizontal: 14, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 14, color: colors.textMuted },
});

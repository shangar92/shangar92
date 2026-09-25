import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

const items = [
  { id: 1, icon: 'checkmark-circle', color: colors.success, title: 'Request approved', body: 'Your 1 day ئاسایی leave on 23 Aug was approved by Sara.', time: '2h', unread: true },
  { id: 2, icon: 'calendar', color: '#0284C7', title: 'Public holiday', body: 'Office closed on 5 Oct. Enjoy the long weekend!', time: '1d', unread: true },
  { id: 3, icon: 'close-circle', color: colors.danger, title: 'Request declined', body: 'Unpaid leave on 14–15 Jun was declined.', time: '3mo', unread: false },
  { id: 4, icon: 'finger-print', color: '#D97706', title: 'Missed check-in', body: 'We logged a missed fingerprint on 28 Jul.', time: '2mo', unread: false },
];

export function NotificationsScreen({ topInset, bottomInset }: { topInset: number; bottomInset: number }) {
  return (
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset, paddingHorizontal: 20, gap: 12 }}>
      <Text style={styles.title}>Inbox</Text>
      {items.map((n) => (
        <View key={n.id} style={styles.item}>
          <View style={[styles.icon, { backgroundColor: n.color + '18' }]}>
            <Ionicons name={n.icon as any} size={22} color={n.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{n.title}</Text>
              <Text style={styles.time}>{n.time}</Text>
            </View>
            <Text style={styles.body}>{n.body}</Text>
          </View>
          {n.unread && <View style={styles.dot} />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.6, marginBottom: 4 },
  item: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textFaint },
  body: { fontSize: 14, color: colors.textMuted, marginTop: 3, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialRequests, TimeOffRequest } from './src/data';
import { colors } from './src/theme';
import { TabBar, TabKey } from './src/components/TabBar';
import { GradientButton } from './src/components/GradientButton';
import { RequestSheet } from './src/components/RequestSheet';
import { TimeOffScreen } from './src/screens/TimeOffScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const TAB_BAR_SPACE = 96;
const CTA_SPACE = 72;

function Main() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('balance');
  const [requests, setRequests] = useState<TimeOffRequest[]>(initialRequests);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TimeOffRequest | null>(null);

  const tabBarHeight = TAB_BAR_SPACE + Math.max(insets.bottom, 12);
  const showCta = tab === 'balance';
  const bottomInset = tabBarHeight + (showCta ? CTA_SPACE : 0) + 16;

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const handleSubmit = (data: Omit<TimeOffRequest, 'id' | 'status'>) => {
    if (editing) {
      setRequests((rs) => rs.map((r) => (r.id === editing.id ? { ...r, ...data, status: 'pending' } : r)));
    } else {
      setRequests((rs) => [{ ...data, id: `r${Date.now()}`, status: 'pending' }, ...rs]);
    }
    setSheetOpen(false);
  };

  const screenProps = { topInset: insets.top, bottomInset };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {tab === 'balance' && (
        <TimeOffScreen
          {...screenProps}
          requests={requests}
          onEdit={(r) => {
            setEditing(r);
            setSheetOpen(true);
          }}
          onDelete={(r) => setRequests((rs) => rs.filter((x) => x.id !== r.id))}
        />
      )}
      {tab === 'calendar' && <CalendarScreen {...screenProps} requests={requests} />}
      {tab === 'notifications' && <NotificationsScreen {...screenProps} />}
      {tab === 'profile' && <ProfileScreen {...screenProps} />}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(245,245,250,0)', colors.bg]}
        locations={[0, 0.45]}
        style={[styles.fade, { height: tabBarHeight + (showCta ? CTA_SPACE : 0) + 24 }]}
      />
      {showCta && (
        <View style={[styles.cta, { bottom: tabBarHeight - 16 }]} pointerEvents="box-none">
          <GradientButton label="Request day off" icon="add" onPress={openNew} />
        </View>
      )}
      <TabBar active={tab} onChange={setTab} />

      <RequestSheet visible={sheetOpen} initial={editing} onClose={() => setSheetOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cta: { position: 'absolute', left: 20, right: 20 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

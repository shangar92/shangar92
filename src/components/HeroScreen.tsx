import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rgba, useTheme } from '../theme';
import { OilfieldScene } from './OilfieldScene';
import { TAB_BAR_SPACE } from './GlassTabBar';

const DESIGN_STATUS_BAR = 50;

type Props = {
  /** Header height in the design, status bar included (the design phone is 390 wide). */
  designHeight: number;
  hero: ReactNode;
  children: ReactNode;
  /** How far the first card overlaps the header. */
  lift?: number;
  /** Fade the bottom of the header into the page background. */
  fade?: boolean;
  /** Fixed content at the bottom, for screens without the tab bar. */
  footer?: ReactNode;
  withTabBar?: boolean;
};

export function HeroScreen({ designHeight, hero, children, lift = 40, fade, footer, withTabBar = true }: Props) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const heroHeight = insets.top + designHeight - DESIGN_STATUS_BAR;
  const bottomSpace = withTabBar ? TAB_BAR_SPACE + insets.bottom : footer ? 96 + insets.bottom : 24 + insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomSpace }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroHeight, overflow: 'hidden' }}>
          <View style={StyleSheet.absoluteFill}>
            <OilfieldScene height={heroHeight} covered={lift} />
          </View>
          <LinearGradient
            colors={['rgba(10,14,30,0.55)', 'rgba(10,14,30,0.05)', 'rgba(10,14,30,0.55)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          {fade ? <LinearGradient colors={[rgba(t.bg, 0), t.bg]} style={styles.fade} /> : null}
          <View style={[styles.heroContent, { paddingTop: insets.top + 6 }]}>{hero}</View>
        </View>
        <View style={{ marginTop: -lift }}>{children}</View>
      </ScrollView>
      {footer ? <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroContent: { paddingHorizontal: 20 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  footer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', gap: 10 },
});

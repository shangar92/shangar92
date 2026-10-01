import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GlassIcon, Txt } from './ui';
import { goBack } from '../navigation';
import { useSession } from '../state/session';
import { isRtl } from '../lib/i18n';

/** Title block on the sunset header: optional back button, small line above, title, and something on the far side. */
export function HeroTitle({ title, over, right, back }: { title: string; over?: string; right?: ReactNode; back?: boolean }) {
  const { lang } = useSession();
  return (
    <View style={styles.row}>
      {back ? <GlassIcon icon={isRtl(lang) ? 'chevron-forward' : 'chevron-back'} onPress={goBack} /> : null}
      <View style={{ flex: 1 }}>
        {over ? (
          <Txt size={13} color="#E4E7EF">
            {over}
          </Txt>
        ) : null}
        <Txt size={24} weight="700" color="#FFFFFF" numberOfLines={1} style={{ letterSpacing: -0.5 }}>
          {title}
        </Txt>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
});

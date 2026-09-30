import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HeroScreen } from '../../components/HeroScreen';
import { Card, IconBox, Row, Txt } from '../../components/ui';
import { me, remainingDays, usedDays } from '../../data';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

export default function ProfileScreen() {
  const { t, palette } = useTheme();
  const { requests } = useStore();
  const [faceId, setFaceId] = useState(true);

  const stats = [
    { value: String(remainingDays(requests, 'annual')), label: 'Days left' },
    { value: String(usedDays(requests, 'annual')), label: 'Days taken' },
    { value: `${me.years} yrs`, label: 'With us' },
  ];
  const details = [
    ['Employee ID', me.employeeId],
    ['Line manager', me.manager],
    ['Location', me.location],
  ];

  return (
    <HeroScreen
      designHeight={250}
      viewY={160}
      hero={
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={styles.avatar}>
            <Txt size={24} weight="700" color="#FFFFFF">
              {me.initials}
            </Txt>
          </View>
          <Txt size={20} weight="700" color="#FFFFFF" style={{ marginTop: 10 }}>
            {me.name}
          </Txt>
          <Txt size={13} color="#E4E7EF">
            {me.role}
          </Txt>
        </View>
      }
    >
      <View style={styles.px}>
        <Card raised style={[styles.row, { paddingVertical: 14 }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.stat, i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: t.line }]}>
              <Txt size={20} weight="700">
                {s.value}
              </Txt>
              <Txt size={12} color="muted">
                {s.label}
              </Txt>
            </View>
          ))}
        </Card>
      </View>

      <View style={[styles.px, { marginTop: 12 }]}>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {details.map(([k, v], i) => (
            <Row key={k} divider={i < details.length - 1} style={{ justifyContent: 'space-between' }}>
              <Txt color="muted">{k}</Txt>
              <Txt weight="700">{v}</Txt>
            </Row>
          ))}
        </Card>
      </View>

      <View style={[styles.px, { marginTop: 12 }]}>
        <Card style={{ paddingHorizontal: 16 }}>
          <Row divider onPress={() => router.push('/colors')}>
            <IconBox icon="color-palette-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              App colors
            </Txt>
            <View style={[styles.row, { gap: 6 }]}>
              <View style={[styles.swatch, { backgroundColor: t.bg, borderColor: t.line }]} />
              <View style={[styles.swatch, { backgroundColor: t.acc, borderColor: t.line }]} />
              <Txt color="muted">{palette.name}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.faint} />
          </Row>
          <Row divider>
            <IconBox icon="globe-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              Language
            </Txt>
            <Txt color="muted">English</Txt>
          </Row>
          <Row divider>
            <IconBox icon="scan-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              Face ID sign-in
            </Txt>
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ true: t.petrol, false: t.track }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={t.track}
            />
          </Row>
          <Row onPress={() => Alert.alert('Sign out', 'Sign-in is not connected yet, so there is nothing to sign out of.')}>
            <IconBox icon="log-out-outline" bg={t.redSoft} fg={t.red} size={36} iconSize={19} />
            <Txt weight="700" color="red" style={{ flex: 1 }}>
              Sign out
            </Txt>
          </Row>
        </Card>
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  swatch: { width: 16, height: 16, borderRadius: 5, borderWidth: 1 },
});

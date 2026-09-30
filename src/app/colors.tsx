import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Label, PrimaryButton, Txt } from '../components/ui';
import { CustomColors, isHex, palettes, useTheme } from '../theme';
import { goBack } from '../navigation';

const SWATCHES: Record<'bg' | 'acc' | 'sec', string[]> = {
  bg: ['#F2F6F4', '#F3F5F8', '#FBF3EC', '#F4F2FB', '#FCF1F3', '#FFFFFF', '#070D1A', '#0A1913', '#15122A', '#1A0F1E'],
  acc: ['#2E9C95', '#3B82F6', '#22A38A', '#8B7CF6', '#E76F8A', '#F07F5A', '#D9962B', '#F2B35A', '#6BAA3E', '#3D5A99'],
  sec: ['#E9A23B', '#2BB5AE', '#5EEAD4', '#F4C05E', '#7FD1C9', '#C4693F', '#B15CC4', '#14A3B8', '#E2B33C', '#6E9A5E'],
};

const FIELDS: { key: 'bg' | 'acc' | 'sec'; label: string; index: 0 | 1 | 2 }[] = [
  { key: 'bg', label: 'Background', index: 0 },
  { key: 'acc', label: 'Accent', index: 1 },
  { key: 'sec', label: 'Second color', index: 2 },
];

const KEY_NAMES = [
  ['bg', 'Background'],
  ['surface', 'Card'],
  ['text', 'Text'],
  ['acc', 'Accent'],
  ['petrol', 'Secondary'],
  ['amber', 'Pending'],
  ['green', 'Approved'],
  ['red', 'Declined'],
] as const;

const toColors = (d: string[]): CustomColors => [d[0].toUpperCase(), d[1].toUpperCase(), d[2].toUpperCase()];

export default function ColorsScreen() {
  const { t, dark, palette, setPaletteId, custom, setCustom } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string[]>([...custom]);

  const setField = (index: number, value: string) => {
    const next = [...draft];
    next[index] = value;
    setDraft(next);
    if (next.every(isHex)) {
      setCustom(toColors(next));
      setPaletteId('custom');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }}>
        <View style={[styles.row, { gap: 12 }]}>
          <Pressable
            onPress={() => goBack()}
            accessibilityLabel="Back"
            style={[styles.back, { backgroundColor: t.surface, borderColor: t.line }]}
          >
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt size={24} weight="700" style={{ letterSpacing: -0.5 }}>
              App colors
            </Txt>
            <Txt size={13} color="muted">
              Same design, {palettes.length} palettes. Tap one, or make your own.
            </Txt>
          </View>
        </View>

        <Label style={{ marginTop: 22 }}>Palettes</Label>
        <View style={styles.grid}>
          {palettes.map((p) => {
            const on = palette.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPaletteId(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.chip,
                  { backgroundColor: t.surface, borderColor: on ? t.text : t.line },
                  on && { borderWidth: 2 },
                ]}
              >
                <View style={styles.dot3}>
                  <View style={{ flex: 1, backgroundColor: p.v.bg }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: p.v.acc }} />
                    <View style={{ flex: 1, backgroundColor: p.dark ? p.v.petrol : p.v.surface }} />
                  </View>
                </View>
                <Txt size={13} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {p.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <Label style={{ marginTop: 22 }}>Make your own</Label>
        <Card style={{ padding: 16, marginTop: 10, gap: 16 }}>
          {FIELDS.map((f) => (
            <View key={f.key}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Txt weight="700">{f.label}</Txt>
                <View style={[styles.row, { gap: 8 }]}>
                  <View style={[styles.preview, { backgroundColor: isHex(draft[f.index]) ? draft[f.index] : 'transparent', borderColor: t.line }]} />
                  <TextInput
                    value={draft[f.index]}
                    onChangeText={(v) => setField(f.index, v.startsWith('#') ? v : `#${v}`)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                    style={[
                      styles.hex,
                      { color: t.text, backgroundColor: t.field, borderColor: isHex(draft[f.index]) ? t.line : t.red },
                    ]}
                  />
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                {SWATCHES[f.key].map((c) => {
                  const on = draft[f.index].toUpperCase() === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setField(f.index, c)}
                      accessibilityLabel={`${f.label} ${c}`}
                      style={[styles.swatch, { backgroundColor: c, borderColor: on ? t.text : t.line, borderWidth: on ? 2.5 : 1 }]}
                    />
                  );
                })}
              </ScrollView>
            </View>
          ))}
          <PrimaryButton
            label={palette.id === 'custom' ? 'Using my colors' : 'Use my colors'}
            icon={palette.id === 'custom' ? 'checkmark' : undefined}
            disabled={!draft.every(isHex)}
            onPress={() => {
              setCustom(toColors(draft));
              setPaletteId('custom');
            }}
          />
        </Card>

        <Label style={{ marginTop: 22 }}>{palette.name}</Label>
        <Card style={{ padding: 16, marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 }}>
          {KEY_NAMES.map(([k, name]) => (
            <View key={k} style={[styles.row, { width: '50%', gap: 8 }]}>
              <View style={[styles.key, { backgroundColor: t[k], borderColor: t.line }]} />
              <Txt size={12} color="muted">
                {name} {t[k]}
              </Txt>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot3: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', flexDirection: 'row' },
  preview: { width: 30, height: 30, borderRadius: 8, borderWidth: 1 },
  hex: { width: 96, height: 36, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600' },
  swatch: { width: 34, height: 34, borderRadius: 10 },
  key: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
});

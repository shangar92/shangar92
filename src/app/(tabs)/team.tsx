import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { HeroScreen } from '../../components/HeroScreen';
import { Avatar, Card, GlassIcon, IconBox, Pill, Row, Txt } from '../../components/ui';
import { me, Person, team } from '../../data';
import { mix, useTheme } from '../../theme';

export default function TeamScreen() {
  const { t } = useTheme();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const status: Record<Person['status'], { label: string; fg: string; bg: string }> = {
    site: { label: 'On site', fg: t.green, bg: t.greenSoft },
    leave: { label: 'On leave', fg: t.amber, bg: t.amberSoft },
    off: { label: 'Off rotation', fg: t.chipInk, bg: t.chipSoft },
  };
  const count = (s: Person['status']) => team.filter((p) => p.status === s).length;
  const q = query.trim().toLowerCase();
  const people = team.filter((p) => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  const { day, length } = me.rotation;

  return (
    <HeroScreen
      designHeight={196}
      viewY={240}
      hero={
        <View style={[styles.between, { marginTop: 8 }]}>
          <View>
            <Txt size={13} color="#E4E7EF">
              Drilling Operations
            </Txt>
            <Txt size={24} weight="700" color="#FFFFFF" style={{ letterSpacing: -0.5 }}>
              Team
            </Txt>
          </View>
          <GlassIcon
            icon={searching ? 'close' : 'search'}
            onPress={() => {
              setSearching((s) => !s);
              setQuery('');
            }}
          />
        </View>
      }
    >
      <View style={styles.px}>
        {searching ? (
          <Card raised style={{ padding: 6, marginBottom: 12 }}>
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search name or role"
              placeholderTextColor={t.faint}
              style={[styles.search, { color: t.text, backgroundColor: t.field }]}
            />
          </Card>
        ) : null}
        <Card raised style={{ padding: 16 }}>
          <View style={styles.between}>
            <View style={[styles.row, { gap: 10 }]}>
              <IconBox icon="construct-outline" bg={t.amberSoft} fg={t.amber} size={36} iconSize={18} />
              <View>
                <Txt weight="700">
                  Your rotation · {length} / {length}
                </Txt>
                <Txt size={12} color="muted">
                  {me.rotation.field}
                </Txt>
              </View>
            </View>
            <Pill label="On site" fg={t.green} bg={t.greenSoft} />
          </View>
          <View style={[styles.row, { gap: 3, marginTop: 14 }]}>
            {Array.from({ length: length * 2 }, (_, i) => {
              const onSite = i < length;
              const today = i === day - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: today ? 28 : 20,
                    borderRadius: 4,
                    backgroundColor: onSite ? (i < day ? t.petrol : mix(t.petrol, t.surface, 0.55)) : t.track,
                    ...(today && { outlineWidth: 2, outlineColor: t.text, outlineOffset: 1, outlineStyle: 'solid' as const }),
                  }}
                />
              );
            })}
          </View>
          <View style={[styles.between, { marginTop: 8 }]}>
            <Txt size={12} color="muted">
              Day {day} of {length}
            </Txt>
            <Txt size={12} weight="600" color="petrol">
              Home from {me.rotation.homeFrom}
            </Txt>
          </View>
        </Card>
      </View>

      <View style={[styles.px, styles.row, { gap: 8, marginTop: 12 }]}>
        {(['site', 'leave', 'off'] as const).map((s) => (
          <Card key={s} style={styles.stat}>
            <Txt size={22} weight="700" color={status[s].fg}>
              {count(s)}
            </Txt>
            <Txt size={12} color="muted">
              {s === 'site' ? 'Available' : status[s].label}
            </Txt>
          </Card>
        ))}
      </View>

      <View style={[styles.px, { marginTop: 12 }]}>
        <Card style={{ paddingHorizontal: 16 }}>
          {people.map((p, i) => (
            <Row key={p.id} divider={i < people.length - 1} style={{ paddingVertical: 12 }}>
              <Avatar initials={p.initials} color={p.color} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{p.name}</Txt>
                <Txt size={12} color="muted">
                  {p.role}
                </Txt>
              </View>
              <Pill label={status[p.status].label} fg={status[p.status].fg} bg={status[p.status].bg} />
            </Row>
          ))}
          {people.length === 0 ? (
            <Txt color="muted" style={{ paddingVertical: 20, textAlign: 'center' }}>
              No one matches “{query}”.
            </Txt>
          ) : null}
        </Card>
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1, padding: 12, alignItems: 'center' },
  search: { height: 44, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
});

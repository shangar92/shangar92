import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { HeroScreen } from '../../components/HeroScreen';
import { DayMark, MonthGrid } from '../../components/MonthGrid';
import { Avatar, Card, GlassIcon, IconBox, Label, PrimaryButton, Row, Txt } from '../../components/ui';
import {
  formatShort,
  isWeekend,
  leaveTypeById,
  LeaveTypeId,
  leaveTypes,
  MONTHS_LONG,
  parseISO,
  personById,
  remainingDays,
  requestDays,
  team,
  toISO,
} from '../../data';
import { useStore } from '../../store';
import { useTheme } from '../../theme';
import { goBack } from '../../navigation';

function nextWorkingDay() {
  const d = new Date();
  do d.setDate(d.getDate() + 1);
  while (isWeekend(d));
  return toISO(d);
}

export default function NewRequestScreen() {
  const { t } = useTheme();
  const { requests, submit } = useStore();
  const params = useLocalSearchParams<{ id?: string; type?: LeaveTypeId }>();
  const editing = requests.find((r) => r.id === params.id);

  const [type, setType] = useState<LeaveTypeId>(editing?.type ?? (params.type && leaveTypeById[params.type] ? params.type : 'annual'));
  const [from, setFrom] = useState(editing?.from ?? nextWorkingDay());
  const [to, setTo] = useState(editing?.to ?? from);
  const [half, setHalf] = useState(editing?.half ?? false);
  const [handover, setHandover] = useState<string | undefined>(editing?.handover ?? 'rn');
  const [note, setNote] = useState(editing?.note ?? '');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [cursor, setCursor] = useState(() => {
    const d = parseISO(from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [choosingHandover, setChoosingHandover] = useState(false);

  const days = requestDays({ from, to, half });
  const left = remainingDays(requests, type, editing?.id);
  const total = leaveTypeById[type].total;
  const after = left === null ? null : left - days;
  const tooMany = after !== null && after < 0;
  const today = toISO(new Date());

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    for (let d = parseISO(from); d <= parseISO(to); d.setDate(d.getDate() + 1)) m[toISO(d)] = 'approved';
    return m;
  }, [from, to]);

  const openPicker = (which: 'from' | 'to') => {
    const d = parseISO(which === 'from' ? from : to);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setPicking(picking === which ? null : which);
  };

  const pickDay = (iso: string) => {
    if (picking === 'from' || half) {
      setFrom(iso);
      if (half || iso > to) setTo(iso);
    } else {
      if (iso < from) setFrom(iso);
      setTo(iso);
    }
    setPicking(null);
  };

  const onSubmit = () => {
    const id = submit({ type, from, to: half ? from : to, half, handover, note: note.trim() || undefined }, editing?.id);
    router.replace(`/request/${id}`);
  };

  const handoverPerson = handover ? personById[handover] : undefined;

  return (
    <HeroScreen
      designHeight={176}
      viewY={250}
      withTabBar={false}
      hero={
        <View style={[styles.row, { gap: 12, marginTop: 6 }]}>
          <GlassIcon icon="chevron-back" onPress={() => goBack()} />
          <Txt size={24} weight="700" color="#FFFFFF" style={{ letterSpacing: -0.5 }}>
            {editing ? 'Edit request' : 'New request'}
          </Txt>
        </View>
      }
      footer={
        <PrimaryButton
          style={{ flex: 1 }}
          label={editing ? 'Save and resubmit' : 'Submit request'}
          onPress={onSubmit}
          disabled={tooMany || days === 0}
        />
      }
    >
      <View style={styles.px}>
        <Card raised style={{ padding: 16 }}>
          <Label>Leave type</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {leaveTypes.map((lt) => {
              const on = lt.id === type;
              const rest = remainingDays(requests, lt.id, editing?.id);
              return (
                <Pressable
                  key={lt.id}
                  onPress={() => setType(lt.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[
                    styles.typeCard,
                    { borderColor: on ? t.petrol : t.line, backgroundColor: on ? t.petrolSoft : t.surface },
                  ]}
                >
                  <View style={styles.between}>
                    <IconBox
                      icon={lt.icon}
                      bg={on ? t.petrol : t.petrolSoft}
                      fg={on ? '#FFFFFF' : t.petrol}
                      size={32}
                      iconSize={17}
                    />
                    <View style={[styles.radio, on ? { borderWidth: 5, borderColor: t.petrol } : { borderColor: t.line }]} />
                  </View>
                  <Txt weight="700" style={{ marginTop: 8 }}>
                    {lt.short}
                  </Txt>
                  <Txt size={12} color="muted">
                    {rest === null ? 'Unlimited' : `${rest} days left`}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          <Label style={{ marginTop: 18 }}>Dates</Label>
          <View style={[styles.row, { gap: 8, marginTop: 10 }]}>
            <DateField label="FROM" value={formatShort(from)} active={picking === 'from'} onPress={() => openPicker('from')} />
            {!half ? <DateField label="TO" value={formatShort(to)} active={picking === 'to'} onPress={() => openPicker('to')} /> : null}
          </View>

          {picking ? (
            <View style={[styles.picker, { backgroundColor: t.field }]}>
              <View style={[styles.between, { marginBottom: 6 }]}>
                <Pressable
                  onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  hitSlop={8}
                  accessibilityLabel="Previous month"
                >
                  <Ionicons name="chevron-back" size={18} color={t.text} />
                </Pressable>
                <Txt weight="700">
                  Pick {picking === 'from' ? 'first' : 'last'} day · {MONTHS_LONG[cursor.getMonth()]} {cursor.getFullYear()}
                </Txt>
                <Pressable
                  onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  hitSlop={8}
                  accessibilityLabel="Next month"
                >
                  <Ionicons name="chevron-forward" size={18} color={t.text} />
                </Pressable>
              </View>
              <MonthGrid
                year={cursor.getFullYear()}
                month={cursor.getMonth()}
                marks={marks}
                onPressDay={pickDay}
                minDate={type === 'fingerprint' ? undefined : today}
              />
            </View>
          ) : null}

          <View style={[styles.segment, { backgroundColor: t.bg }]}>
            {[false, true].map((h) => (
              <Pressable
                key={String(h)}
                onPress={() => {
                  setHalf(h);
                  if (h) setTo(from);
                }}
                style={[styles.segmentItem, half === h && { backgroundColor: t.surface, boxShadow: `0 1px 4px ${t.shadow}` }]}
              >
                <Txt size={13} weight="600" color={half === h ? 'text' : 'muted'}>
                  {h ? 'Half day' : 'Full days'}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <View style={[styles.px, { marginTop: 12 }]}>
        <LinearGradient colors={[t.navy, t.navy2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Txt size={12} color="#B6C4D8">
              Working days
            </Txt>
            <Txt size={22} weight="700" color="#FFFFFF">
              {days} {days === 1 ? 'day' : 'days'}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F8BC85" />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Txt size={12} color="#B6C4D8">
              Balance after
            </Txt>
            {after === null ? (
              <Txt size={22} weight="700" color="#FFFFFF">
                Unlimited
              </Txt>
            ) : (
              <Txt size={22} weight="700" color={tooMany ? '#FF9B9B' : '#FFFFFF'}>
                {after}{' '}
                <Txt size={14} color="#B6C4D8">
                  / {total}
                </Txt>
              </Txt>
            )}
          </View>
        </LinearGradient>
        {tooMany ? (
          <Txt size={13} color="red" style={{ marginTop: 8 }}>
            Not enough {leaveTypeById[type].short.toLowerCase()} days left. Pick fewer days or another type.
          </Txt>
        ) : null}
        {days === 0 ? (
          <Txt size={13} color="red" style={{ marginTop: 8 }}>
            These dates are all weekend or holiday days.
          </Txt>
        ) : null}
      </View>

      <View style={[styles.px, { marginTop: 10 }]}>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          <Row divider onPress={() => setChoosingHandover((c) => !c)}>
            {handoverPerson ? (
              <Avatar initials={handoverPerson.initials} color={t.petrol} size={32} />
            ) : (
              <IconBox icon="person-add-outline" bg={t.bg} fg={t.text} size={32} iconSize={16} />
            )}
            <View style={{ flex: 1 }}>
              <Txt size={11} weight="600" color="faint">
                HANDOVER TO
              </Txt>
              <Txt weight="700">{handoverPerson?.name ?? 'No one'}</Txt>
            </View>
            <Ionicons name={choosingHandover ? 'chevron-up' : 'chevron-down'} size={18} color={t.faint} />
          </Row>
          {choosingHandover
            ? [...team.filter((p) => p.status === 'site'), undefined].map((p) => (
                <Row
                  key={p?.id ?? 'none'}
                  divider
                  onPress={() => {
                    setHandover(p?.id);
                    setChoosingHandover(false);
                  }}
                  style={{ paddingLeft: 44 }}
                >
                  <Txt style={{ flex: 1 }} weight={p?.id === handover ? '700' : '400'}>
                    {p ? `${p.name} · ${p.role}` : 'No handover'}
                  </Txt>
                  {p?.id === handover ? <Ionicons name="checkmark" size={18} color={t.petrol} /> : null}
                </Row>
              ))
            : null}
          <Row>
            <IconBox icon="attach" bg={t.bg} fg={t.text} size={32} iconSize={16} />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              placeholderTextColor={t.muted}
              multiline
              style={[styles.note, { color: t.text }]}
            />
          </Row>
        </Card>
      </View>
    </HeroScreen>
  );
}

function DateField({ label, value, active, onPress }: { label: string; value: string; active: boolean; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.field, { backgroundColor: t.field, borderColor: active ? t.petrol : 'transparent' }]}
    >
      <Txt size={11} weight="600" color="faint">
        {label}
      </Txt>
      <View style={styles.between}>
        <Txt size={15} weight="700">
          {value}
        </Txt>
        <Ionicons name="calendar-outline" size={16} color={t.faint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeCard: { width: 128, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  field: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1.5 },
  picker: { marginTop: 10, borderRadius: 16, padding: 10 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, marginTop: 10 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  summary: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  note: { flex: 1, fontSize: 14, paddingVertical: 4, minHeight: 32 },
});

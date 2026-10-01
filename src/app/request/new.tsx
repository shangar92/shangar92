// Request day off (or change one), following the website's request form rule
// for rule: what the request costs, whether the balance covers it, monthly and
// per-request limits, overlaps, reasons and documents, and who has to sign.
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { HeroTitle } from '../../components/Hero';
import { HeroScreen } from '../../components/HeroScreen';
import { DocButton } from '../../components/leave';
import { DayMark, MonthGrid } from '../../components/MonthGrid';
import { Card, Label, PrimaryButton, Txt } from '../../components/ui';
import { isoLocal, isRealDate, parseLocalDate, round1 } from '../../lib/dates';
import { PickedFile, uploadLeaveDoc } from '../../lib/files';
import { isRtl, longDay, MONTHS, TL } from '../../lib/i18n';
import {
  alreadyTakenOnce,
  approvalChainFor,
  balanceFor,
  daysPerPeriod,
  fmtBal,
  HOURLY_CODE,
  HOURS_PER_DAY,
  isHoliday,
  isWorkingDay,
  leaveDaysCharged,
  leaveTypeLabel,
  leaveYearOf,
  overlappingLeave,
  policyFor,
  resolveApprover,
  typeAllowedFor,
  typesFor,
  usedInPeriod,
} from '../../lib/rules';
import type { LeaveDoc, Person } from '../../lib/types';
import { goBack } from '../../navigation';
import { useData } from '../../state/data';
import { useFeedback } from '../../state/feedback';
import { useSession, useT } from '../../state/session';
import { useTheme } from '../../theme';

const RED = '#DC2626';

export default function RequestScreen() {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const rtl = isRtl(lang);
  const { toast } = useFeedback();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { me: meLive, emps, admins, depts, lvs: lvsAll, leavePolicies, submitLeave, saveMine } = useData();
  const initial = params.id ? lvsAll.find((l) => l.id === params.id && l.empId === meLive.id) : undefined;
  // The request being edited is left out of every check against itself.
  const lvs = initial ? lvsAll.filter((l) => l.id !== initial.id) : lvsAll;
  const me: Person = useMemo(
    () => emps.find((e) => e.id === meLive.id) || { id: meLive.id, fullName: meLive.fullName, shiftType: '8' },
    [emps, meLive.id, meLive.fullName],
  );
  const availTypes = typesFor(me);

  const startDate = isRealDate(params.date) ? String(params.date) : '';
  const [type, setType] = useState(initial?.type || 'P');
  const [from, setFrom] = useState(initial?.from || startDate);
  const [to, setTo] = useState(initial?.to || initial?.from || startDate);
  const [reason, setReason] = useState(initial?.reason || '');
  const [halfDay, setHalfDay] = useState(!!initial?.halfDay);
  const [hours, setHours] = useState(initial?.hours ? String(initial.hours) : '1');
  const [doc, setDoc] = useState<LeaveDoc | null>(initial?.doc || null);
  const [docBusy, setDocBusy] = useState(false);
  const [docErr, setDocErr] = useState('');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [cursor, setCursor] = useState(() => {
    const d = from ? parseLocalDate(from) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // A type switched off for this person can't be chosen.
  useEffect(() => {
    if (initial) return;
    if (availTypes.length && !availTypes.some((x) => x.code === type)) setType(availTypes[0].code);
  }, [availTypes, type, initial]);

  const isHourly = type === HOURLY_CODE;
  useEffect(() => {
    if (isHourly && from && to !== from) setTo(from);
  }, [isHourly, from, to]);

  const apr = resolveApprover(meLive, emps, admins, depts);
  // Availability is judged as of the day the leave starts, so booking ahead works.
  const start = from ? parseLocalDate(from) : new Date();
  const year = leaveYearOf(from || new Date());
  const pol = policyFor(type, leavePolicies, me);
  const bal = balanceFor(me, type, lvs, leavePolicies, year, start);
  const singleDay = !!from && from === to;
  const effHalf = halfDay && !!pol.allowHalfDay && singleDay;
  const days = from && to && to >= from ? leaveDaysCharged({ from, to, halfDay: effHalf, type }, me, pol) : 0;
  const cap = bal.available != null ? bal.available : bal.remaining;
  const over = cap != null && days > cap;
  const overMax = pol.maxPerRequest > 0 && days > pol.maxPerRequest;
  const exceeds = over || overMax;
  const mayExceed = !!pol.allowOverBalance;
  const exhausted = cap != null && cap <= 0 && !mayExceed;
  const clashes = overlappingLeave(lvs, meLive.id, from, to);
  const chain = useMemo(
    () =>
      from && to
        ? approvalChainFor({ emp: me, type, from, to, halfDay: effHalf, days, lvs, policies: leavePolicies, emps, admins, depts, exceeds })
        : apr
          ? [{ id: apr.id, name: apr.name, stage: 'manager' }]
          : [],
    [from, to, me, type, effHalf, days, lvs, leavePolicies, emps, admins, depts, exceeds, apr],
  );

  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {};
    if (!from || !to || to < from) return m;
    for (let d = parseLocalDate(from); d <= parseLocalDate(to); d.setDate(d.getDate() + 1)) m[isoLocal(d)] = 'approved';
    return m;
  }, [from, to]);

  function openPicker(which: 'from' | 'to') {
    const base = (which === 'from' ? from : to) || from;
    const d = base ? parseLocalDate(base) : new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setPicking(picking === which ? null : which);
  }
  function pickDay(iso: string) {
    if (picking === 'from' || isHourly) {
      setFrom(iso);
      if (isHourly || !isRealDate(to) || to < iso) setTo(iso);
    } else {
      if (!from || iso < from) setFrom(iso);
      setTo(iso);
    }
    setPicking(null);
  }

  async function attach(kind: 'photo' | 'file') {
    setDocErr('');
    let picked: PickedFile | null = null;
    if (kind === 'photo') {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      picked = { uri: a.uri, name: a.fileName || 'photo.jpg', mimeType: a.mimeType || 'image/jpeg', width: a.width, height: a.height };
    } else {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      picked = { uri: a.uri, name: a.name, mimeType: a.mimeType };
    }
    setDocBusy(true);
    try {
      setDoc(await uploadLeaveDoc(picked));
    } catch (err: any) {
      setDocErr(
        err?.message === 'file-too-large'
          ? tr('فایلەکە زۆر گەورەیە — فایلێکی بچووکتر یان وێنەیەک ئەپلۆد بکە', 'That file is too large — upload a smaller one, or a photo', 'الملف كبير جدًا — ارفع ملفًا أصغر أو صورة')
          : tr('ئەپلۆد سەرکەوتوو نەبوو', 'Upload failed', 'فشل الرفع'),
      );
    }
    setDocBusy(false);
  }

  function send() {
    if (!apr) return;
    const say = (ku: string, en: string, ar: string) => toast(tr(ku, en, ar));
    const finish = (r: Parameters<typeof submitLeave>[0]) => {
      if (initial) saveMine(initial, r);
      else submitLeave(r);
      goBack();
    };
    if (isHourly) {
      if (!from) return say('بەروار دیاری بکە', 'Pick a date', 'اختر تاريخًا');
      const d = parseLocalDate(from);
      if (isHoliday(d, me.id)) return say('ئەو ڕۆژە پشووی فەرمییە — ناتوانرێت مۆڵەتی کاتژمێری لێ وەربگیرێت', "That day is an official holiday — hourly leave can't be taken on it", 'ذلك اليوم عطلة رسمية — لا يمكن أخذ إجازة ساعية فيه');
      if (!isWorkingDay(me, d)) return say('ئەو ڕۆژە ڕۆژی پشووتە (هەینی/شەممە یان پشووی ڕۆتا) — ڕۆژێکی کار هەڵبژێرە', 'That is a rest day (Friday/Saturday or a rota day off) — pick a working day', 'ذلك يوم راحة (الجمعة/السبت أو راحة المناوبة) — اختر يوم عمل');
      if (!availTypes.some((x) => x.code === type)) return say('ئەم جۆرە مۆڵەتە ئێستا کوژێنراوەتەوە', 'This leave type is switched off', 'نوع الإجازة هذا معطل');
      const h = Number(hours);
      if (!h || h <= 0) return say('ژمارەی کاتژمێر بنووسە', 'Enter the number of hours', 'أدخل عدد الساعات');
      if (h > HOURS_PER_DAY) return say('ناتوانێت لە ٨ کاتژمێر زیاتر بێت — مۆڵەتی ڕۆژانە بەکاربهێنە', 'More than 8 hours — use a day-based leave type', 'أكثر من 8 ساعات — استخدم نوع إجازة بالأيام');
      return finish({ type, from, to: from, reason, halfDay: false, doc, hours: h, days: 0, chain, approverId: chain[0]?.id || apr.id });
    }
    if (!from || !to) return say('بەرواری دەستپێک و کۆتایی دیاری بکە', 'Pick a start and end date', 'اختر تاريخ البداية والنهاية');
    if (to < from) return say("بەرواری 'بۆ' ناتوانێت پێش بەرواری 'لە' بێت", "The 'To' date can't be before the 'From' date", "لا يمكن أن يكون تاريخ 'إلى' قبل تاريخ 'من'");
    if (days <= 0) {
      let allHol = true;
      for (let d = parseLocalDate(from); d <= parseLocalDate(to); d.setDate(d.getDate() + 1)) if (!isHoliday(d)) allHol = false;
      return allHol
        ? say('ئەم ڕۆژانە پشووی فەرمین — پێویست بە مۆڵەت ناکات', 'These days are official holidays — no leave is needed', 'هذه الأيام عطل رسمية — لا حاجة لإجازة')
        : say('ئەم ماوەیە تەنها ڕۆژی پشووی تێدایە (هەینی/شەممە) — لە مۆڵەت کەم ناکرێتەوە', 'This range is only rest days (Fri/Sat) — nothing would be deducted', 'هذه الفترة أيام راحة فقط (الجمعة/السبت) — لن يُخصم شيء');
    }
    if (pol.requiresReason && !reason.trim()) return say('ئەم جۆرە مۆڵەتە هۆکاری پێویستە', 'This leave type needs a reason', 'هذا النوع يتطلب سببًا');
    if (!typeAllowedFor(me, type)) return say('ئەم جۆرە مۆڵەتە بۆ تۆ چالاک نەکراوە', "This leave type isn't enabled for you", 'هذا النوع غير مفعل لك');
    if (!availTypes.some((x) => x.code === type)) return say('ئەم جۆرە مۆڵەتە ئێستا کوژێنراوەتەوە', 'This leave type is switched off', 'نوع الإجازة هذا معطل');
    if ((pol.onceOnly || pol.lifetimeOnce) && alreadyTakenOnce(me, type, lvs))
      return say('ئەم جۆرە مۆڵەتە تەنها یەک جار لە تەواوی کاتدا وەردەگیرێت — بۆ کردنەوەی دووبارە پەیوەندی بە ئادمین بکە', 'This leave can only be taken once ever — ask an administrator to reopen it', 'هذه الإجازة تؤخذ مرة واحدة فقط — اطلب من المسؤول إعادة فتحها');
    if (pol.maxPerRequest > 0 && days > pol.maxPerRequest && !mayExceed)
      return say('لە یەک داواکاریدا زۆرترین ' + pol.maxPerRequest + ' ڕۆژە — زیاتری تەنها لەلایەن ئادمینەوە', 'At most ' + pol.maxPerRequest + ' days per request — more must be granted by an administrator', 'الحد الأقصى ' + pol.maxPerRequest + ' أيام لكل طلب — الأكثر يمنحه المسؤول');
    if (pol.maxPerMonth > 0) {
      const split = daysPerPeriod(from, to, me, pol, effHalf, type);
      for (const per of Object.keys(split)) {
        const already = usedInPeriod(me, type, lvs, leavePolicies, per);
        if (already + split[per] > pol.maxPerMonth)
          return say(
            'لە دەورەی ' + per + ' زۆرترین ' + pol.maxPerMonth + ' ڕۆژ دەکرێت (بەکارهاتوو: ' + round1(already) + ')',
            'At most ' + pol.maxPerMonth + ' day(s) in the ' + per + ' period (already used: ' + round1(already) + ')',
            'الحد الأقصى ' + pol.maxPerMonth + ' يوم في فترة ' + per + ' (المستخدم: ' + round1(already) + ')',
          );
      }
    }
    if (clashes.length) {
      const c = clashes[0];
      return say(
        'ئەم بەروارانە پێشتر داوا کراون (' + leaveTypeLabel(c.type, lang) + ' ' + c.from + ' → ' + c.to + ')',
        'These dates already have a request (' + leaveTypeLabel(c.type, lang) + ' ' + c.from + ' → ' + c.to + ')',
        'هذه التواريخ لديها طلب مسبق (' + leaveTypeLabel(c.type, lang) + ' ' + c.from + ' → ' + c.to + ')',
      );
    }
    if (over && !pol.allowNegative && !mayExceed)
      return pol.accrual
        ? say('ئەم بڕە هێشتا کۆنەکراوەتەوە — ناتوانیت مۆڵەتی مانگەکانی داهاتوو پێشوەخت وەربگریت', "You haven't accrued these days yet — future months can't be taken in advance", 'لم تكتسب هذه الأيام بعد — لا يمكن أخذ أيام الأشهر القادمة مسبقًا')
        : say('ماوەی مۆڵەتت بەشی ئەمە ناکات', "You don't have enough balance for this request", 'رصيدك لا يكفي لهذا الطلب');
    if (pol.requiresDocument && !doc) return say('پێویستە بەڵگەنامەی پزیشکی ئەپلۆد بکەیت (وێنە یان PDF)', 'A supporting document must be uploaded (image or PDF)', 'يجب رفع مستند داعم (صورة أو PDF)');
    finish({ type, from, to, reason, halfDay: effHalf, doc, days, chain, approverId: chain[0]?.id || apr.id });
  }

  const blocked = !apr || (!isHourly && (exhausted || clashes.length > 0));
  const hourlyRest = isHourly && from ? (isHoliday(parseLocalDate(from), me.id) ? 'hol' : !isWorkingDay(me, parseLocalDate(from)) ? 'rest' : null) : null;

  return (
    <HeroScreen
      designHeight={176}
      withTabBar={false}
      hero={<HeroTitle back title={initial ? tr('گۆڕینی داواکاری مۆڵەت', 'Change leave request', 'تغيير طلب الإجازة') : tr('داواکاری مۆڵەت', 'Request day off', 'طلب إجازة')} />}
      footer={
        <PrimaryButton
          style={{ flex: 1 }}
          icon="send"
          label={initial ? tr('ناردن بۆ ئەپروڤی دووبارە', 'Send for approval again', 'إرسال للموافقة مجددًا') : tr('ناردن', 'Send', 'إرسال')}
          onPress={send}
          disabled={blocked}
        />
      }
    >
      <View style={[styles.px, { gap: 12 }]}>
        <Card raised style={{ padding: 16, gap: 10 }}>
          <Label>{tr('جۆری مۆڵەت', 'Leave type', 'نوع الإجازة')}</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {availTypes.map((lt) => {
              const on = lt.code === type;
              const b = balanceFor(me, lt.code, lvs, leavePolicies, year, start);
              const left = lt.code === HOURLY_CODE ? null : b.available != null ? b.available : b.remaining;
              return (
                <Pressable
                  key={lt.code}
                  onPress={() => {
                    setType(lt.code);
                    setHalfDay(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.typeCard, { borderColor: on ? lt.color : t.line, backgroundColor: on ? lt.color + '1c' : t.surface }]}
                >
                  <View style={[styles.between]}>
                    <View style={[styles.swatch, { backgroundColor: lt.color }]} />
                    <View style={[styles.radio, on ? { borderWidth: 5, borderColor: lt.color } : { borderColor: t.line }]} />
                  </View>
                  <Txt weight="700" numberOfLines={2} style={{ marginTop: 8 }}>
                    {TL(lang, lt)}
                  </Txt>
                  <Txt size={11.5} color="muted">
                    {left == null ? tr('بێ سنوور', 'Unlimited', 'غير محدود') : fmtBal(left, b) + ' ' + tr('ماوە', 'left', 'متبقٍ')}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          <Label style={{ marginTop: 8 }}>{isHourly ? tr('بەروار', 'Date', 'التاريخ') : tr('بەروار', 'Dates', 'التواريخ')}</Label>
          <View style={[styles.row, { gap: 8 }]}>
            <DateField label={tr('لە', 'From', 'من')} value={from} active={picking === 'from'} onPress={() => openPicker('from')} />
            {!isHourly ? <DateField label={tr('بۆ', 'To', 'إلى')} value={to} active={picking === 'to'} onPress={() => openPicker('to')} /> : null}
          </View>
          {picking ? (
            <View style={[styles.picker, { backgroundColor: t.field }]}>
              <View style={[styles.between, { marginBottom: 6 }]}>
                <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} hitSlop={8} accessibilityLabel={tr('مانگی پێشوو', 'Previous month', 'الشهر السابق')}>
                  <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={18} color={t.text} />
                </Pressable>
                <Txt weight="700">
                  {MONTHS[lang][cursor.getMonth()]} {cursor.getFullYear()}
                </Txt>
                <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} hitSlop={8} accessibilityLabel={tr('مانگی داهاتوو', 'Next month', 'الشهر التالي')}>
                  <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={t.text} />
                </Pressable>
              </View>
              <MonthGrid year={cursor.getFullYear()} month={cursor.getMonth()} marks={marks} onPressDay={pickDay} empId={me.id} />
            </View>
          ) : null}

          {isHourly ? (
            <View style={{ gap: 6 }}>
              <Label>{tr('ژمارەی کاتژمێر', 'Number of hours', 'عدد الساعات')}</Label>
              <TextInput value={hours} onChangeText={setHours} keyboardType="decimal-pad" style={[styles.input, { color: t.text, backgroundColor: t.field, textAlign: rtl ? 'right' : 'left' }]} />
            </View>
          ) : null}

          {!isHourly && pol.allowHalfDay && singleDay ? (
            <Pressable onPress={() => setHalfDay((h) => !h)} style={[styles.row, { gap: 10, paddingVertical: 4 }]} accessibilityRole="checkbox" accessibilityState={{ checked: halfDay }}>
              <Ionicons name={halfDay ? 'checkbox' : 'square-outline'} size={22} color={halfDay ? t.petrol : t.muted} />
              <Txt weight="600">{tr('نیو ڕۆژ', 'Half day', 'نصف يوم')}</Txt>
            </Pressable>
          ) : null}

          <View style={{ gap: 6 }}>
            <Label>
              {tr('هۆکار', 'Reason', 'السبب')}
              {pol.requiresReason ? <Txt color={RED}> *</Txt> : null}
            </Label>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              style={[styles.input, { minHeight: 76, textAlignVertical: 'top', color: t.text, backgroundColor: t.field, textAlign: rtl ? 'right' : 'left' }]}
            />
          </View>

          {pol.requiresDocument ? (
            <View style={{ gap: 8 }}>
              <Label>
                {tr('بەڵگەنامەی پزیشکی (وێنە یان PDF)', 'Medical document (image or PDF)', 'مستند طبي (صورة أو PDF)')}
                <Txt color={RED}> *</Txt>
              </Label>
              {doc ? (
                <View style={[styles.row, { gap: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <DocButton doc={doc} />
                  </View>
                  <Pressable onPress={() => setDoc(null)} hitSlop={8} accessibilityLabel={tr('لابردن', 'Remove', 'إزالة')}>
                    <Ionicons name="close-circle" size={22} color={RED} />
                  </Pressable>
                </View>
              ) : docBusy ? (
                <View style={[styles.row, { gap: 8 }]}>
                  <ActivityIndicator size="small" color={t.muted} />
                  <Txt size={12.5} weight="700" color="muted">
                    {tr('ئەپلۆد دەکرێت…', 'Uploading…', 'جارٍ الرفع…')}
                  </Txt>
                </View>
              ) : (
                <View style={[styles.row, { gap: 8 }]}>
                  <AttachButton icon="image-outline" label={tr('وێنە', 'Photo', 'صورة')} onPress={() => attach('photo')} />
                  <AttachButton icon="document-outline" label={tr('فایل / PDF', 'File / PDF', 'ملف / PDF')} onPress={() => attach('file')} />
                </View>
              )}
              {docErr ? (
                <Txt size={12} weight="700" color={RED}>
                  {docErr}
                </Txt>
              ) : null}
            </View>
          ) : null}
        </Card>

        {clashes.length > 0 ? <Line tone={RED}>{tr('ئەم بەروارانە پێشتر داواکارییان هەیە', 'These dates already have a request', 'هذه التواريخ لديها طلب مسبق')}</Line> : null}
        {hourlyRest ? (
          <Line tone={RED}>
            {hourlyRest === 'hol'
              ? tr('ئەو ڕۆژە پشووی فەرمییە', 'That day is an official holiday', 'ذلك اليوم عطلة رسمية')
              : tr('ئەو ڕۆژە ڕۆژی پشووتە — ڕۆژێکی کار هەڵبژێرە', 'That is a rest day — pick a working day', 'ذلك يوم راحة — اختر يوم عمل')}
          </Line>
        ) : null}
        {(isHourly ? Number(hours) > 0 : days > 0) ? (
          <Line tone={t.text}>
            {tr('ئەمە بەکاردێنێت: ', 'This will use: ', 'سيستخدم هذا: ')}
            <Txt weight="800">{isHourly ? round1(Number(hours)) : days}</Txt> {isHourly ? tr('کاتژمێر', 'hour(s)', 'ساعة') : tr('ڕۆژ', 'day(s)', 'يوم')}
            {!isHourly && bal.available != null ? '  ·  ' + tr('بەردەست: ', 'available: ', 'المتاح: ') + fmtBal(bal.available, bal) : ''}
          </Line>
        ) : null}
        {!isHourly && days > 0 && over ? <Line tone={RED}>{tr('لە ماوەکەت زیاترە', 'This is more than your balance', 'هذا أكثر من رصيدك')}</Line> : null}
        {exhausted ? <Line tone={RED}>{tr('ماوەی ئەم جۆرە تەواو بووە', 'You have used all of this leave type', 'لقد استخدمت كل رصيد هذا النوع')}</Line> : null}
        <Line tone={apr ? t.text : RED}>
          {apr ? (
            <>
              {tr('دەنێردرێت بۆ: ', 'Sent to: ', 'يُرسل إلى: ')}
              <Txt weight="800">{(chain.length ? chain.map((c) => c.name) : [apr.name]).join(rtl ? ' ← ' : ' → ')}</Txt>
            </>
          ) : (
            tr('هێشتا بەڕێوەبەرێک دیاری نەکراوە.', 'No manager is set up yet.', 'لم يُحدد مدير بعد.')
          )}
        </Line>
      </View>
    </HeroScreen>
  );

  function DateField({ label, value, active, onPress }: { label: string; value: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable onPress={onPress} style={[styles.field, { backgroundColor: t.field, borderColor: active ? t.petrol : 'transparent' }]}>
        <Txt size={11} weight="700" color="faint">
          {label}
        </Txt>
        <View style={styles.between}>
          <Txt size={14.5} weight="700">
            {value ? longDay(parseLocalDate(value), lang) : '—'}
          </Txt>
          <Ionicons name="calendar-outline" size={16} color={t.faint} />
        </View>
      </Pressable>
    );
  }
}

function AttachButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.attach, { borderColor: t.line, backgroundColor: t.field }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={18} color={t.petrol} />
      <Txt size={13} weight="700">
        {label}
      </Txt>
    </Pressable>
  );
}

function Line({ children, tone }: { children: React.ReactNode; tone: string }) {
  const { t } = useTheme();
  return (
    <View style={[styles.line, { backgroundColor: tone === RED ? RED + '14' : t.surface, borderColor: tone === RED ? RED + '44' : t.line }]}>
      <Txt size={13} weight={tone === RED ? '700' : '500'} color={tone}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeCard: { width: 132, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  swatch: { width: 26, height: 26, borderRadius: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  field: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1.5, gap: 2 },
  picker: { borderRadius: 16, padding: 10 },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  attach: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  line: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
});

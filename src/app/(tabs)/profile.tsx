// Profile: your photo, password, language, app colors and work details.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { HeroScreen } from '../../components/HeroScreen';
import { PersonAvatar } from '../../components/PersonAvatar';
import { Card, GhostButton, IconBox, Row, Txt } from '../../components/ui';
import { dmy } from '../../lib/dates';
import { auth } from '../../lib/firebase';
import { isRtl, LANGS } from '../../lib/i18n';
import { deptName } from '../../lib/rules';
import { useData } from '../../state/data';
import { useFeedback } from '../../state/feedback';
import { useSession, useT } from '../../state/session';
import { useTheme } from '../../theme';

function photoErrorText(err: any, tr: ReturnType<typeof useT>) {
  const code = String((err && (err.code || err.message)) || '');
  if (/permission|insufficient/i.test(code)) return tr('ڕێساکانی داتابەیس ڕێگە بە نووسین نادەن.', 'The database rules are blocking the write.', 'قواعد قاعدة البيانات تمنع الحفظ.');
  if (/unreadable-image/.test(code)) return tr('ئەم فایلە وەک وێنە ناخوێندرێتەوە — JPG یان PNG هەڵبژێرە.', "That file couldn't be read as an image — pick a JPG or PNG.", 'تعذرت قراءة الملف كصورة — اختر JPG أو PNG.');
  if (/image-too-large/.test(code)) return tr('وێنەکە زۆر گەورەیە — وێنەیەکی بچووکتر هەڵبژێرە.', 'That image is too large — choose a smaller one.', 'الصورة كبيرة جدًا — اختر صورة أصغر.');
  return tr('وێنەکە پاشەکەوت نەکرا.', "The photo couldn't be saved.", 'تعذر حفظ الصورة.');
}

export default function ProfileTab() {
  const { t, palette } = useTheme();
  const tr = useT();
  const { lang, setLang, logout } = useSession();
  const { toast, confirm } = useFeedback();
  const { me, depts, setMyPhoto } = useData();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const rtl = isRtl(lang);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setBusy(true);
    setErr('');
    const e = await setMyPhoto({ uri: a.uri, width: a.width, height: a.height });
    if (e) setErr(photoErrorText(e, tr));
    setBusy(false);
  }
  async function removePhoto() {
    setBusy(true);
    await setMyPhoto(null);
    setBusy(false);
  }
  async function changePassword() {
    if (!me.email) return toast(tr('ئیمەیل تۆمار نەکراوە', 'No email on file', 'لا يوجد بريد إلكتروني مسجل'));
    try {
      await sendPasswordResetEmail(auth, me.email);
      toast(tr('بەستەری گۆڕینی پاسۆرد نێردرا بۆ ئیمەیلەکەت', 'A reset link has been sent to your email', 'تم إرسال رابط إعادة التعيين إلى بريدك'));
    } catch (e) {
      console.error(e);
      toast(tr('ناردن شکستی هێنا', "Couldn't send the email", 'تعذر إرسال البريد'));
    }
  }
  async function doLogout() {
    const ok = await confirm({
      title: tr('چوونەدەرەوە', 'Log out', 'تسجيل الخروج'),
      yes: tr('چوونەدەرەوە', 'Log out', 'تسجيل الخروج'),
      no: tr('پاشگەزبوونەوە', 'Cancel', 'إلغاء'),
      danger: true,
    });
    if (ok) logout();
  }

  const details: [string, string][] = [
    [tr('کۆدی HR', 'HR code', 'رمز الموارد البشرية'), me.hrCode || '—'],
    [tr('پۆزشن', 'Position', 'المنصب'), me.position || '—'],
    [tr('ژمارەی مۆبایل', 'Mobile', 'رقم الهاتف'), me.mobile || '—'],
    [tr('ئیمەیل', 'Email', 'البريد الإلكتروني'), me.email || '—'],
    [tr('ڕێکەوتی دامەزراندن', 'Hire date', 'تاريخ التعيين'), dmy(me.hireDate)],
  ];
  const chevron = rtl ? 'chevron-back' : 'chevron-forward';

  return (
    <HeroScreen
      designHeight={250}
      viewY={160}
      hero={
        <View style={{ alignItems: 'center', marginTop: 8, gap: 4 }}>
          <View style={styles.avatarRing}>
            <PersonAvatar person={me} size={76} />
          </View>
          <Txt size={20} weight="700" color="#FFFFFF" style={{ textAlign: 'center' }}>
            {me.fullName || '—'}
          </Txt>
          <Txt size={13} color="#E4E7EF" style={{ textAlign: 'center' }}>
            {deptName(me, depts)}
          </Txt>
        </View>
      }
    >
      <View style={[styles.px, { gap: 12 }]}>
        <Card raised style={{ paddingHorizontal: 16 }}>
          <Row divider onPress={busy ? undefined : pickPhoto}>
            <IconBox icon="camera-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              {me.photoUrl ? tr('گۆڕینی وێنە', 'Change photo', 'تغيير الصورة') : tr('دانانی وێنە', 'Set photo', 'إضافة صورة')}
            </Txt>
            {busy ? <ActivityIndicator size="small" color={t.muted} /> : <Ionicons name={chevron} size={18} color={t.faint} />}
          </Row>
          {me.photoUrl && !busy ? (
            <Row divider onPress={removePhoto}>
              <IconBox icon="trash-outline" bg={t.redSoft} fg={t.red} size={36} iconSize={19} />
              <Txt weight="700" color="red" style={{ flex: 1 }}>
                {tr('سڕینەوەی وێنە', 'Remove photo', 'إزالة الصورة')}
              </Txt>
            </Row>
          ) : null}
          {err ? (
            <Txt size={12} color="red" style={{ paddingVertical: 6 }}>
              {err}
            </Txt>
          ) : null}
          <Row divider onPress={changePassword}>
            <IconBox icon="lock-closed-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              {tr('گۆڕینی پاسۆرد', 'Change password', 'تغيير كلمة المرور')}
            </Txt>
            <Ionicons name={chevron} size={18} color={t.faint} />
          </Row>
          <View style={{ paddingVertical: 11, gap: 10 }}>
            <View style={[styles.row, { gap: 12 }]}>
              <IconBox icon="globe-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
              <Txt weight="700">{tr('زمان', 'Language', 'اللغة')}</Txt>
            </View>
            <View style={[styles.langs, { backgroundColor: t.field }]}>
              {LANGS.map((l) => (
                <Pressable key={l.id} onPress={() => setLang(l.id)} style={[styles.lang, lang === l.id && { backgroundColor: t.surface }]}>
                  <Txt size={13} weight={lang === l.id ? '700' : '500'} color={lang === l.id ? 'text' : 'muted'} style={{ textAlign: 'center' }}>
                    {l.label}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
          <Row onPress={() => router.push('/colors')} style={{ borderTopWidth: 1, borderTopColor: t.line }}>
            <IconBox icon="color-palette-outline" bg={t.bg} fg={t.text} size={36} iconSize={19} />
            <Txt weight="700" style={{ flex: 1 }}>
              {tr('ڕەنگەکانی ئەپ', 'App colors', 'ألوان التطبيق')}
            </Txt>
            <Txt size={13} color="muted">
              {palette.name}
            </Txt>
            <Ionicons name={chevron} size={18} color={t.faint} />
          </Row>
        </Card>

        <Txt size={13} weight="800" color="petrol" style={{ marginTop: 6 }}>
          {tr('زانیاری کار', 'Employment details', 'بيانات العمل')}
        </Txt>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {details.map(([k, v], i) => (
            <Row key={k} divider={i < details.length - 1} style={{ justifyContent: 'space-between' }}>
              <Txt color="muted">{k}</Txt>
              <Txt weight="700" style={{ flexShrink: 1, textAlign: rtl ? 'left' : 'right', writingDirection: 'ltr' }} numberOfLines={1}>
                {v}
              </Txt>
            </Row>
          ))}
        </Card>
        <Txt size={12} color="muted">
          {tr('ئەم زانیارییانە تەنها لەلایەن HRـەوە دەگۆڕدرێن.', 'These details can only be changed by HR.', 'لا يمكن تغيير هذه البيانات إلا من قبل الموارد البشرية.')}
        </Txt>

        <GhostButton label={tr('چوونەدەرەوە', 'Log out', 'تسجيل الخروج')} color={t.red} onPress={doLogout} style={{ marginTop: 8 }} />
      </View>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  px: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { borderRadius: 42, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', padding: 2 },
  langs: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  lang: { flex: 1, paddingVertical: 8, borderRadius: 9 },
});

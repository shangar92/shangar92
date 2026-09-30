// Screens shown before the app itself: loading, sign in, a suspended account,
// and choosing a new password after starting with the shared one. Wording
// follows the Day Off website.

import { ReactNode, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGS } from '../lib/i18n';
import { INITIAL_PASSWORD } from '../lib/rules';
import { useSession, useT } from '../state/session';
import { useTheme } from '../theme';
import { SunsetScene } from './SunsetScene';
import { Card, GhostButton, PrimaryButton, Txt } from './ui';

export const APP_NAME = 'Khurmalla Day Off';

function Shell({ children }: { children: ReactNode }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="light" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340 }}>
        <SunsetScene height={340} viewY={150} viewHeight={340} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }}
        >
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', gap: 18 }}>
            <Txt size={24} weight="800" color="#FFFFFF" style={{ textAlign: 'center' }}>
              {APP_NAME}
            </Txt>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, value, onChange, secure, email, onSubmit }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; email?: boolean; onSubmit?: () => void }) {
  const { t } = useTheme();
  const tr = useT();
  const { lang } = useSession();
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt size={12.5} weight="700" color="muted">
        {label}
      </Txt>
      <View style={[styles.inputWrap, { backgroundColor: t.field, borderColor: t.line }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={email ? 'email-address' : 'default'}
          textContentType={email ? 'emailAddress' : secure ? 'password' : 'none'}
          autoComplete={email ? 'email' : secure ? 'password' : 'off'}
          onSubmitEditing={onSubmit}
          placeholder={email ? 'you@karfield.local' : undefined}
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.text, textAlign: email || lang === 'en' ? 'left' : 'right' }]}
        />
        {secure ? (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8} accessibilityLabel={show ? tr('شاردنەوە', 'Hide', 'إخفاء') : tr('پیشاندان', 'Show', 'إظهار')}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LangPicker() {
  const { t } = useTheme();
  const { lang, setLang } = useSession();
  return (
    <View style={[styles.langs, { backgroundColor: t.field }]}>
      {LANGS.map((l) => (
        <Pressable key={l.id} onPress={() => setLang(l.id)} style={[styles.lang, lang === l.id && { backgroundColor: t.surface }]}>
          <Txt size={13} weight={lang === l.id ? '700' : '500'} color={lang === l.id ? 'text' : 'muted'} style={{ textAlign: 'center' }}>
            {l.label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function LoadingScreen({ text }: { text?: string }) {
  const { t } = useTheme();
  const tr = useT();
  return (
    <View style={[styles.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color={t.acc} />
      <Txt weight="700" style={{ textAlign: 'center' }}>
        {text || tr('چاوەڕێ بکە…', 'Loading…', 'جارٍ التحميل…')}
      </Txt>
    </View>
  );
}

export function LoginScreen() {
  const { t } = useTheme();
  const tr = useT();
  const { login, forgotPassword, authErr } = useSession();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const [fErr, setFErr] = useState('');

  async function doLogin() {
    if (!email.trim() || !pwd) return;
    setBusy(true);
    await login(email.trim(), pwd);
    setBusy(false);
  }
  async function doReset() {
    setFErr('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setFErr(tr('ئیمەیلەکە نەدۆزرایەوە یان هەڵەیەکی تر ڕوویدا.', "Couldn't find that email, or another error occurred.", 'تعذر العثور على البريد الإلكتروني أو حدث خطأ آخر.'));
    }
  }

  return (
    <Shell>
      <Card raised style={{ padding: 20, gap: 14 }}>
        <LangPicker />
        {forgot ? (
          <>
            <Txt size={18} weight="700">
              {tr('گەڕاندنەوەی پاسۆرد', 'Reset Password', 'استعادة كلمة المرور')}
            </Txt>
            <Txt color="muted">{tr('ئیمەیلەکەت بنووسە — لینکی گەڕاندنەوە بۆت دەنێردرێت.', 'Enter your email — a reset link will be sent.', 'أدخل بريدك الإلكتروني — سيُرسل إليك رابط الاستعادة.')}</Txt>
            {sent ? (
              <View style={[styles.okBox, { backgroundColor: t.greenSoft }]}>
                <Txt weight="700" color="green">
                  {'✓ ' + tr('لینکەکە نێردرا! ئیمەیلەکەت بپشکنە.', 'Reset link sent! Check your email.', 'تم إرسال الرابط! تحقق من بريدك.')}
                </Txt>
              </View>
            ) : (
              <>
                <Field label={tr('ئیمەیل', 'Email', 'البريد الإلكتروني')} value={email} onChange={setEmail} email onSubmit={doReset} />
                {fErr ? <Txt color="red" size={13}>{fErr}</Txt> : null}
                <PrimaryButton label={tr('ناردن', 'Send', 'إرسال')} onPress={doReset} disabled={!email.trim()} />
              </>
            )}
            <GhostButton
              label={tr('گەڕانەوە بۆ چونەژوورەوە', 'Back to login', 'العودة لتسجيل الدخول')}
              onPress={() => {
                setForgot(false);
                setSent(false);
              }}
            />
          </>
        ) : (
          <>
            <Field label={tr('ئیمەیل', 'Email', 'البريد الإلكتروني')} value={email} onChange={setEmail} email />
            <Field label={tr('پاسۆرد', 'Password', 'كلمة المرور')} value={pwd} onChange={setPwd} secure onSubmit={doLogin} />
            {authErr ? (
              <View style={[styles.okBox, { backgroundColor: t.redSoft }]}>
                <Txt size={13} weight="600" color="red">
                  {authErr}
                </Txt>
              </View>
            ) : null}
            <PrimaryButton label={busy ? tr('چاوەڕێ بکە…', 'One moment…', 'لحظة…') : tr('چونەژوورەوە', 'Log in', 'تسجيل الدخول')} onPress={doLogin} disabled={busy || !email.trim() || !pwd} />
            <Pressable onPress={() => setForgot(true)} style={{ alignSelf: 'center', padding: 6 }}>
              <Txt size={13} weight="600" color="petrol">
                {tr('پاسۆردت لەبیرچووە؟', 'Forgot password?', 'نسيت كلمة المرور؟')}
              </Txt>
            </Pressable>
          </>
        )}
      </Card>
    </Shell>
  );
}

export function SuspendedScreen() {
  const tr = useT();
  const { logout } = useSession();
  return (
    <Shell>
      <Card raised style={{ padding: 22, gap: 12, alignItems: 'center' }}>
        <Ionicons name="alert-circle" size={34} color="#DC2626" />
        <Txt size={17} weight="800" style={{ textAlign: 'center' }}>
          {tr('ئەکاونتەکەت ڕاگیراوە', 'Your account is suspended', 'حسابك موقوف')}
        </Txt>
        <Txt color="muted" style={{ textAlign: 'center' }}>
          {tr('ناتوانیت ئێستا ئەکاونتەکەت بەکاربهێنیت. بۆ چالاککردنەوەی پەیوەندی بە HR بکە.', "You can't use your account at the moment. Contact HR to have it reactivated.", 'لا يمكنك استخدام حسابك حاليًا. تواصل مع الموارد البشرية لإعادة تفعيله.')}
        </Txt>
        <PrimaryButton label={tr('چوونەدەرەوە', 'Log out', 'تسجيل الخروج')} onPress={logout} style={{ alignSelf: 'stretch' }} />
      </Card>
    </Shell>
  );
}

export function ForcePasswordScreen({ onDone }: { onDone: () => void }) {
  const tr = useT();
  const { changePassword, logout } = useSession();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit() {
    setErr('');
    if (p1.length < 6) return setErr(tr('پاسۆرد دەبێت لانیکەم ٦ پیت بێت', 'The password must be at least 6 characters', 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'));
    if (p1 !== p2) return setErr(tr('هەردوو پاسۆردەکە وەک یەک نین', "The two passwords don't match", 'كلمتا المرور غير متطابقتين'));
    if (p1 === INITIAL_PASSWORD) return setErr(tr('ناتوانیت هەمان پاسۆردی سەرەتایی بەکاربهێنیت', "You can't reuse the starting password", 'لا يمكنك إعادة استخدام كلمة المرور الأولية'));
    setBusy(true);
    try {
      await changePassword(p1);
      onDone();
    } catch (e: any) {
      setErr(
        /requires-recent-login/.test(e?.code || '')
          ? tr('تکایە دەربچۆ و دووبارە بچۆرەوە ژوورەوە، پاشان هەوڵبدەرەوە', 'Please log out and back in, then try again', 'يرجى تسجيل الخروج ثم الدخول مجددًا والمحاولة مرة أخرى')
          : tr('گۆڕینی پاسۆرد شکستی هێنا', "Couldn't change the password", 'تعذر تغيير كلمة المرور') + ' (' + (e?.code || '') + ')',
      );
    }
    setBusy(false);
  }
  return (
    <Shell>
      <Card raised style={{ padding: 20, gap: 14 }}>
        <Txt size={17} weight="800">
          {tr('پاسۆردێکی نوێ دابنێ', 'Choose a new password', 'اختر كلمة مرور جديدة')}
        </Txt>
        <Txt color="muted">
          {tr('ئەکاونتەکەت بە پاسۆردێکی هاوبەش دەستی پێکرد. پێش بەکارهێنانی سیستەمەکە، پاسۆردێکی تایبەت بە خۆت دابنێ.', 'Your account started with a shared password. Choose one of your own before using the system.', 'بدأ حسابك بكلمة مرور مشتركة. اختر كلمة مرور خاصة بك قبل استخدام النظام.')}
        </Txt>
        <Field label={tr('پاسۆردی نوێ', 'New password', 'كلمة المرور الجديدة')} value={p1} onChange={setP1} secure />
        <Field label={tr('دووبارەکردنەوەی پاسۆرد', 'Repeat the password', 'أعد كتابة كلمة المرور')} value={p2} onChange={setP2} secure onSubmit={submit} />
        {err ? <Txt color="red" size={13}>{err}</Txt> : null}
        <PrimaryButton label={busy ? tr('دەیگۆڕێت…', 'Saving…', 'جارٍ الحفظ…') : tr('پاشەکەوتکردن و بەردەوامبوون', 'Save and continue', 'حفظ ومتابعة')} onPress={submit} disabled={busy} />
        <GhostButton label={tr('چوونەدەرەوە', 'Log out', 'تسجيل الخروج')} onPress={logout} />
      </Card>
    </Shell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, gap: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  langs: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  lang: { flex: 1, paddingVertical: 8, borderRadius: 9 },
  okBox: { borderRadius: 12, padding: 12 },
});

// Toasts and in-app dialogs. Built into the screen rather than using system
// alerts, which do nothing in a web browser.

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

type Ask = {
  title: string;
  text?: string;
  yes: string;
  no: string;
  danger?: boolean;
  /** Show a text box; the promise then resolves with its text (or null when cancelled). */
  input?: { placeholder?: string };
};

type Feedback = {
  toast: (text: string) => void;
  confirm: (a: Omit<Ask, 'input'>) => Promise<boolean>;
  prompt: (a: Ask) => Promise<string | null>;
};

const FeedbackContext = createContext<Feedback | null>(null);

export function FeedbackProvider({ children, rtl }: { children: ReactNode; rtl: boolean }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ask, setAsk] = useState<(Ask & { resolve: (v: string | boolean | null) => void }) | null>(null);
  const [value, setValue] = useState('');

  const toast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(null), 2800);
  }, []);

  const api = useMemo<Feedback>(
    () => ({
      toast,
      confirm: (a) => new Promise((resolve) => setAsk({ ...a, resolve: (v) => resolve(v === true) })),
      prompt: (a) =>
        new Promise((resolve) => {
          setValue('');
          setAsk({ ...a, resolve: (v) => resolve(typeof v === 'string' ? v : null) });
        }),
    }),
    [toast],
  );

  const close = (v: string | boolean | null) => {
    ask?.resolve(v);
    setAsk(null);
  };

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {toastText ? (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: insets.bottom + 110 }]}>
          <Text style={[styles.toast, { backgroundColor: t.text, color: t.bg }]}>{toastText}</Text>
        </View>
      ) : null}
      <Modal visible={!!ask} transparent animationType="fade" onRequestClose={() => close(ask?.input ? null : false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close(ask?.input ? null : false)} />
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line, direction: rtl ? 'rtl' : 'ltr' }]}>
            <Text style={[styles.title, { color: t.text }]}>{ask?.title}</Text>
            {ask?.text ? <Text style={[styles.text, { color: t.muted }]}>{ask.text}</Text> : null}
            {ask?.input ? (
              <TextInput
                autoFocus
                value={value}
                onChangeText={setValue}
                placeholder={ask.input.placeholder}
                placeholderTextColor={t.faint}
                style={[styles.input, { color: t.text, backgroundColor: t.field, textAlign: rtl ? 'right' : 'left' }]}
              />
            ) : null}
            <View style={styles.row}>
              <Pressable onPress={() => close(ask?.input ? null : false)} style={[styles.btn, { borderColor: t.line, borderWidth: 1 }]}>
                <Text style={[styles.btnText, { color: t.text }]}>{ask?.no}</Text>
              </Pressable>
              <Pressable
                onPress={() => close(ask?.input ? value : true)}
                style={[styles.btn, { backgroundColor: ask?.danger ? t.red : t.acc }]}
              >
                <Text style={[styles.btnText, { color: ask?.danger ? '#FFFFFF' : t.btnInk }]}>{ask?.yes}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center', zIndex: 100 },
  toast: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, fontSize: 13, fontWeight: '700', overflow: 'hidden', textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 21 },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '600' },
});

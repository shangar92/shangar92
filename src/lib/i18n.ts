// Languages, following the web app: Kurdish (Sorani) and Arabic read right to
// left, English left to right. Kurdish and English wording is taken from the
// web app; Arabic is given alongside wherever the web app had none.

export type Lang = 'ku' | 'en' | 'ar';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ku', label: 'کوردی' },
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
];

/** English is shown in title case, exactly as the web app does. */
export function titleCaseEn(str: string) {
  return String(str).replace(/[A-Za-z][A-Za-z']*/g, (w) => {
    if (w === w.toUpperCase()) return w; // HR, GD, KAR …
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
}

/** Picks the text for the language. Arabic falls back to English. */
export function T(lang: Lang, ku: string, en: string, ar?: string) {
  if (lang === 'ku') return ku;
  if (lang === 'ar') return ar ?? en;
  return titleCaseEn(en);
}

/** Label of an object that carries { ku, en, ar? } (leave types, statuses). */
export function TL(lang: Lang, o?: { ku: string; en: string; ar?: string } | null) {
  if (!o) return '';
  return lang === 'ku' ? o.ku : lang === 'ar' ? o.ar || o.en : titleCaseEn(o.en);
}

export function isRtl(lang: Lang) {
  return lang !== 'en';
}

export const MONTHS: Record<Lang, string[]> = {
  ku: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
  ar: ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Week starts on Sunday, as in the web app's calendar. */
export const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  ku: ['ی', 'د', 'س', 'چ', 'پ', 'ه', 'ش'],
  ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

export const WEEKDAYS_LONG: Record<Lang, string[]> = {
  ku: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** "2026-10" -> "October 2026" in the chosen language. */
export function monthLabel(ym: string, lang: Lang) {
  const [y, m] = String(ym).split('-').map(Number);
  return (MONTHS[lang][(m || 1) - 1] || ym) + ' ' + y;
}

export function longDay(d: Date, lang: Lang) {
  return `${WEEKDAYS_LONG[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

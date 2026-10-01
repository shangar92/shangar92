import type { CustomColors, Palette, ThemeVars } from './types';

// Port of the "Make your own" builder in design-ideas/leave-colors.html.

function toRgb(hex: string) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
}

export function mix(a: string, b: string, t: number) {
  const A = toRgb(a);
  const B = toRgb(b);
  return (
    '#' +
    A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgba(hex: string, a: number) {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function luminance(hex: string) {
  const [r, g, b] = toRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function buildPalette([bg, acc, sec]: CustomColors): Palette {
  const dark = luminance(bg) < 0.45;
  let v: Omit<ThemeVars, 'r1a' | 'r1b' | 'r2a' | 'r2b' | 'r3a' | 'r3b'>;

  if (!dark) {
    const surface = '#FFFFFF';
    const text = mix(acc, '#0B1220', 0.82);
    v = {
      bg,
      surface,
      line: mix(bg, text, 0.09),
      text,
      muted: mix(text, bg, 0.45),
      faint: mix(text, bg, 0.63),
      navy: mix(acc, text, 0.55),
      navy2: mix(acc, text, 0.35),
      petrol: sec,
      petrolSoft: mix(sec, surface, 0.86),
      amber: '#D9912F',
      amberSoft: mix('#D9912F', '#FFFFFF', 0.87),
      green: '#1E9E63',
      greenSoft: mix('#1E9E63', '#FFFFFF', 0.88),
      red: '#D9534F',
      redSoft: mix('#D9534F', '#FFFFFF', 0.88),
      acc,
      btn1: acc,
      btn2: mix(acc, '#FFFFFF', 0.35),
      btnInk: luminance(acc) > 0.62 ? text : '#FFFFFF',
      accGlow: rgba(acc, 0.26),
      track: mix(bg, text, 0.06),
      field: mix(bg, surface, 0.5),
      chipSoft: mix(bg, text, 0.05),
      chipInk: mix(text, bg, 0.4),
      shadow: rgba(text, 0.07),
    };
  } else {
    const surface = mix(bg, '#FFFFFF', 0.07);
    const text = mix(acc, '#FFFFFF', 0.9);
    v = {
      bg,
      surface,
      line: mix(surface, '#FFFFFF', 0.08),
      text,
      muted: mix(text, bg, 0.4),
      faint: mix(text, bg, 0.6),
      navy: mix(surface, '#FFFFFF', 0.12),
      navy2: mix(surface, '#FFFFFF', 0.07),
      petrol: sec,
      petrolSoft: mix(sec, bg, 0.82),
      amber: '#F4C05E',
      amberSoft: mix('#F4C05E', bg, 0.85),
      green: '#4ADE9A',
      greenSoft: mix('#4ADE9A', bg, 0.85),
      red: '#FB8A8A',
      redSoft: mix('#FB8A8A', bg, 0.85),
      acc,
      btn1: acc,
      btn2: mix(acc, '#FFFFFF', 0.35),
      btnInk: luminance(acc) > 0.5 ? bg : '#FFFFFF',
      accGlow: rgba(acc, 0.3),
      track: mix(surface, '#FFFFFF', 0.06),
      field: mix(bg, surface, 0.5),
      chipSoft: mix(surface, '#FFFFFF', 0.07),
      chipInk: mix(text, bg, 0.35),
      shadow: 'rgba(0,0,0,.35)',
    };
  }

  const mid = mix(acc, sec, 0.5);
  return {
    id: 'custom',
    name: 'My colors',
    dark,
    v: {
      ...v,
      r1a: acc,
      r1b: mix(acc, '#FFFFFF', 0.35),
      r2a: sec,
      r2b: mix(sec, '#FFFFFF', 0.35),
      r3a: mid,
      r3b: mix(mid, '#FFFFFF', 0.35),
    },
  };
}

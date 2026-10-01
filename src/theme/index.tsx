import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { buildPalette } from './build';
import { palettes } from './palettes';
import type { CustomColors, Palette, ThemeVars } from './types';

export { palettes } from './palettes';
export { isHex, mix, rgba } from './build';
export type { CustomColors, Palette, ThemeVars } from './types';

export const radius = { sm: 10, md: 14, lg: 20, xl: 24, xxl: 26, pill: 999 };

export const DEFAULT_CUSTOM: CustomColors = ['#F2F6F4', '#2E9C95', '#E9A23B'];

type ThemeContextValue = {
  palette: Palette;
  t: ThemeVars;
  dark: boolean;
  setPaletteId: (id: string) => void;
  custom: CustomColors;
  setCustom: (colors: CustomColors) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paletteId, setPaletteId] = useState('night');
  const [custom, setCustom] = useState<CustomColors>(DEFAULT_CUSTOM);

  const value = useMemo<ThemeContextValue>(() => {
    const palette =
      paletteId === 'custom' ? buildPalette(custom) : (palettes.find((p) => p.id === paletteId) ?? palettes[0]);
    return { palette, t: palette.v, dark: palette.dark, setPaletteId, custom, setCustom };
  }, [paletteId, custom]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

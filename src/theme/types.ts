export type ThemeVars = {
  bg: string;
  surface: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  navy: string;
  navy2: string;
  petrol: string; // secondary color
  petrolSoft: string;
  amber: string; // pending
  amberSoft: string;
  green: string; // approved
  greenSoft: string;
  red: string; // declined
  redSoft: string;
  acc: string; // accent
  btn1: string;
  btn2: string;
  btnInk: string;
  accGlow: string;
  track: string;
  field: string;
  chipSoft: string;
  chipInk: string;
  shadow: string;
  r1a: string; // balance ring 1 (annual)
  r1b: string;
  r2a: string; // balance ring 2 (unpaid)
  r2b: string;
  r3a: string; // balance ring 3 (check-in)
  r3b: string;
};

export type Palette = {
  id: string;
  name: string;
  dark: boolean;
  v: ThemeVars;
};

/** Background, accent and second color picked in "Make your own". */
export type CustomColors = readonly [bg: string, acc: string, sec: string];

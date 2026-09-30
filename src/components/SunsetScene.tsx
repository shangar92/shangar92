import { memo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

// The sunset over the oil field from design-ideas/leave-colors.html, drawn on a 390 x 844 canvas.
// Blur, grain and rim-light filters from the design are left out to keep it light on phones.

function grass(x0: number, x1: number, base: (x: number) => number, hMin: number, hMax: number, n: number, seed: number) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let d = '';
  for (let k = 0; k < n; k++) {
    const x = x0 + rnd() * (x1 - x0);
    const y = base(x);
    const h = hMin + rnd() * (hMax - hMin);
    const lean = (rnd() - 0.5) * h * 0.6;
    const w = 1 + rnd() * 1.6;
    d += `M${(x - w).toFixed(1)} ${y.toFixed(1)}Q${(x + lean * 0.4).toFixed(1)} ${(y - h * 0.6).toFixed(1)} ${(x + lean).toFixed(1)} ${(y - h).toFixed(1)}Q${(x + lean * 0.4 + w).toFixed(1)} ${(y - h * 0.5).toFixed(1)} ${(x + w).toFixed(1)} ${y.toFixed(1)}Z`;
  }
  return d;
}

const GRASS_LEFT = grass(0, 175, (x) => 562 - Math.sin(x / 40) * 6, 10, 34, 140, 7);
const GRASS_RIGHT = grass(332, 390, () => 536, 10, 30, 60, 11);

type Props = { height: number; viewY: number; viewHeight: number };

/** Renders a horizontal slice (viewY .. viewY + viewHeight) of the scene, cropped to fill its container's width. */
export const SunsetScene = memo(function SunsetScene({ height, viewY, viewHeight }: Props) {
  return (
    <Svg width="100%" height={height} viewBox={`0 ${viewY} 390 ${viewHeight}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="rsky" x1="0" y1="0" x2="0" y2="844" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#0B1633" />
          <Stop offset="0.16" stopColor="#1D2C58" />
          <Stop offset="0.28" stopColor="#4A4577" />
          <Stop offset="0.36" stopColor="#9A6479" />
          <Stop offset="0.41" stopColor="#E08E6C" />
          <Stop offset="0.45" stopColor="#F8BC85" />
          <Stop offset="0.5" stopColor="#FCD8A2" />
        </LinearGradient>
        <RadialGradient id="rsun" cx="262" cy="356" r="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF7E2" />
          <Stop offset="0.12" stopColor="#FFE9B8" stopOpacity={0.95} />
          <Stop offset="0.4" stopColor="#FFC27E" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#F59A6A" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="rhaze" x1="0" y1="330" x2="0" y2="400" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F7B585" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#F2A57E" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#B8707A" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="rroad" x1="0" y1="408" x2="0" y2="900" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#B7806F" />
          <Stop offset="0.25" stopColor="#5A3E4E" />
          <Stop offset="1" stopColor="#1C1422" />
        </LinearGradient>
        <RadialGradient id="rwin" cx="320" cy="392" r="46" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFC56B" stopOpacity={0.9} />
          <Stop offset="0.4" stopColor="#FFB14F" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FF9A3C" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect width="390" height="844" fill="url(#rsky)" />
      <G fill="#fff">
        <Circle cx="34" cy="92" r="0.9" opacity={0.8} />
        <Circle cx="96" cy="60" r="0.7" opacity={0.6} />
        <Circle cx="150" cy="128" r="0.8" opacity={0.5} />
        <Circle cx="212" cy="74" r="0.7" opacity={0.7} />
        <Circle cx="286" cy="104" r="1" opacity={0.8} />
        <Circle cx="352" cy="66" r="0.8" opacity={0.6} />
        <Circle cx="330" cy="150" r="0.6" opacity={0.4} />
        <Circle cx="60" cy="170" r="0.6" opacity={0.4} />
      </G>

      {/* sun */}
      <Circle cx="262" cy="356" r="220" fill="url(#rsun)" />
      <Circle cx="262" cy="356" r="16" fill="#FFF8E6" />

      {/* clouds: dark tops, lit undersides */}
      <Ellipse cx="90" cy="232" rx="95" ry="9" fill="#6A4B6E" opacity={0.6} />
      <Ellipse cx="96" cy="238" rx="80" ry="4" fill="#F7A983" opacity={0.6} />
      <Ellipse cx="320" cy="200" rx="90" ry="8" fill="#5A4468" opacity={0.55} />
      <Ellipse cx="316" cy="206" rx="70" ry="3.5" fill="#F4A07F" opacity={0.55} />
      <Ellipse cx="180" cy="292" rx="120" ry="6" fill="#B06A78" opacity={0.45} />
      <Ellipse cx="190" cy="296" rx="100" ry="3" fill="#FFC896" opacity={0.6} />
      <Ellipse cx="360" cy="286" rx="60" ry="5" fill="#A8657A" opacity={0.4} />
      <Ellipse cx="30" cy="310" rx="70" ry="4" fill="#C77C7C" opacity={0.4} />

      {/* birds */}
      <G fill="none" stroke="#1B1628" strokeWidth={1.3} strokeLinecap="round" opacity={0.8}>
        <Path d="M140 180 q4 -4 8 0 q4 -4 8 0" />
        <Path d="M162 168 q3 -3 6 0 q3 -3 6 0" />
        <Path d="M122 196 q3 -3 6 0 q3 -3 6 0" />
      </G>

      {/* far range */}
      <Path
        d="M0 362 L18 350 L36 355 L58 336 L80 346 L104 328 L126 342 L150 331 L172 343 L196 334 L222 348 L246 340 L270 351 L296 333 L320 345 L346 329 L370 341 L390 333 L390 420 L0 420Z"
        fill="#A86C7C"
        opacity={0.8}
      />
      <Rect x="0" y="330" width="390" height="70" fill="url(#rhaze)" />

      {/* mid ridge + oil field */}
      <Path d="M0 384 C 40 372, 80 378, 120 370 S 200 372, 240 380 S 330 368, 390 376 L390 460 L0 460Z" fill="#5C3C5C" />
      <G fill="#3F2842">
        <Rect x="30" y="372" width="46" height="3" />
        <Polygon points="48,373 54,352 60,373" />
        <G transform="rotate(-9 54 352)">
          <Rect x="26" y="349.5" width="44" height="3.2" rx="1" />
          <Path d="M24 346 q-6 6 0 13 l5 -1.5 q-3 -5 0 -10z" />
        </G>
        <Rect x="28" y="356" width="1.6" height="17" />
        <Rect x="66" y="357" width="7" height="8" rx="1" />
        <G transform="translate(94 364) scale(0.55)">
          <Rect x="0" y="20" width="46" height="3" />
          <Polygon points="18,21 24,0 30,21" />
          <G transform="rotate(8 24 0)">
            <Rect x="-4" y="-2.5" width="44" height="3.2" rx="1" />
            <Path d="M-6 -6 q-6 6 0 13 l5 -1.5 q-3 -5 0 -10z" />
          </G>
          <Rect x="-2" y="4" width="1.6" height="17" />
        </G>
        <Rect x="132" y="360" width="16" height="15" rx="2" />
        <Rect x="150" y="364" width="11" height="11" rx="2" />
        <Rect x="172" y="330" width="2.2" height="44" />
      </G>
      <Circle cx="173" cy="327" r="6" fill="#FFB25C" opacity={0.4} />
      <Path d="M173.1 330 q-2.4 -4.5 0 -8 q2.4 3.5 0 8z" fill="#FFD28A" />
      <G stroke="#3F2842" strokeWidth={1.2}>
        <Path d="M212 378 V356 M208 359 H216" />
        <Path d="M236 381 V362 M232 365 H240" />
      </G>
      <Path d="M190 376 Q 201 368 212 359 Q 224 366 236 365 Q 250 368 262 373" stroke="#3F2842" strokeWidth={0.6} fill="none" />

      {/* near hill, tree and house */}
      <Path d="M0 430 C 70 408, 150 416, 220 410 S 340 398, 390 404 L390 900 L0 900Z" fill="#2A1C2E" />
      <G fill="#1E1422">
        <Rect x="262" y="376" width="3.5" height="36" />
        <Circle cx="264" cy="372" r="13" />
        <Circle cx="254" cy="382" r="10" />
        <Circle cx="274" cy="381" r="10" />
        <Circle cx="263" cy="360" r="9" />
      </G>
      <Circle cx="320" cy="392" r="46" fill="url(#rwin)" opacity={0.7} />
      <G fill="#1B1220">
        <Rect x="288" y="378" width="66" height="30" />
        <Polygon points="282,380 321,352 360,380" />
        <Rect x="338" y="356" width="7" height="16" />
      </G>
      <Rect x="296" y="387" width="11" height="9" fill="#FFC871" />
      <Rect x="336" y="387" width="11" height="9" fill="#FFC871" />
      <Rect x="316" y="392" width="10" height="16" fill="#FFB75E" opacity={0.9} />

      {/* road */}
      <Path d="M314 408 C 290 480, 170 620, 40 900 L 330 900 C 336 700, 334 520, 328 408 Z" fill="url(#rroad)" />
      <Path d="M321 408 C 318 500, 290 640, 214 900" stroke="#E7B08A" strokeWidth={1.2} strokeDasharray="7 11" fill="none" opacity={0.35} />

      {/* foreground grass */}
      <Path d={GRASS_LEFT} fill="#0F0A14" />
      <Path d="M0 560 C 60 540, 120 548, 180 560 L 150 900 L0 900Z" fill="#110B16" />
      <Path d="M330 540 C 350 530, 372 528, 390 532 L390 900 L 330 900Z" fill="#110B16" />

      {/* person walking home */}
      <Ellipse cx="301" cy="506" rx="17" ry="2.5" fill="#0A0710" opacity={0.6} />
      <G transform="translate(275 418) scale(0.5)" fill="#0E0A14" stroke="#0E0A14">
        <Path d="M44 92 L36 132 L26 172" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="24" cy="176" rx="10" ry="4.5" stroke="none" />
        <Path d="M42 38 L35 62 L33 84" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Rect x="25" y="36" width="17" height="40" rx="6" stroke="none" />
        <Path d="M38 32 Q50 27 62 32 L66 92 Q52 98 37 93 Z" stroke="none" />
        <Path d="M56 92 L67 130 L74 170" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Ellipse cx="79" cy="174" rx="10" ry="4.5" stroke="none" />
        <Path d="M58 38 L67 62 L71 82" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M62 92 a11 8.5 0 0 1 22 0 z" stroke="none" />
        <Rect x="59" y="91" width="28" height="2.6" rx="1.3" stroke="none" />
        <Rect x="46" y="22" width="9" height="12" rx="3" stroke="none" />
        <Ellipse cx="51" cy="13" rx="10" ry="12" stroke="none" />
      </G>
      <Path d={GRASS_RIGHT} fill="#0F0A14" />
    </Svg>
  );
});

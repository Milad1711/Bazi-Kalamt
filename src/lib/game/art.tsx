// ============ Word Game 3D — Original SVG Art ============
// All characters/icons are hand-crafted for this game (no external assets).
import React from 'react';

export interface IconProps { className?: string; style?: React.CSSProperties }

const S = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {children}
  </svg>
);

// ---------- Avatars (also used as memory "animals" deck faces) ----------
export const AvatarArt: Record<string, (p: IconProps) => React.ReactElement> = {
  owl: (p) => (
    <S {...p}>
      <circle cx="50" cy="52" r="34" fill="#8d6e63" />
      <circle cx="50" cy="58" r="24" fill="#d7ccc8" />
      <path d="M28 28 L38 44 L22 46 Z" fill="#8d6e63" />
      <path d="M72 28 L62 44 L78 46 Z" fill="#8d6e63" />
      <circle cx="40" cy="48" r="11" fill="#fff" />
      <circle cx="60" cy="48" r="11" fill="#fff" />
      <circle cx="41" cy="49" r="5" fill="#3e2723" />
      <circle cx="61" cy="49" r="5" fill="#3e2723" />
      <circle cx="39" cy="46" r="1.8" fill="#fff" />
      <circle cx="59" cy="46" r="1.8" fill="#fff" />
      <path d="M46 56 L54 56 L50 63 Z" fill="#ff9800" />
      <circle cx="33" cy="60" r="4" fill="#f8bbd0" opacity=".7" />
      <circle cx="67" cy="60" r="4" fill="#f8bbd0" opacity=".7" />
    </S>
  ),
  fox: (p) => (
    <S {...p}>
      <path d="M22 26 L40 40 L24 52 Z" fill="#ef6c00" />
      <path d="M78 26 L60 40 L76 52 Z" fill="#ef6c00" />
      <path d="M26 31 L37 41 L28 47 Z" fill="#fff" opacity=".5" />
      <path d="M74 31 L63 41 L72 47 Z" fill="#fff" opacity=".5" />
      <circle cx="50" cy="54" r="30" fill="#ff9800" />
      <path d="M50 84 Q30 78 28 58 Q38 68 50 68 Q62 68 72 58 Q70 78 50 84" fill="#fff" />
      <circle cx="39" cy="50" r="5.5" fill="#263238" />
      <circle cx="61" cy="50" r="5.5" fill="#263238" />
      <circle cx="40.5" cy="48.5" r="1.6" fill="#fff" />
      <circle cx="62.5" cy="48.5" r="1.6" fill="#fff" />
      <path d="M50 72 Q54 78 50 82 Q46 78 50 72" fill="#4e342e" />
      <circle cx="31" cy="60" r="4" fill="#f8bbd0" opacity=".7" />
      <circle cx="69" cy="60" r="4" fill="#f8bbd0" opacity=".7" />
    </S>
  ),
  panda: (p) => (
    <S {...p}>
      <circle cx="28" cy="30" r="13" fill="#263238" />
      <circle cx="72" cy="30" r="13" fill="#263238" />
      <circle cx="50" cy="54" r="32" fill="#fafafa" />
      <ellipse cx="37" cy="48" rx="10" ry="12" fill="#263238" transform="rotate(-14 37 48)" />
      <ellipse cx="63" cy="48" rx="10" ry="12" fill="#263238" transform="rotate(14 63 48)" />
      <circle cx="39" cy="49" r="4.5" fill="#fff" />
      <circle cx="61" cy="49" r="4.5" fill="#fff" />
      <circle cx="40" cy="50" r="2.4" fill="#263238" />
      <circle cx="62" cy="50" r="2.4" fill="#263238" />
      <ellipse cx="50" cy="65" rx="6" ry="4.5" fill="#263238" />
      <path d="M44 73 Q50 77 56 73" stroke="#263238" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="61" r="4" fill="#f8bbd0" opacity=".7" />
      <circle cx="69" cy="61" r="4" fill="#f8bbd0" opacity=".7" />
    </S>
  ),
  cat: (p) => (
    <S {...p}>
      <path d="M26 26 L44 38 L28 50 Z" fill="#546e7a" />
      <path d="M74 26 L56 38 L72 50 Z" fill="#546e7a" />
      <path d="M29 32 L40 40 L32 46 Z" fill="#ffb3c1" />
      <path d="M71 32 L60 40 L68 46 Z" fill="#ffb3c1" />
      <circle cx="50" cy="54" r="30" fill="#78909c" />
      <circle cx="39" cy="50" r="5" fill="#263238" />
      <circle cx="61" cy="50" r="5" fill="#263238" />
      <circle cx="40.5" cy="48.5" r="1.6" fill="#fff" />
      <circle cx="62.5" cy="48.5" r="1.6" fill="#fff" />
      <path d="M50 60 L46 64 L54 64 Z" fill="#ffb3c1" />
      <path d="M46 68 Q50 72 54 68" stroke="#37474f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M18 56 L30 60 M18 64 L30 64" stroke="#90a4ae" strokeWidth="2" strokeLinecap="round" />
      <path d="M82 56 L70 60 M82 64 L70 64" stroke="#90a4ae" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="61" r="4" fill="#f8bbd0" opacity=".6" />
      <circle cx="68" cy="61" r="4" fill="#f8bbd0" opacity=".6" />
    </S>
  ),
  penguin: (p) => (
    <S {...p}>
      <circle cx="50" cy="50" r="34" fill="#37474f" />
      <ellipse cx="50" cy="58" rx="24" ry="26" fill="#eceff1" />
      <circle cx="40" cy="44" r="6" fill="#fff" />
      <circle cx="60" cy="44" r="6" fill="#fff" />
      <circle cx="41" cy="45" r="3" fill="#263238" />
      <circle cx="61" cy="45" r="3" fill="#263238" />
      <path d="M44 52 Q50 58 56 52 Q53 60 50 60 Q47 60 44 52" fill="#ff9800" />
      <circle cx="33" cy="55" r="4" fill="#ffb74d" opacity=".6" />
      <circle cx="67" cy="55" r="4" fill="#ffb74d" opacity=".6" />
    </S>
  ),
  lion: (p) => (
    <S {...p}>
      <circle cx="50" cy="52" r="36" fill="#ff9800" />
      <g fill="#f57c00">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x = 50 + Math.cos(a) * 36, y = 52 + Math.sin(a) * 36;
          const x2 = 50 + Math.cos(a + 0.22) * 30, y2 = 52 + Math.sin(a + 0.22) * 30;
          const x3 = 50 + Math.cos(a - 0.22) * 30, y3 = 52 + Math.sin(a - 0.22) * 30;
          return <path key={i} d={`M${x} ${y} L${x2} ${y2} L${x3} ${y3} Z`} />;
        })}
      </g>
      <circle cx="50" cy="54" r="24" fill="#ffcc80" />
      <circle cx="41" cy="50" r="4.5" fill="#4e342e" />
      <circle cx="59" cy="50" r="4.5" fill="#4e342e" />
      <path d="M50 56 L46 61 L54 61 Z" fill="#e65100" />
      <path d="M42 66 Q50 72 58 66" stroke="#6d4c41" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="59" r="3.5" fill="#ffab91" opacity=".8" />
      <circle cx="65" cy="59" r="3.5" fill="#ffab91" opacity=".8" />
    </S>
  ),
  frog: (p) => (
    <S {...p}>
      <circle cx="32" cy="30" r="13" fill="#66bb6a" />
      <circle cx="68" cy="30" r="13" fill="#66bb6a" />
      <circle cx="32" cy="30" r="7" fill="#fff" />
      <circle cx="68" cy="30" r="7" fill="#fff" />
      <circle cx="33" cy="31" r="3.6" fill="#263238" />
      <circle cx="67" cy="31" r="3.6" fill="#263238" />
      <ellipse cx="50" cy="60" rx="32" ry="26" fill="#81c784" />
      <ellipse cx="50" cy="60" rx="22" ry="16" fill="#c8e6c9" />
      <path d="M44 64 Q50 69 56 64" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="54" r="3.5" fill="#a5d6a7" />
      <circle cx="62" cy="54" r="3.5" fill="#a5d6a7" />
      <circle cx="30" cy="60" r="4" fill="#f48fb1" opacity=".6" />
      <circle cx="70" cy="60" r="4" fill="#f48fb1" opacity=".6" />
    </S>
  ),
  unicorn: (p) => (
    <S {...p}>
      <path d="M50 8 L58 26 L42 26 Z" fill="#ffd54f" />
      <path d="M52 12 L55 24 L47 24 Z" fill="#ffb300" />
      <circle cx="50" cy="56" r="30" fill="#fafafa" />
      <path d="M24 40 Q20 28 30 24 Q30 36 38 40 Z" fill="#f48fb1" />
      <path d="M30 38 Q28 30 34 28 Q34 36 40 40 Z" fill="#ce93d8" />
      <path d="M76 40 Q80 28 70 24 Q70 36 62 40 Z" fill="#90caf9" />
      <circle cx="39" cy="52" r="4.5" fill="#4a148c" />
      <circle cx="61" cy="52" r="4.5" fill="#4a148c" />
      <path d="M40.5 50.5 a1.6 1.6 0 1 0 0.1 0" fill="#fff" />
      <path d="M46 62 Q50 66 54 62" stroke="#ad1457" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="60" r="4" fill="#f8bbd0" opacity=".8" />
      <circle cx="69" cy="60" r="4" fill="#f8bbd0" opacity=".8" />
      <path d="M20 74 Q14 84 22 90" stroke="#f48fb1" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M80 74 Q86 84 78 90" stroke="#90caf9" strokeWidth="5" fill="none" strokeLinecap="round" />
    </S>
  ),
  robot: (p) => (
    <S {...p}>
      <line x1="50" y1="8" x2="50" y2="20" stroke="#90a4ae" strokeWidth="4" />
      <circle cx="50" cy="8" r="5" fill="#ff5252" />
      <rect x="20" y="20" width="60" height="56" rx="14" fill="#78909c" />
      <rect x="26" y="27" width="48" height="30" rx="10" fill="#263238" />
      <circle cx="39" cy="42" r="7" fill="#00e5ff" />
      <circle cx="61" cy="42" r="7" fill="#00e5ff" />
      <circle cx="41" cy="40" r="2.2" fill="#fff" />
      <circle cx="63" cy="40" r="2.2" fill="#fff" />
      <rect x="40" y="63" width="20" height="5" rx="2.5" fill="#b0bec5" />
      <circle cx="34" cy="65" r="3" fill="#ff5252" />
      <circle cx="66" cy="65" r="3" fill="#69f0ae" />
      <rect x="28" y="78" width="14" height="10" rx="4" fill="#546e7a" />
      <rect x="58" y="78" width="14" height="10" rx="4" fill="#546e7a" />
    </S>
  ),
  dragon: (p) => (
    <S {...p}>
      <path d="M32 24 L26 6 L42 18 Z" fill="#ffb300" />
      <path d="M68 24 L74 6 L58 18 Z" fill="#ffb300" />
      <circle cx="50" cy="54" r="32" fill="#66bb6a" />
      <ellipse cx="50" cy="64" rx="20" ry="14" fill="#a5d6a7" />
      <circle cx="38" cy="46" r="6" fill="#fff" />
      <circle cx="62" cy="46" r="6" fill="#fff" />
      <circle cx="39" cy="47" r="3" fill="#e53935" />
      <circle cx="61" cy="47" r="3" fill="#e53935" />
      <path d="M50 56 Q42 64 50 66 Q58 64 50 56" fill="#fff" />
      <circle cx="46" cy="61" r="1.5" fill="#263238" />
      <circle cx="54" cy="61" r="1.5" fill="#263238" />
      <path d="M22 58 Q14 62 18 68 Q24 66 26 62" fill="#66bb6a" />
      <path d="M78 58 Q86 62 82 68 Q76 66 74 62" fill="#66bb6a" />
      <circle cx="31" cy="58" r="4" fill="#f48fb1" opacity=".6" />
      <circle cx="69" cy="58" r="4" fill="#f48fb1" opacity=".6" />
    </S>
  ),
  monkey: (p) => (
    <S {...p}>
      <circle cx="27" cy="36" r="12" fill="#8d6e63" />
      <circle cx="73" cy="36" r="12" fill="#8d6e63" />
      <circle cx="27" cy="36" r="6" fill="#d7ccc8" />
      <circle cx="73" cy="36" r="6" fill="#d7ccc8" />
      <circle cx="50" cy="54" r="30" fill="#a1887f" />
      <ellipse cx="50" cy="60" rx="20" ry="17" fill="#ffe0b2" />
      <circle cx="40" cy="50" r="4.5" fill="#3e2723" />
      <circle cx="60" cy="50" r="4.5" fill="#3e2723" />
      <circle cx="41.5" cy="48.5" r="1.5" fill="#fff" />
      <circle cx="61.5" cy="48.5" r="1.5" fill="#fff" />
      <ellipse cx="50" cy="61" rx="5" ry="4" fill="#8d6e63" />
      <path d="M43 68 Q50 73 57 68" stroke="#5d4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="60" r="4" fill="#f48fb1" opacity=".5" />
      <circle cx="66" cy="60" r="4" fill="#f48fb1" opacity=".5" />
    </S>
  ),
  bunny: (p) => (
    <S {...p}>
      <ellipse cx="36" cy="24" rx="9" ry="20" fill="#b0bec5" transform="rotate(-8 36 24)" />
      <ellipse cx="64" cy="24" rx="9" ry="20" fill="#b0bec5" transform="rotate(8 64 24)" />
      <ellipse cx="36" cy="26" rx="4.5" ry="13" fill="#f8bbd0" transform="rotate(-8 36 26)" />
      <ellipse cx="64" cy="26" rx="4.5" ry="13" fill="#f8bbd0" transform="rotate(8 64 26)" />
      <circle cx="50" cy="58" r="28" fill="#cfd8dc" />
      <circle cx="40" cy="54" r="4.5" fill="#37474f" />
      <circle cx="60" cy="54" r="4.5" fill="#37474f" />
      <circle cx="41.5" cy="52.5" r="1.5" fill="#fff" />
      <circle cx="61.5" cy="52.5" r="1.5" fill="#fff" />
      <path d="M50 60 L46 64 L54 64 Z" fill="#f48fb1" />
      <path d="M44 68 Q50 66 56 68" stroke="#78909c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="63" r="4" fill="#f8bbd0" opacity=".7" />
      <circle cx="67" cy="63" r="4" fill="#f8bbd0" opacity=".7" />
    </S>
  ),
};

// ---------- Fruit deck ----------
const fruitArt: Record<string, (p: IconProps) => React.ReactElement> = {
  apple: (p) => (
    <S {...p}>
      <path d="M50 22 Q52 12 60 10" stroke="#6d4c41" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M52 20 Q66 10 72 22 Q60 26 52 24" fill="#66bb6a" />
      <path d="M32 38 Q20 52 30 70 Q40 86 50 82 Q60 86 70 70 Q80 52 68 38 Q58 32 50 38 Q42 32 32 38" fill="#ef5350" />
      <ellipse cx="38" cy="50" rx="6" ry="9" fill="#ffcdd2" opacity=".8" transform="rotate(-20 38 50)" />
    </S>
  ),
  banana: (p) => (
    <S {...p}>
      <path d="M26 30 Q24 62 52 76 Q80 88 86 60 Q88 54 82 58 Q66 74 44 60 Q30 50 32 32 Q32 26 26 30" fill="#ffca28" />
      <path d="M28 30 Q28 40 32 46" stroke="#fff59d" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="82" y="54" width="7" height="7" rx="2" fill="#8d6e63" />
    </S>
  ),
  cherry: (p) => (
    <S {...p}>
      <path d="M38 20 Q48 40 40 58" stroke="#7cb342" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M64 24 Q60 42 62 58" stroke="#7cb342" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M38 20 Q52 12 64 24 Q52 20 38 20" fill="#7cb342" />
      <circle cx="40" cy="68" r="14" fill="#e53935" />
      <circle cx="63" cy="68" r="14" fill="#c62828" />
      <circle cx="36" cy="63" r="4" fill="#ffcdd2" opacity=".8" />
    </S>
  ),
  strawberry: (p) => (
    <S {...p}>
      <path d="M32 34 Q50 26 68 34 Q68 62 50 82 Q32 62 32 34" fill="#e53935" />
      <path d="M28 32 Q50 22 72 32 Q50 44 28 32" fill="#66bb6a" />
      <path d="M50 26 L50 40" stroke="#43a047" strokeWidth="3" />
      <g fill="#fffde7">
        <circle cx="42" cy="46" r="2" /><circle cx="58" cy="46" r="2" />
        <circle cx="50" cy="56" r="2" /><circle cx="40" cy="62" r="2" /><circle cx="60" cy="62" r="2" />
        <circle cx="50" cy="70" r="2" />
      </g>
    </S>
  ),
  orange: (p) => (
    <S {...p}>
      <circle cx="50" cy="54" r="30" fill="#fb8c00" />
      <ellipse cx="40" cy="44" rx="7" ry="10" fill="#ffe0b2" opacity=".7" transform="rotate(-24 40 44)" />
      <path d="M50 22 Q52 14 58 12" stroke="#6d4c41" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M52 20 Q64 14 66 22 Q58 26 52 24" fill="#66bb6a" />
    </S>
  ),
  watermelon: (p) => (
    <S {...p}>
      <path d="M14 44 A36 36 0 0 0 86 44 L50 44 Z" fill="#66bb6a" />
      <path d="M20 46 A30 30 0 0 0 80 46 L50 46 Z" fill="#ef5350" />
      <g fill="#33691e">
        <circle cx="38" cy="58" r="2.4" /><circle cx="50" cy="66" r="2.4" /><circle cx="62" cy="58" r="2.4" />
        <circle cx="44" cy="70" r="2" /><circle cx="56" cy="70" r="2" />
      </g>
    </S>
  ),
  grape: (p) => (
    <S {...p}>
      <circle cx="38" cy="40" r="10" fill="#7e57c2" />
      <circle cx="62" cy="40" r="10" fill="#7e57c2" />
      <circle cx="30" cy="56" r="10" fill="#673ab7" />
      <circle cx="50" cy="54" r="10" fill="#7e57c2" />
      <circle cx="70" cy="56" r="10" fill="#673ab7" />
      <circle cx="40" cy="72" r="10" fill="#673ab7" />
      <circle cx="60" cy="72" r="10" fill="#5e35b1" />
      <circle cx="50" cy="86" r="9" fill="#4527a0" />
      <path d="M50 28 Q50 16 60 14" stroke="#7cb342" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="36" r="3" fill="#d1c4e9" opacity=".8" />
    </S>
  ),
  pineapple: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="58" rx="22" ry="28" fill="#fbc02d" />
      <g stroke="#f57f17" strokeWidth="2.5" strokeLinecap="round">
        <path d="M32 48 L68 48" /><path d="M30 58 L70 58" /><path d="M32 68 L68 68" />
        <path d="M36 40 L50 76" /><path d="M64 40 L50 76" /><path d="M50 34 L50 80" />
      </g>
      <path d="M38 32 Q30 18 40 12 Q44 20 48 26 Z" fill="#43a047" />
      <path d="M50 30 Q50 12 62 10 Q62 22 54 30 Z" fill="#66bb6a" />
      <path d="M62 32 Q72 20 78 26 Q70 32 58 34 Z" fill="#43a047" />
    </S>
  ),
  pear: (p) => (
    <S {...p}>
      <path d="M50 20 Q60 22 58 32 Q56 40 62 48 Q74 62 66 74 Q58 86 50 84 Q42 86 34 74 Q26 62 38 48 Q44 40 42 32 Q40 22 50 20" fill="#aed581" />
      <path d="M50 20 Q51 12 58 10" stroke="#7cb342" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="60" rx="5" ry="8" fill="#f1f8e9" opacity=".8" transform="rotate(-16 42 60)" />
    </S>
  ),
  lemon: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="55" rx="30" ry="24" fill="#fdd835" transform="rotate(-14 50 55)" />
      <path d="M20 44 Q18 36 26 34" stroke="#f9a825" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="48" rx="6" ry="9" fill="#fff9c4" opacity=".9" transform="rotate(-30 38 48)" />
    </S>
  ),
  kiwi: (p) => (
    <S {...p}>
      <circle cx="50" cy="52" r="30" fill="#8d6e63" />
      <circle cx="50" cy="52" r="24" fill="#c0ca33" />
      <circle cx="50" cy="52" r="17" fill="#aed581" />
      <circle cx="50" cy="52" r="5" fill="#fafafa" />
      <g fill="#33691e">
        <circle cx="50" cy="42" r="1.6" /><circle cx="42" cy="48" r="1.6" /><circle cx="58" cy="48" r="1.6" />
        <circle cx="44" cy="60" r="1.6" /><circle cx="56" cy="60" r="1.6" /><circle cx="50" cy="65" r="1.6" />
        <circle cx="38" cy="54" r="1.6" /><circle cx="62" cy="54" r="1.6" />
      </g>
    </S>
  ),
  peach: (p) => (
    <S {...p}>
      <path d="M50 26 Q30 26 28 50 Q26 76 50 84 Q74 76 72 50 Q70 26 50 26" fill="#fb8c00" />
      <path d="M50 26 Q50 40 50 84" stroke="#f57c00" strokeWidth="3" fill="none" />
      <path d="M50 24 Q56 12 68 14 Q66 24 52 27" fill="#66bb6a" />
      <ellipse cx="38" cy="52" rx="6" ry="9" fill="#ffe0b2" opacity=".8" transform="rotate(-18 38 52)" />
    </S>
  ),
};

// ---------- Space deck ----------
const spaceArt: Record<string, (p: IconProps) => React.ReactElement> = {
  sun: (p) => (
    <S {...p}>
      <circle cx="50" cy="50" r="22" fill="#ffb300" />
      <circle cx="50" cy="50" r="15" fill="#ffd54f" />
      <g stroke="#ffb300" strokeWidth="5" strokeLinecap="round">
        <path d="M50 16 L50 6" /><path d="M50 94 L50 84" /><path d="M16 50 L6 50" /><path d="M94 50 L84 50" />
        <path d="M26 26 L19 19" /><path d="M81 81 L74 74" /><path d="M26 74 L19 81" /><path d="M81 19 L74 26" />
      </g>
    </S>
  ),
  moon: (p) => (
    <S {...p}>
      <path d="M62 14 A38 38 0 1 0 62 86 A30 30 0 1 1 62 14" fill="#cfd8dc" />
      <circle cx="42" cy="40" r="6" fill="#b0bec5" />
      <circle cx="36" cy="62" r="4" fill="#b0bec5" />
      <circle cx="52" cy="68" r="3" fill="#b0bec5" />
    </S>
  ),
  star: (p) => (
    <S {...p}>
      <path d="M50 12 L60 40 L90 42 L67 61 L74 90 L50 74 L26 90 L33 61 L10 42 L40 40 Z" fill="#ffd54f" />
      <path d="M50 12 L60 40 L90 42 L67 61 L74 90 L50 74 Z" fill="#ffca28" />
      <circle cx="44" cy="48" r="3" fill="#fff59d" />
    </S>
  ),
  rocket: (p) => (
    <S {...p}>
      <path d="M50 8 Q68 26 68 52 L68 62 L32 62 L32 52 Q32 26 50 8" fill="#eceff1" />
      <circle cx="50" cy="40" r="9" fill="#29b6f6" />
      <circle cx="50" cy="40" r="9" fill="none" stroke="#0288d1" strokeWidth="2.5" />
      <path d="M32 52 L20 70 L32 66 Z" fill="#ef5350" />
      <path d="M68 52 L80 70 L68 66 Z" fill="#ef5350" />
      <path d="M40 62 L60 62 L56 70 L44 70 Z" fill="#b0bec5" />
      <path d="M44 72 Q50 92 50 92 Q50 92 56 72 Z" fill="#ff9800" />
      <path d="M47 74 Q50 88 50 88 Q50 88 53 74 Z" fill="#ffee58" />
    </S>
  ),
  planet: (p) => (
    <S {...p}>
      <circle cx="50" cy="48" r="24" fill="#7e57c2" />
      <path d="M30 40 Q50 50 70 38" stroke="#673ab7" strokeWidth="5" fill="none" />
      <circle cx="42" cy="40" r="5" fill="#9575cd" />
      <ellipse cx="50" cy="60" rx="42" ry="10" fill="none" stroke="#ffb74d" strokeWidth="6" transform="rotate(-16 50 60)" />
    </S>
  ),
  ufo: (p) => (
    <S {...p}>
      <path d="M34 44 Q50 20 66 44 Z" fill="#4fc3f7" opacity=".85" />
      <ellipse cx="50" cy="46" rx="34" ry="12" fill="#78909c" />
      <ellipse cx="50" cy="44" rx="34" ry="12" fill="#90a4ae" />
      <circle cx="36" cy="48" r="3.5" fill="#ffee58" />
      <circle cx="50" cy="52" r="3.5" fill="#ff8a65" />
      <circle cx="64" cy="48" r="3.5" fill="#69f0ae" />
    </S>
  ),
  comet: (p) => (
    <S {...p}>
      <path d="M90 20 Q60 30 30 54 Q60 40 90 20" fill="#b3e5fc" opacity=".7" />
      <path d="M88 30 Q58 42 34 58 Q60 46 88 30" fill="#81d4fa" opacity=".6" />
      <circle cx="28" cy="62" r="13" fill="#e1f5fe" />
      <circle cx="24" cy="58" r="4" fill="#fff" />
    </S>
  ),
  satellite: (p) => (
    <S {...p}>
      <rect x="44" y="38" width="14" height="22" rx="4" fill="#78909c" />
      <rect x="12" y="36" width="26" height="16" rx="3" fill="#29b6f6" />
      <rect x="64" y="36" width="26" height="16" rx="3" fill="#29b6f6" />
      <line x1="38" y1="44" x2="44" y2="44" stroke="#546e7a" strokeWidth="3" />
      <line x1="58" y1="44" x2="64" y2="44" stroke="#546e7a" strokeWidth="3" />
      <path d="M50 60 L46 74 M50 60 L54 74" stroke="#ef5350" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="30" r="4" fill="#ffca28" />
    </S>
  ),
  alien: (p) => (
    <S {...p}>
      <path d="M50 14 Q76 16 78 44 Q80 66 66 76 L34 76 Q20 66 22 44 Q24 16 50 14" fill="#66bb6a" />
      <ellipse cx="38" cy="44" rx="10" ry="13" fill="#1b5e20" transform="rotate(-18 38 44)" />
      <ellipse cx="62" cy="44" rx="10" ry="13" fill="#1b5e20" transform="rotate(18 62 44)" />
      <circle cx="38" cy="44" r="4" fill="#eee" />
      <circle cx="62" cy="44" r="4" fill="#eee" />
      <path d="M42 62 Q50 70 58 62" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M22 52 Q10 58 14 68 Q26 66 28 58" fill="#66bb6a" />
      <path d="M78 52 Q90 58 86 68 Q74 66 72 58" fill="#66bb6a" />
    </S>
  ),
  telescope: (p) => (
    <S {...p}>
      <rect x="20" y="38" width="52" height="14" rx="7" fill="#546e7a" transform="rotate(-28 46 45)" />
      <rect x="18" y="36" width="14" height="18" rx="6" fill="#ef5350" transform="rotate(-28 25 45)" />
      <rect x="58" y="18" width="14" height="16" rx="6" fill="#42a5f5" transform="rotate(-28 65 26)" />
      <path d="M46 52 L40 86" stroke="#8d6e63" strokeWidth="6" strokeLinecap="round" />
      <path d="M30 88 L52 88" stroke="#8d6e63" strokeWidth="6" strokeLinecap="round" />
    </S>
  ),
  earth: (p) => (
    <S {...p}>
      <circle cx="50" cy="50" r="30" fill="#42a5f5" />
      <path d="M28 40 Q38 34 44 40 Q48 46 42 50 Q34 54 28 48 Z" fill="#66bb6a" />
      <path d="M52 58 Q64 54 70 62 Q66 72 56 70 Q48 66 52 58" fill="#66bb6a" />
      <path d="M56 26 Q66 30 64 38 Q58 40 54 34 Z" fill="#66bb6a" />
      <ellipse cx="50" cy="50" rx="30" ry="30" fill="none" stroke="#e3f2fd" strokeWidth="3" opacity=".4" />
    </S>
  ),
  meteor: (p) => (
    <S {...p}>
      <path d="M92 12 L44 48 L54 54 Z" fill="#ffab91" opacity=".6" />
      <path d="M88 26 L50 54 L56 58 Z" fill="#ff8a65" opacity=".5" />
      <path d="M40 44 L62 38 L70 56 L54 70 L38 60 Z" fill="#8d6e63" />
      <path d="M44 50 L52 46 M58 52 L56 60 M48 62 L52 56" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" />
    </S>
  ),
};

// ---------- Sweets deck ----------
const sweetArt: Record<string, (p: IconProps) => React.ReactElement> = {
  candy: (p) => (
    <S {...p}>
      <path d="M22 50 Q10 36 22 34 Q30 44 36 44" fill="#f06292" />
      <path d="M78 50 Q90 36 78 34 Q70 44 64 44" fill="#f06292" />
      <rect x="34" y="40" width="32" height="20" rx="10" fill="#f48fb1" />
      <path d="M38 44 L62 56 M46 42 L58 58" stroke="#fff" strokeWidth="3" opacity=".7" />
    </S>
  ),
  lollipop: (p) => (
    <S {...p}>
      <line x1="50" y1="54" x2="50" y2="92" stroke="#a1887f" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="38" r="26" fill="#ef5350" />
      <path d="M50 38 m0 -26 a26 26 0 0 1 22.5 13 a20 20 0 0 0 -22.5 -5 a13 13 0 0 1 13 11" fill="#fff" opacity=".5" />
      <path d="M50 12 A26 26 0 0 1 76 38" stroke="#fff" strokeWidth="5" fill="none" opacity=".6" />
    </S>
  ),
  cupcake: (p) => (
    <S {...p}>
      <path d="M30 50 L70 50 L62 84 Q50 90 38 84 Z" fill="#d7a86e" />
      <path d="M36 52 L42 82 M50 52 L50 86 M64 52 L58 82" stroke="#b98a55" strokeWidth="3" />
      <path d="M26 50 Q24 30 40 30 Q44 16 58 22 Q74 20 74 40 Q78 50 70 50 Q50 44 26 50" fill="#f8bbd0" />
      <circle cx="50" cy="18" r="6" fill="#ef5350" />
    </S>
  ),
  donut: (p) => (
    <S {...p}>
      <circle cx="50" cy="52" r="34" fill="#d7a86e" />
      <path d="M24 40 Q50 26 76 40 Q80 52 74 62 Q50 74 26 62 Q20 50 24 40" fill="#f48fb1" />
      <circle cx="50" cy="52" r="11" fill="#fff5ee" />
      <g fill="var(--sugar, #fff)">
        <circle cx="36" cy="44" r="2.5" fill="#a5d6a7" /><circle cx="62" cy="42" r="2.5" fill="#90caf9" />
        <circle cx="70" cy="56" r="2.5" fill="#fff59d" /><circle cx="30" cy="58" r="2.5" fill="#ef9a9a" />
      </g>
    </S>
  ),
  icecream: (p) => (
    <S {...p}>
      <path d="M32 48 L50 92 L68 48 Z" fill="#d7a86e" />
      <path d="M36 52 L50 84 L64 52" stroke="#b98a55" strokeWidth="2.5" fill="none" />
      <circle cx="38" cy="38" r="14" fill="#f48fb1" />
      <circle cx="62" cy="38" r="14" fill="#fff176" />
      <circle cx="50" cy="26" r="14" fill="#b39ddb" />
      <circle cx="50" cy="20" r="4" fill="#ef5350" />
    </S>
  ),
  cookie: (p) => (
    <S {...p}>
      <circle cx="50" cy="52" r="32" fill="#d7a86e" />
      <path d="M24 42 Q36 30 52 28" stroke="#e8c08a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g fill="#6d4c41">
        <circle cx="40" cy="44" r="4.5" /><circle cx="60" cy="48" r="4" /><circle cx="48" cy="64" r="4" />
        <circle cx="34" cy="60" r="3" /><circle cx="66" cy="64" r="3" /><circle cx="52" cy="38" r="2.5" />
      </g>
    </S>
  ),
  cake: (p) => (
    <S {...p}>
      <rect x="22" y="52" width="56" height="32" rx="6" fill="#f8bbd0" />
      <rect x="22" y="52" width="56" height="10" fill="#f48fb1" />
      <path d="M28 62 h44 M28 72 h44" stroke="#f6a5c8" strokeWidth="2" />
      <path d="M34 50 Q34 36 44 40 Q42 28 52 32 Q50 22 58 26" stroke="#5d4037" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="22" r="4" fill="#ffb300" />
      <rect x="44" y="80" width="12" height="6" rx="2" fill="#fff176" />
    </S>
  ),
  chocolate: (p) => (
    <S {...p}>
      <rect x="22" y="30" width="56" height="44" rx="6" fill="#6d4c41" />
      <path d="M22 44 h56 M22 58 h56 M40 30 v44 M60 30 v44" stroke="#5d4037" strokeWidth="3" />
      <rect x="26" y="34" width="12" height="8" rx="3" fill="#8d6e63" />
    </S>
  ),
  gum: (p) => (
    <S {...p}>
      <circle cx="50" cy="54" r="26" fill="#64b5f6" />
      <ellipse cx="42" cy="46" rx="8" ry="5" fill="#bbdefb" transform="rotate(-24 42 46)" />
      <path d="M40 20 Q44 28 40 34 M58 20 Q54 28 58 34 M50 16 L50 30" stroke="#64b5f6" strokeWidth="4" strokeLinecap="round" fill="none" />
    </S>
  ),
  pie: (p) => (
    <S {...p}>
      <path d="M16 54 Q50 34 84 54 Q80 76 50 80 Q20 76 16 54" fill="#ffb74d" />
      <path d="M20 54 Q50 38 80 54 Q50 62 20 54" fill="#ffcc80" />
      <path d="M30 58 Q32 70 40 74 M68 58 Q66 70 58 74" stroke="#f57c00" strokeWidth="3" fill="none" />
      <circle cx="50" cy="36" r="4" fill="#ef5350" />
      <path d="M46 36 Q50 22 58 20" stroke="#aed581" strokeWidth="3" fill="none" />
    </S>
  ),
  brownie: (p) => (
    <S {...p}>
      <path d="M20 50 L80 50 L74 80 Q50 88 26 80 Z" fill="#5d4037" />
      <path d="M22 50 L78 50 L76 42 Q50 34 24 42 Z" fill="#795548" />
      <g fill="#8d6e63">
        <circle cx="38" cy="62" r="3.5" /><circle cx="58" cy="64" r="3" /><circle cx="48" cy="72" r="3" />
      </g>
      <circle cx="44" cy="44" r="2.5" fill="#a1887f" /><circle cx="60" cy="45" r="2.5" fill="#a1887f" />
    </S>
  ),
  macaron: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="38" rx="30" ry="12" fill="#f48fb1" />
      <rect x="20" y="42" width="60" height="12" rx="6" fill="#ffe082" />
      <ellipse cx="50" cy="58" rx="30" ry="11" fill="#f8bbd0" />
      <ellipse cx="42" cy="34" rx="8" ry="3" fill="#fce4ec" />
    </S>
  ),
};

// ---------- Monster deck (12 cute monsters by color) ----------
function monster(color: string, dark: string, feature: 'horns' | 'antenna' | 'ears' | 'spikes' | 'oneeye' | 'threeeye'): (p: IconProps) => React.ReactElement {
  return (p) => (
    <S {...p}>
      {feature === 'horns' && (
        <>
          <path d="M30 30 L24 12 L42 24 Z" fill={dark} />
          <path d="M70 30 L76 12 L58 24 Z" fill={dark} />
        </>
      )}
      {feature === 'antenna' && (
        <>
          <line x1="50" y1="24" x2="50" y2="10" stroke={dark} strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="8" r="5" fill="#ffca28" />
        </>
      )}
      {feature === 'ears' && (
        <>
          <circle cx="26" cy="28" r="11" fill={dark} />
          <circle cx="74" cy="28" r="11" fill={dark} />
        </>
      )}
      {feature === 'spikes' && (
        <path d="M30 32 L36 18 L44 30 L50 16 L56 30 L64 18 L70 32" fill={dark} />
      )}
      <path d="M50 24 Q80 26 80 54 Q80 82 50 84 Q20 82 20 54 Q20 26 50 24" fill={color} />
      <ellipse cx="50" cy="70" rx="16" ry="10" fill="#ffffff" opacity=".25" />
      {feature === 'oneeye' ? (
        <>
          <circle cx="50" cy="48" r="16" fill="#fff" />
          <circle cx="50" cy="48" r="7" fill="#263238" />
          <circle cx="47" cy="45" r="2.5" fill="#fff" />
        </>
      ) : feature === 'threeeye' ? (
        <>
          <circle cx="34" cy="46" r="8" fill="#fff" /><circle cx="66" cy="46" r="8" fill="#fff" /><circle cx="50" cy="36" r="7" fill="#fff" />
          <circle cx="34" cy="47" r="3.5" fill="#263238" /><circle cx="66" cy="47" r="3.5" fill="#263238" /><circle cx="50" cy="37" r="3" fill="#263238" />
        </>
      ) : (
        <>
          <circle cx="38" cy="48" r="10" fill="#fff" />
          <circle cx="62" cy="48" r="10" fill="#fff" />
          <circle cx="39" cy="49" r="4.5" fill="#263238" />
          <circle cx="63" cy="49" r="4.5" fill="#263238" />
          <circle cx="36.5" cy="46" r="1.8" fill="#fff" />
          <circle cx="60.5" cy="46" r="1.8" fill="#fff" />
        </>
      )}
      <path d="M42 64 Q50 72 58 64" stroke={dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <g fill="#f48fb1" opacity=".5">
        <circle cx="28" cy="58" r="4" /><circle cx="72" cy="58" r="4" />
      </g>
      {feature === 'horns' && <path d="M30 56 Q22 62 26 68 Q32 66 34 60" fill={color} />}
    </S>
  );
}

const monsterArt: Record<string, (p: IconProps) => React.ReactElement> = {
  mblue: monster('#64b5f6', '#1e88e5', 'horns'),
  mgreen: monster('#81c784', '#388e3c', 'antenna'),
  mpink: monster('#f48fb1', '#d81b60', 'ears'),
  mpurple: monster('#ba68c8', '#8e24aa', 'threeeye'),
  morange: monster('#ffb74d', '#f57c00', 'spikes'),
  mteal: monster('#4db6ac', '#00796b', 'oneeye'),
  mred: monster('#e57373', '#c62828', 'horns'),
  myellow: monster('#fff176', '#fbc02d', 'antenna'),
  mcyan: monster('#4dd0e1', '#0097a7', 'ears'),
  mlime: monster('#aed581', '#689f38', 'threeeye'),
  mmagenta: monster('#f06292', '#ad1457', 'oneeye'),
  mbrown: monster('#bcaaa4', '#6d4c41', 'spikes'),
};

// ---------- Master icon registry ----------
export const GAME_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  ...AvatarArt,
  ...fruitArt,
  ...spaceArt,
  ...sweetArt,
  ...monsterArt,
};

/** True when the "icon id" is actually a raw emoji character */
export function isEmojiIcon(name: string): boolean {
  return /[^\u0000-\u024F\u200d\ufe0f]/.test(name);
}

/** Renders an emoji character inside an SVG so it scales exactly like the drawn icons */
function EmojiArt({ name, className, style }: { name: string } & IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="50" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="74">
        {name}
      </text>
    </svg>
  );
}

export function GameIcon({ name, className, style }: { name: string } & IconProps) {
  const C = GAME_ICONS[name];
  if (C) return <C className={className} style={style} />;
  if (isEmojiIcon(name)) return <EmojiArt name={name} className={className} style={style} />;
  return <GAME_ICONS.owl className={className} style={style} />;
}

// ---------- UI art ----------
export function CoinIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#f9a825" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#f57f17" strokeWidth="5" />
      <circle cx="50" cy="50" r="32" fill="#ffd54f" />
      <path d="M50 30 L57 44 L72 46 L61 57 L64 72 L50 64 L36 72 L39 57 L28 46 L43 44 Z" fill="#f9a825" />
      <path d="M26 34 Q34 22 48 20" stroke="#fff59d" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

export function LogoMark({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bq-brain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a65" />
          <stop offset="1" stopColor="#f4511e" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="62" r="50" fill="#7e57c2" />
      <circle cx="60" cy="62" r="50" fill="url(#bq-brain)" opacity="0" />
      <path d="M60 16 C42 16 32 28 34 40 C24 44 22 58 30 66 C26 78 36 90 50 88 C56 96 76 96 82 86 C94 84 100 70 94 60 C100 50 94 34 80 34 C76 22 68 16 60 16 Z" fill="#ff7043" />
      <path d="M60 22 C48 22 40 30 41 39 C50 37 56 40 58 46 C64 42 72 44 74 52 C80 50 84 54 83 61 C88 62 90 68 87 74 C92 76 94 82 90 87 C94 78 92 70 86 66 C92 56 88 44 78 42 C80 32 72 22 60 22 Z" fill="#ff8a65" />
      <g fill="#fff">
        <circle cx="48" cy="46" r="7" /><circle cx="70" cy="50" r="7" />
      </g>
      <circle cx="50" cy="47" r="3.4" fill="#37474f" />
      <circle cx="72" cy="51" r="3.4" fill="#37474f" />
      <path d="M52 62 Q59 68 66 62" stroke="#4e342e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M84 30 L92 12 L98 26 L110 22 L102 38 Z" fill="#ffd54f" stroke="#f9a825" strokeWidth="2" />
    </svg>
  );
}

/** Professor Hoot — the game mascot (animated via CSS class 'mascot') */
export function Mascot({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 140 150" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="70" cy="140" rx="38" ry="7" fill="#000" opacity=".12" />
      {/* wing */}
      <path d="M22 78 Q10 96 24 108 Q34 100 40 92 Z" fill="#6d4c41" />
      <path d="M118 78 Q130 96 116 108 Q106 100 100 92 Z" fill="#6d4c41" />
      {/* body */}
      <ellipse cx="70" cy="86" rx="40" ry="42" fill="#8d6e63" />
      <ellipse cx="70" cy="94" rx="28" ry="30" fill="#d7ccc8" />
      {/* graduation cap */}
      <path d="M30 34 L70 18 L110 34 L70 48 Z" fill="#37474f" />
      <path d="M48 42 L48 58 Q70 68 92 58 L92 42" fill="#455a64" />
      <line x1="108" y1="36" x2="108" y2="58" stroke="#ffd54f" strokeWidth="3" />
      <circle cx="108" cy="60" r="4" fill="#ffd54f" />
      {/* ear tufts */}
      <path d="M36 40 L48 56 L28 58 Z" fill="#8d6e63" />
      <path d="M104 40 L92 56 L112 58 Z" fill="#8d6e63" />
      {/* eyes */}
      <circle cx="56" cy="66" r="13" fill="#fff" />
      <circle cx="84" cy="66" r="13" fill="#fff" />
      <circle cx="58" cy="67" r="6" fill="#3e2723" />
      <circle cx="86" cy="67" r="6" fill="#3e2723" />
      <circle cx="55.5" cy="64" r="2.2" fill="#fff" />
      <circle cx="83.5" cy="64" r="2.2" fill="#fff" />
      {/* beak */}
      <path d="M63 76 L77 76 L70 86 Z" fill="#ff9800" />
      {/* belly sparkle */}
      <path d="M70 100 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#ffb74d" />
      <circle cx="48" cy="82" r="5" fill="#f8bbd0" opacity=".7" />
      <circle cx="92" cy="82" r="5" fill="#f8bbd0" opacity=".7" />
      {/* feet */}
      <path d="M54 126 Q50 134 58 136" stroke="#ff9800" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M86 126 Q90 134 82 136" stroke="#ff9800" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Exclusive characters (companions shown in lobby & victory) ----------
export const CHAR_ART: Record<string, (p: IconProps) => React.ReactElement> = {
  robokid: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="92" rx="30" ry="5" fill="#000" opacity=".12" />
      <line x1="50" y1="10" x2="50" y2="22" stroke="#90a4ae" strokeWidth="4" />
      <circle cx="50" cy="9" r="4" fill="#ff7043" />
      <rect x="24" y="22" width="52" height="46" rx="12" fill="#b0bec5" />
      <rect x="30" y="28" width="40" height="30" rx="8" fill="#37474f" />
      <circle cx="41" cy="43" r="6" fill="#4facfe" />
      <circle cx="59" cy="43" r="6" fill="#4facfe" />
      <circle cx="42.5" cy="41.5" r="2" fill="#fff" />
      <circle cx="60.5" cy="41.5" r="2" fill="#fff" />
      <rect x="44" y="52" width="12" height="3" rx="1.5" fill="#78909c" />
      <rect x="32" y="70" width="36" height="26" rx="9" fill="#cfd8dc" />
      <circle cx="50" cy="83" r="7" fill="#ffd54f" />
      <path d="M50 79 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 Z" fill="#f9a825" />
      <rect x="16" y="74" width="12" height="6" rx="3" fill="#90a4ae" />
      <rect x="72" y="74" width="12" height="6" rx="3" fill="#90a4ae" />
      <rect x="36" y="96" width="12" height="6" rx="3" fill="#90a4ae" />
      <rect x="52" y="96" width="12" height="6" rx="3" fill="#90a4ae" />
      <path d="M26 30 h8 M26 36 h8" stroke="#eceff1" strokeWidth="2.5" strokeLinecap="round" />
    </S>
  ),
  dragonling: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="92" rx="30" ry="5" fill="#000" opacity=".12" />
      <path d="M28 30 L22 10 L42 24 Z" fill="#ffb300" />
      <path d="M60 22 L72 8 L74 28 Z" fill="#ffb300" />
      <ellipse cx="50" cy="52" rx="32" ry="34" fill="#4caf50" />
      <ellipse cx="50" cy="62" rx="22" ry="22" fill="#a5d6a7" />
      <circle cx="39" cy="44" r="10" fill="#fff" />
      <circle cx="61" cy="44" r="10" fill="#fff" />
      <circle cx="41" cy="46" r="4.5" fill="#1b5e20" />
      <circle cx="59" cy="46" r="4.5" fill="#1b5e20" />
      <circle cx="39.5" cy="43.5" r="1.8" fill="#fff" />
      <circle cx="57.5" cy="43.5" r="1.8" fill="#fff" />
      <path d="M46 56 Q50 60 54 56" stroke="#2e7d32" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="58" r="4" fill="#f8bbd0" opacity=".8" />
      <circle cx="70" cy="58" r="4" fill="#f8bbd0" opacity=".8" />
      <path d="M66 70 Q86 66 88 50 Q90 62 80 74 Q72 80 64 78 Z" fill="#4caf50" />
      <path d="M44 24 l3 6 6 2 -6 2 -3 6 -3 -6 -6 -2 6 -2 Z" fill="#fff59d" />
    </S>
  ),
  fairy: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="93" rx="26" ry="5" fill="#000" opacity=".1" />
      <ellipse cx="26" cy="40" rx="16" ry="24" fill="#b3e5fc" opacity=".75" transform="rotate(-30 26 40)" />
      <ellipse cx="74" cy="40" rx="16" ry="24" fill="#b3e5fc" opacity=".75" transform="rotate(30 74 40)" />
      <circle cx="50" cy="44" r="24" fill="#fce4ec" />
      <path d="M30 40 Q34 16 50 20 Q66 16 70 40 Q62 32 50 32 Q38 32 30 40" fill="#f8bbd0" />
      <circle cx="42" cy="46" r="6" fill="#fff" />
      <circle cx="58" cy="46" r="6" fill="#fff" />
      <circle cx="43.5" cy="47" r="3" fill="#6a1b9a" />
      <circle cx="56.5" cy="47" r="3" fill="#6a1b9a" />
      <circle cx="42.5" cy="45" r="1.2" fill="#fff" />
      <circle cx="55.5" cy="45" r="1.2" fill="#fff" />
      <path d="M46 56 Q50 59 54 56" stroke="#ad1457" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="53" r="3.5" fill="#f48fb1" opacity=".7" />
      <circle cx="65" cy="53" r="3.5" fill="#f48fb1" opacity=".7" />
      <line x1="50" y1="18" x2="50" y2="8" stroke="#ffd54f" strokeWidth="2.5" />
      <circle cx="50" cy="6" r="3.5" fill="#ffd54f" />
      <path d="M78 74 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#fff176" />
      <path d="M22 68 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#fff176" />
    </S>
  ),
  astro: (p) => (
    <S {...p}>
      <ellipse cx="50" cy="93" rx="28" ry="5" fill="#000" opacity=".12" />
      <circle cx="50" cy="42" r="30" fill="#eceff1" />
      <circle cx="42" cy="36" r="8" fill="#fff" opacity=".85" />
      <circle cx="42" cy="44" r="12" fill="#263238" />
      <circle cx="58" cy="44" r="12" fill="#263238" />
      <circle cx="45" cy="42" r="4.5" fill="#4facfe" />
      <circle cx="55" cy="42" r="4.5" fill="#4facfe" />
      <circle cx="43.8" cy="40.5" r="1.5" fill="#fff" />
      <circle cx="53.8" cy="40.5" r="1.5" fill="#fff" />
      <path d="M44 52 Q50 56 56 52" stroke="#ff8a80" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="32" y="66" width="36" height="24" rx="10" fill="#fff" />
      <rect x="40" y="72" width="20" height="12" rx="6" fill="#ff7043" />
      <line x1="50" y1="72" x2="50" y2="84" stroke="#ffd54f" strokeWidth="3" />
      <circle cx="50" cy="78" r="3" fill="#ffd54f" />
      <rect x="18" y="70" width="12" height="7" rx="3.5" fill="#b0bec5" />
      <rect x="70" y="70" width="12" height="7" rx="3.5" fill="#b0bec5" />
      <rect x="34" y="90" width="13" height="6" rx="3" fill="#b0bec5" />
      <rect x="53" y="90" width="13" height="6" rx="3" fill="#b0bec5" />
      <circle cx="84" cy="22" r="3" fill="#ffd54f" />
      <path d="M16 26 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#b39dff" />
    </S>
  ),
};

/** Renders the player's equipped companion (falls back to the original mascot) */
export function CharBuddy({ char, className, style }: { char?: string } & IconProps) {
  const Art = char && char !== 'mascot' ? CHAR_ART[char] : undefined;
  if (Art) return <Art className={className} style={style} />;
  return <Mascot className={className} style={style} />;
}

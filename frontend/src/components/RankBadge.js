import React from 'react';

// Map niveau -> clé de rang
const LEVEL_TO_RANK = [
  [1,  1,  'recruit'],
  [2,  4,  'private'],
  [5,  9,  'lance_corporal'],
  [10, 14, 'corporal'],
  [15, 19, 'sergeant'],
  [20, 24, 'staff_sergeant'],
  [25, 29, 'master_sergeant'],
  [30, 34, 'first_sergeant'],
  [35, 39, 'sergeant_major'],
  [40, 44, 'second_lieutenant'],
  [45, 49, 'lieutenant'],
  [50, 54, 'captain'],
  [55, 59, 'major'],
  [60, 64, 'lieutenant_colonel'],
  [65, 69, 'colonel'],
  [70, 74, 'major_general'],
  [75, 78, 'lieutenant_general'],
  [79, 79, 'general'],
];

export const RANK_NAMES = {
  recruit:            { fr: 'Recrue',              en: 'Recruit' },
  private:            { fr: 'Soldat',              en: 'Private' },
  lance_corporal:     { fr: 'Caporal-chef',        en: 'Lance Corporal' },
  corporal:           { fr: 'Caporal',             en: 'Corporal' },
  sergeant:           { fr: 'Sergent',             en: 'Sergeant' },
  staff_sergeant:     { fr: 'Sergent-chef',        en: 'Staff Sergeant' },
  master_sergeant:    { fr: 'Adjudant',            en: 'Master Sergeant' },
  first_sergeant:     { fr: 'Major',               en: 'First Sergeant' },
  sergeant_major:     { fr: 'Sergent-major',       en: 'Sergeant Major' },
  second_lieutenant:  { fr: 'Sous-lieutenant',     en: '2nd Lieutenant' },
  lieutenant:         { fr: 'Lieutenant',          en: 'Lieutenant' },
  captain:            { fr: 'Capitaine',           en: 'Captain' },
  major:              { fr: 'Commandant',          en: 'Major' },
  lieutenant_colonel: { fr: 'Lieutenant-colonel',  en: 'Lt. Colonel' },
  colonel:            { fr: 'Colonel',             en: 'Colonel' },
  major_general:      { fr: 'G\u00e9n. de brigade',    en: 'Major General' },
  lieutenant_general: { fr: 'G\u00e9n. de corps',      en: 'Lt. General' },
  general:            { fr: 'G\u00e9n\u00e9ral',            en: 'General' },
};

export function getRankKey(level) {
  const lvl = Math.min(79, Math.max(1, Number(level) || 1));
  for (const [min, max, key] of LEVEL_TO_RANK) {
    if (lvl >= min && lvl <= max) return key;
  }
  return 'general';
}

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
  bg:     '#1a1a1a',
  border: '#3a3a2a',
  strap:  '#5a5a3a',  // fond galon kaki
  bar:    '#c8a84b',  // or Tarkov
  bar2:   '#e8c860',  // or clair
  star:   '#f0d060',  // étoile
  red:    '#c04030',  // rouge officier
  silver: '#a0a8b0',  // argent général
  white:  '#e8e8e8',
};

// ── Primitives SVG ──────────────────────────────────────────────────────────────
// Barre horizontale sur la longueur du galon
const Bar = ({ y, color = C.bar, h = 3 }) => (
  <rect x="2" y={y} width="24" height={h} rx="0.5" fill={color} />
);
// Petit carré / pip
const Pip = ({ x, y, color = C.bar, s = 3.5 }) => (
  <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="0.5" fill={color} />
);
// Étoile 5 branches
function Star({ cx, cy, r = 3.5, color = C.star }) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    pts.push(`${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`);
    pts.push(`${cx + (r * 0.4) * Math.cos(a2)},${cy + (r * 0.4) * Math.sin(a2)}`);
  }
  return <polygon points={pts.join(' ')} fill={color} />;
}
// Losange
const Diamond = ({ cx, cy, w = 4, h = 5, color = C.bar }) => (
  <polygon
    points={`${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`}
    fill={color}
  />
);

// ── Fond du galon (parallélogramme kaki) ───────────────────────────────────────
const StrapBg = () => (
  <>
    <rect x="1" y="1" width="26" height="26" rx="3" fill={C.strap} />
    <rect x="1" y="1" width="26" height="26" rx="3" fill="none" stroke={C.border} strokeWidth="1" />
  </>
);

// ── Designs par rang ──────────────────────────────────────────────────────────────
const RANK_SVG = {
  // Recrues / soldats : fond vide ou pip(s)
  recruit:        () => <><StrapBg /></>,
  private:        () => <><StrapBg /><Pip x={14} y={14} s={5} /></>,
  lance_corporal: () => <><StrapBg /><Bar y={11} /><Bar y={16} /></>,
  corporal:       () => <><StrapBg /><Bar y={9} /><Bar y={14} /><Bar y={19} /></>,

  // Sous-officiers : barres + pips
  sergeant:       () => <><StrapBg /><Bar y={8} h={4} /><Pip x={14} y={18} /></>,
  staff_sergeant: () => <><StrapBg /><Bar y={7} h={4} /><Pip x={10} y={18} /><Pip x={18} y={18} /></>,
  master_sergeant:() => <><StrapBg /><Bar y={7} h={4} /><Pip x={8} y={18} /><Pip x={14} y={18} /><Pip x={20} y={18} /></>,
  first_sergeant: () => <><StrapBg /><Bar y={6} h={4} /><Bar y={12} h={2} /><Pip x={14} y={21} /></>,
  sergeant_major: () => <><StrapBg /><Bar y={6} h={4} /><Bar y={12} h={2} /><Pip x={10} y={21} /><Pip x={18} y={21} /></>,

  // Officiers subalterns : fond rouge + étoile(s)
  second_lieutenant: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.red} opacity="0.35" />
      <Star cx={14} cy={14} r={5} />
    </>
  ),
  lieutenant: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.red} opacity="0.35" />
      <Star cx={10} cy={14} r={4} /><Star cx={19} cy={14} r={4} />
    </>
  ),
  captain: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.red} opacity="0.35" />
      <Star cx={8}  cy={17} r={4} /><Star cx={14} cy={9}  r={4} /><Star cx={20} cy={17} r={4} />
    </>
  ),

  // Officiers supérieurs : losanges
  major: () => (
    <><StrapBg />
      <Bar y={6} h={4} color={C.red} />
      <Diamond cx={14} cy={17} />
    </>
  ),
  lieutenant_colonel: () => (
    <><StrapBg />
      <Bar y={6} h={4} color={C.red} />
      <Diamond cx={10} cy={17} /><Diamond cx={18} cy={17} />
    </>
  ),
  colonel: () => (
    <><StrapBg />
      <Bar y={6} h={4} color={C.red} />
      <Diamond cx={8} cy={17} /><Diamond cx={14} cy={17} /><Diamond cx={20} cy={17} />
    </>
  ),

  // Généraux : argenté + étoile(s) grandes
  major_general: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.silver} opacity="0.2" />
      <Bar y={6} h={3} color={C.silver} /><Bar y={11} h={3} color={C.silver} />
      <Star cx={14} cy={20} r={4.5} color={C.silver} />
    </>
  ),
  lieutenant_general: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.silver} opacity="0.2" />
      <Bar y={6} h={3} color={C.silver} /><Bar y={11} h={3} color={C.silver} />
      <Star cx={10} cy={20} r={4} color={C.silver} /><Star cx={19} cy={20} r={4} color={C.silver} />
    </>
  ),
  general: () => (
    <><StrapBg />
      <rect x="2" y="2" width="24" height="24" rx="2" fill={C.silver} opacity="0.25" />
      <Bar y={5} h={3} color={C.silver} /><Bar y={10} h={3} color={C.silver} /><Bar y={15} h={3} color={C.silver} />
      <Star cx={14} cy={23} r={3.5} color={C.star} />
    </>
  ),
};

// ── Composant principal ──────────────────────────────────────────────────────────────
export function RankBadge({ level, size = 40 }) {
  const key    = getRankKey(level);
  const Render = RANK_SVG[key] ?? RANK_SVG.recruit;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
      aria-label={key}
    >
      <Render />
    </svg>
  );
}

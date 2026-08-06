import React from 'react';

// Palette épaulette Tarkov (style armée russe)
const BG       = '#4a5c3a';  // fond kaki olive
const BG_DARK  = '#3a4a2c';  // fond ombre
const STRIPE   = '#c8a84b';  // bande dorée
const STAR_CLR = '#c8a84b';  // étoile dorée
const EDGE     = '#2a3820';  // bordure
const PIPING   = '#8b9a6e';  // liseré

// ── Primitives ───────────────────────────────────────────────────────────────

// Forme d'épaulette (trapeze arrondi, W=40, H=56)
const STRAP_PATH = 'M6,56 L4,12 Q4,4 12,4 L28,4 Q36,4 36,12 L34,56 Z';

function StrapBase() {
  return (
    <>
      {/* Ombre */}
      <path d={STRAP_PATH} fill={BG_DARK} transform="translate(1,1)" opacity="0.4" />
      {/* Corps */}
      <path d={STRAP_PATH} fill={BG} />
      {/* Liseré contour */}
      <path d={STRAP_PATH} fill="none" stroke={PIPING} strokeWidth="1.5" />
      {/* Bordure extérieure */}
      <path d={STRAP_PATH} fill="none" stroke={EDGE} strokeWidth="0.6" />
      {/* Bouton de haut */}
      <circle cx="20" cy="8" r="3.5" fill={STRIPE} />
      <circle cx="20" cy="8" r="2" fill={BG_DARK} />
      <circle cx="20" cy="8" r="0.8" fill={STRIPE} />
    </>
  );
}

// Bande transversale (soldat/sous-officier)
function HStripe({ y, thick = 4 }) {
  return (
    <rect x="7" y={y} width="26" height={thick} fill={STRIPE} rx="0.5"
      clipPath="url(#strap-clip)" />
  );
}

// Étoile à 5 branches
function Star({ cx, cy, r = 5 }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const outer = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    return [
      cx + r * Math.cos(outer), cy + r * Math.sin(outer),
      cx + r * 0.42 * Math.cos(inner), cy + r * 0.42 * Math.sin(inner),
    ];
  }).flat();
  const d = pts.reduce((acc, v, i) =>
    i % 2 === 0
      ? acc + (i === 0 ? `M${v},` : `L${v},`)
      : acc + `${v} `, '');
  return <path d={d + 'Z'} fill={STAR_CLR} clipPath="url(#strap-clip)" />;
}

// Bande longitudinale (officier supérieur)
function VStripe({ x }) {
  return <rect x={x} y="14" width="3.5" height="40" fill={STRIPE} opacity="0.7" clipPath="url(#strap-clip)" />;
}

// ── Conteneur SVG ───────────────────────────────────────────────────────────────
function Strap({ children, size = 40 }) {
  return (
    <svg viewBox="0 0 40 60" width={size} height={size * 1.5}
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <clipPath id="strap-clip">
          <path d={STRAP_PATH} />
        </clipPath>
      </defs>
      <StrapBase />
      {children}
    </svg>
  );
}

// ── 18 rangs ───────────────────────────────────────────────────────────────
// Soldier / NCO ranks  = horizontal stripes
// Officer ranks        = vertical stripe(s) + stars
// General ranks        = 2 vertical stripes + stars (larger)

const RANK_SVG = {
  // Recruit  L1 — épaulette vide
  recruit: () => <Strap></Strap>,

  // Private  L2-4 — 1 bande
  private: () => <Strap><HStripe y={40} /></Strap>,

  // Lance Corporal L5-9 — 2 bandes
  lance_corporal: () => <Strap><HStripe y={34} /><HStripe y={41} /></Strap>,

  // Corporal L10-14 — 3 bandes
  corporal: () => <Strap><HStripe y={28} /><HStripe y={35} /><HStripe y={42} /></Strap>,

  // Sergeant L15-19 — 1 bande large dorée
  sergeant: () => <Strap><HStripe y={36} thick={7} /></Strap>,

  // Staff Sergeant L20-24 — 1 bande large + 1 étroite
  staff_sergeant: () => <Strap><HStripe y={30} thick={3} /><HStripe y={37} thick={7} /></Strap>,

  // Master Sergeant L25-29 — 1 bande large + 2 étroites
  master_sergeant: () => <Strap><HStripe y={24} thick={3} /><HStripe y={30} thick={3} /><HStripe y={37} thick={7} /></Strap>,

  // First Sergeant L30-34 — 3 bandes larges
  first_sergeant: () => <Strap><HStripe y={22} thick={6} /><HStripe y={31} thick={6} /><HStripe y={40} thick={6} /></Strap>,

  // Sergeant Major L35-39 — bande longitudinale + 1 étoile
  sergeant_major: () => <Strap><VStripe x={18} /><Star cx={20} cy={34} r={5} /></Strap>,

  // Second Lieutenant L40-44 — 1 bande long + 1 étoile
  second_lieutenant: () => <Strap><VStripe x={18} /><Star cx={20} cy={33} r={5.5} /></Strap>,

  // Lieutenant L45-49 — 1 bande long + 2 étoiles
  lieutenant: () => <Strap><VStripe x={18} /><Star cx={20} cy={27} r={5} /><Star cx={20} cy={40} r={5} /></Strap>,

  // Captain L50-54 — 1 bande long + 3 étoiles
  captain: () => <Strap><VStripe x={18} /><Star cx={20} cy={22} r={4.5} /><Star cx={20} cy={32} r={4.5} /><Star cx={20} cy={42} r={4.5} /></Strap>,

  // Major L55-59 — 2 bandes long + 1 étoile (centrée)
  major: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={33} r={5.5} /></Strap>,

  // Lieutenant Colonel L60-64 — 2 bandes long + 2 étoiles
  lieutenant_colonel: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={26} r={5} /><Star cx={20} cy={39} r={5} /></Strap>,

  // Colonel L65-69 — 2 bandes long + 3 étoiles
  colonel: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={21} r={4.5} /><Star cx={20} cy={31} r={4.5} /><Star cx={20} cy={41} r={4.5} /></Strap>,

  // Major General L70-74 — 2 bandes + 2 étoiles (grandes)
  major_general: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={27} r={6.5} /><Star cx={20} cy={42} r={6.5} /></Strap>,

  // Lieutenant General L75-78 — 2 bandes + 3 grandes étoiles
  lieutenant_general: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={22} r={6} /><Star cx={20} cy={33} r={6} /><Star cx={20} cy={44} r={6} /></Strap>,

  // General L79 — 2 bandes + étoile unique XXL
  general: () => <Strap><VStripe x={11} /><VStripe x={25} /><Star cx={20} cy={33} r={9} /></Strap>,
};

// Map niveau → clé de rang
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
  recruit:           { fr: 'Recrue',              en: 'Recruit' },
  private:           { fr: 'Soldat',              en: 'Private' },
  lance_corporal:    { fr: 'Caporal-chef',         en: 'Lance Corporal' },
  corporal:          { fr: 'Caporal',              en: 'Corporal' },
  sergeant:          { fr: 'Sergent',              en: 'Sergeant' },
  staff_sergeant:    { fr: 'Sergent-chef',         en: 'Staff Sergeant' },
  master_sergeant:   { fr: 'Adjudant',             en: 'Master Sergeant' },
  first_sergeant:    { fr: 'Major',                en: 'First Sergeant' },
  sergeant_major:    { fr: 'Sergent-major',        en: 'Sergeant Major' },
  second_lieutenant: { fr: 'Sous-lieutenant',      en: '2nd Lieutenant' },
  lieutenant:        { fr: 'Lieutenant',           en: 'Lieutenant' },
  captain:           { fr: 'Capitaine',            en: 'Captain' },
  major:             { fr: 'Commandant',           en: 'Major' },
  lieutenant_colonel:{ fr: 'Lieutenant-colonel',   en: 'Lt. Colonel' },
  colonel:           { fr: 'Colonel',              en: 'Colonel' },
  major_general:     { fr: 'G\u00e9n. de brigade',      en: 'Major General' },
  lieutenant_general:{ fr: 'G\u00e9n. de corps',        en: 'Lt. General' },
  general:           { fr: 'G\u00e9n\u00e9ral',              en: 'General' },
};

export function getRankKey(level) {
  const lvl = Math.min(79, Math.max(1, Number(level) || 1));
  for (const [min, max, key] of LEVEL_TO_RANK) {
    if (lvl >= min && lvl <= max) return key;
  }
  return 'general';
}

export function RankBadge({ level, size = 40 }) {
  const key     = getRankKey(level);
  const Builder = RANK_SVG[key];
  if (!Builder) return null;
  return <Builder size={size} />;
}

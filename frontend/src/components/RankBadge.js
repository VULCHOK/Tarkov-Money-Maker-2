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
  recruit:            { fr: 'Recrue',             en: 'Recruit' },
  private:            { fr: 'Soldat',             en: 'Private' },
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
  major_general:      { fr: 'G\u00e9n. de brigade',     en: 'Major General' },
  lieutenant_general: { fr: 'G\u00e9n. de corps',       en: 'Lt. General' },
  general:            { fr: 'G\u00e9n\u00e9ral',             en: 'General' },
};

export function getRankKey(level) {
  const lvl = Math.min(79, Math.max(1, Number(level) || 1));
  for (const [min, max, key] of LEVEL_TO_RANK) {
    if (lvl >= min && lvl <= max) return key;
  }
  return 'general';
}

export function RankBadge({ level, size = 40 }) {
  const key = getRankKey(level);
  return (
    <img
      src={`/images/ranks/${key}.png`}
      alt={key}
      width={size}
      height={size}
      style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

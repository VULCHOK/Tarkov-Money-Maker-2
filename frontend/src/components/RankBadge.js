import React from 'react';

// Seuils disponibles : correspond aux fichiers Rank{n}.webp dans /images/
// On prend toujours l'image dont le seuil est <= niveau joueur
const RANK_THRESHOLDS = [1, 5, 10, 15, 20, 25, 30, 35, 45, 50, 60, 65, 70, 75];

// Noms affichés (pour le label texte à droite du badge)
export const RANK_NAMES = {
  1:  { fr: 'Recrue',             en: 'Recruit' },
  5:  { fr: 'Soldat',             en: 'Private' },
  10: { fr: 'Caporal',            en: 'Corporal' },
  15: { fr: 'Sergent',            en: 'Sergeant' },
  20: { fr: 'Sergent-chef',       en: 'Staff Sergeant' },
  25: { fr: 'Adjudant',           en: 'Master Sergeant' },
  30: { fr: 'Sergent-major',      en: 'Sergeant Major' },
  35: { fr: 'Sous-lieutenant',    en: '2nd Lieutenant' },
  45: { fr: 'Lieutenant',         en: 'Lieutenant' },
  50: { fr: 'Capitaine',          en: 'Captain' },
  60: { fr: 'Major',              en: 'Major' },
  65: { fr: 'Lieutenant-colonel', en: 'Lt. Colonel' },
  70: { fr: 'Colonel',            en: 'Colonel' },
  75: { fr: 'G\u00e9n\u00e9ral',            en: 'General' },
};

/**
 * getRankThreshold(level)
 * Retourne le seuil de l'image à afficher pour un niveau donné.
 * Ex: niveau 3  -> seuil 1  -> Rank1.webp
 *     niveau 12 -> seuil 10 -> Rank10.webp
 *     niveau 47 -> seuil 45 -> Rank45.webp
 *     niveau 80 -> seuil 75 -> Rank75.webp
 */
export function getRankThreshold(level) {
  const lvl = Math.max(1, Number(level) || 1);
  let threshold = RANK_THRESHOLDS[0];
  for (const t of RANK_THRESHOLDS) {
    if (lvl >= t) threshold = t;
    else break;
  }
  return threshold;
}

// Alias pour compatibilité avec Filters.js qui importe getRankKey
export function getRankKey(level) {
  return getRankThreshold(level);
}

// Composant badge
export function RankBadge({ level, size = 40 }) {
  const threshold = getRankThreshold(level);
  return (
    <img
      src={`/images/Rank${threshold}.webp`}
      alt={`Rank ${threshold}`}
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0, display: 'block' }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

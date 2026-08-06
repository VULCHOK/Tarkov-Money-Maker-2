import React from 'react';

// Fence retiré — prix jamais intéressants (#8)
export const TRADER_LEVELS = {
  Prapor:      [1, 2, 3, 4],
  Therapist:   [1, 2, 3, 4],
  Skier:       [1, 2, 3, 4],
  Peacekeeper: [1, 2, 3, 4],
  Mechanic:    [1, 2, 3, 4],
  Ragman:      [1, 2, 3, 4],
  Jaeger:      [1, 2, 3, 4],
  Lightkeeper: [1, 2, 3, 4],
};

export const ALL_TRADERS = Object.keys(TRADER_LEVELS);

// URLs vers le volume dynamique monté par le backend au démarrage
// Fallback : raw.githubusercontent.com si le volume n'est pas encore prêt
export const TRADER_META = {
  Prapor:      { img: '/images/traders-dynamic/traders/prapor-portrait.png',      fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/prapor-portrait.png' },
  Therapist:   { img: '/images/traders-dynamic/traders/therapist-portrait.png',   fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/therapist-portrait.png' },
  Skier:       { img: '/images/traders-dynamic/traders/skier-portrait.png',       fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/skier-portrait.png' },
  Peacekeeper: { img: '/images/traders-dynamic/traders/peacekeeper-portrait.png', fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/peacekeeper-portrait.png' },
  Mechanic:    { img: '/images/traders-dynamic/traders/mechanic-portrait.png',    fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/mechanic-portrait.png' },
  Ragman:      { img: '/images/traders-dynamic/traders/ragman-portrait.png',      fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/ragman-portrait.png' },
  Jaeger:      { img: '/images/traders-dynamic/traders/jaeger-portrait.png',      fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/jaeger-portrait.png' },
  Lightkeeper: { img: '/images/traders-dynamic/traders/lightkeeper-portrait.png', fallback: 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders/lightkeeper-portrait.png' },
};

export function defaultTraderFilters() {
  const saved = localStorage.getItem('traderFilters');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const { Fence: _f, ...rest } = parsed;
      return rest;
    } catch {}
  }
  return Object.fromEntries(ALL_TRADERS.map((t) => [t, { enabled: true, level: 1 }]));
}

export function defaultIntelLevel() {
  const saved = localStorage.getItem('intelLevel');
  return saved !== null ? Number(saved) : 0;
}

const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 30 };

const INTEL_OPTIONS = [
  { level: 0, label: 'Non construit', sub: 'Pas de réduction' },
  { level: 1, label: 'Intel Center L1', sub: 'Pas de réduction' },
  { level: 2, label: 'Intel Center L2', sub: 'Pas de réduction' },
  { level: 3, label: 'Intel Center L3', sub: '-30% de taxe flea' },
];

/**
 * Carte trader redesignée :
 * ┌─────────────────────────────┐
 * │  [Portrait 56x56]  [1]      │
 * │                    [2]      │
 * │   Nom du trader    [3] ←LL  │
 * │                    [4]      │
 * └─────────────────────────────┘
 * Clic sur la carte → toggle enabled
 * Clic sur un bouton LL → change le niveau (sans stopper le toggle)
 */
function TraderCard({ trader, tf, onToggle, onLevel }) {
  const meta     = TRADER_META[trader];
  const levels   = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;

  const handleImgError = (e) => {
    if (meta.fallback && e.target.src !== meta.fallback) {
      e.target.src = meta.fallback;
    } else {
      e.target.style.display = 'none';
    }
  };

  return (
    <div
      onClick={() => onToggle(trader)}
      className={`relative flex items-stretch gap-0 rounded-lg border overflow-hidden cursor-pointer select-none transition-all ${
        isEnabled
          ? 'border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40'
          : 'border-tarkov-border bg-tarkov-bg opacity-40 grayscale'
      }`}
      style={{ width: 110 }}
      title={`${trader} — cliquer pour ${isEnabled ? 'désactiver' : 'activer'}`}
    >
      {/* Portrait grand format */}
      <div className="relative flex-shrink-0" style={{ width: 72, height: 80 }}>
        <img
          src={meta.img}
          alt={trader}
          className="w-full h-full object-cover object-top"
          onError={handleImgError}
        />
        {/* Overlay nom en bas du portrait */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
          <span className={`text-[10px] font-bold leading-none block truncate ${
            isEnabled ? 'text-tarkov-gold' : 'text-gray-400'
          }`}>{trader}</span>
        </div>
      </div>

      {/* Boutons LL verticaux */}
      <div
        className="flex flex-col justify-around items-center px-1 py-1 bg-black/30"
        style={{ width: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        {levels.map((lvl) => {
          const isActive = isEnabled && tf.level === lvl;
          return (
            <button
              key={lvl}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEnabled) onToggle(trader);
                onLevel(trader, lvl);
              }}
              className={`w-7 h-6 rounded text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-tarkov-gold text-tarkov-bg'
                  : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Filters({ filters, onChange, traderFilters, onTraderFiltersChange, intelLevel, onIntelLevelChange }) {
  const handleTraderToggle = (trader) => {
    const next = { ...traderFilters, [trader]: { ...traderFilters[trader], enabled: !traderFilters[trader].enabled } };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };

  const handleTraderLevel = (trader, level) => {
    const next = { ...traderFilters, [trader]: { ...traderFilters[trader], level: Number(level) } };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };

  const handleIntelLevel = (level) => {
    localStorage.setItem('intelLevel', String(level));
    onIntelLevelChange(level);
  };

  const discount = INTEL_DISCOUNTS[intelLevel] ?? 0;

  return (
    <div className="flex flex-col gap-4 mb-6">

      {/* Ligne 1 : Profit min + Intel Center */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Profit minimum (₽)</span>
          <input
            type="number"
            placeholder="ex: 20000"
            value={filters.minProfitRub}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ ...filters, minProfitRub: v });
              localStorage.setItem('minProfitRub', v);
            }}
            className="bg-tarkov-card border border-tarkov-border rounded px-3 py-2 text-sm focus:outline-none focus:border-tarkov-gold w-44"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Intelligence Center</span>
          <div className="flex gap-1">
            {INTEL_OPTIONS.map(({ level, label, sub }) => (
              <button
                key={level}
                onClick={() => handleIntelLevel(level)}
                title={sub}
                className={`px-2 py-1 rounded border text-xs transition-colors ${
                  intelLevel === level
                    ? 'border-tarkov-gold bg-tarkov-card text-tarkov-gold'
                    : 'border-tarkov-border bg-tarkov-bg text-gray-500 hover:border-gray-400'
                }`}
              >
                {level === 0 ? '✕' : `L${level}`}
              </button>
            ))}
            {discount > 0 && (
              <span className="ml-1 self-center text-xs text-green-400">-{discount}% taxe</span>
            )}
          </div>
        </div>
      </div>

      {/* Cartes traders */}
      <div className="flex flex-wrap gap-2">
        {ALL_TRADERS.map((trader) => (
          <TraderCard
            key={trader}
            trader={trader}
            tf={traderFilters[trader] || { enabled: true, level: 1 }}
            onToggle={handleTraderToggle}
            onLevel={handleTraderLevel}
          />
        ))}
      </div>
    </div>
  );
}

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

export const TRADER_META = {
  Prapor:      { img: 'https://assets.tarkov.dev/prapor-portrait.png' },
  Therapist:   { img: 'https://assets.tarkov.dev/therapist-portrait.png' },
  Skier:       { img: 'https://assets.tarkov.dev/skier-portrait.png' },
  Peacekeeper: { img: 'https://assets.tarkov.dev/peacekeeper-portrait.png' },
  Mechanic:    { img: 'https://assets.tarkov.dev/mechanic-portrait.png' },
  Ragman:      { img: 'https://assets.tarkov.dev/ragman-portrait.png' },
  Jaeger:      { img: 'https://assets.tarkov.dev/jaeger-portrait.png' },
  Lightkeeper: { img: 'https://assets.tarkov.dev/lightkeeper-portrait.png' },
};

export function defaultTraderFilters() {
  const saved = localStorage.getItem('traderFilters');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Nettoyer Fence si présent dans les saves anciennes
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

function TraderCard({ trader, tf, onToggle, onLevel }) {
  const meta = TRADER_META[trader];
  const levels = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-2 transition-colors cursor-pointer select-none ${
        isEnabled
          ? 'border-tarkov-gold bg-tarkov-card'
          : 'border-tarkov-border bg-tarkov-bg opacity-50'
      }`}
      style={{ minWidth: 150 }}
      onClick={() => onToggle(trader)}
    >
      {/* Portrait */}
      <img
        src={meta.img}
        alt={trader}
        className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
        style={{ borderColor: isEnabled ? '#c8a84b' : '#3a3a3a' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* Nom + niveaux */}
      <div className="flex flex-col gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
        <span className={`text-xs font-semibold leading-none ${
          isEnabled ? 'text-tarkov-gold' : 'text-gray-500'
        }`}>{trader}</span>

        {/* Boutons LL */}
        <div className="flex gap-0.5">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEnabled) {
                  // Réactiver le trader ET changer le niveau en un clic
                  onToggle(trader);
                }
                onLevel(trader, lvl);
              }}
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${
                isEnabled && tf.level === lvl
                  ? 'bg-tarkov-gold text-tarkov-bg'
                  : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
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

        {/* Profit minimum */}
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

        {/* Intel Center */}
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

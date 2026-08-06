import React from 'react';

export const TRADER_LEVELS = {
  Prapor:      [1, 2, 3, 4],
  Therapist:   [1, 2, 3, 4],
  Skier:       [1, 2, 3, 4],
  Peacekeeper: [1, 2, 3, 4],
  Mechanic:    [1, 2, 3, 4],
  Ragman:      [1, 2, 3, 4],
  Jaeger:      [1, 2, 3, 4],
  Fence:       [1],
  Lightkeeper: [1, 2, 3, 4],
};

export const ALL_TRADERS = Object.keys(TRADER_LEVELS);

export function defaultTraderFilters() {
  const saved = localStorage.getItem('traderFilters');
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return Object.fromEntries(ALL_TRADERS.map((t) => [t, { enabled: true, level: 1 }]));
}

export function defaultIntelLevel() {
  const saved = localStorage.getItem('intelLevel');
  return saved !== null ? Number(saved) : 0;
}

// Intel Center discount table (mirrors price_calculator.py)
const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 30 };

const INTEL_OPTIONS = [
  { level: 0, label: 'Non construit', sub: 'Pas de réduction' },
  { level: 1, label: 'Intel Center L1', sub: 'Pas de réduction' },
  { level: 2, label: 'Intel Center L2', sub: 'Pas de réduction' },
  { level: 3, label: 'Intel Center L3', sub: '-30% de taxe flea' },
];

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
    <div className="flex flex-col gap-3 mb-4">
      {/* Ligne 1 : Profit min + Intel Center */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          type="number"
          placeholder="Min profit ₽"
          value={filters.minProfitRub}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...filters, minProfitRub: v });
            localStorage.setItem('minProfitRub', v);
          }}
          className="bg-tarkov-card border border-tarkov-border rounded px-3 py-2 text-sm focus:outline-none focus:border-tarkov-gold w-44"
        />

        {/* Sélecteur Intel Center */}
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

      {/* Filtres traders */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400 mr-1">Traders :</span>
        {ALL_TRADERS.map((trader) => {
          const tf = traderFilters[trader];
          return (
            <div
              key={trader}
              className={`flex items-center gap-1.5 border rounded px-2 py-1 text-xs transition-colors ${
                tf.enabled
                  ? 'border-tarkov-gold bg-tarkov-card text-tarkov-gold'
                  : 'border-tarkov-border bg-tarkov-bg text-gray-500'
              }`}
            >
              <button onClick={() => handleTraderToggle(trader)} className="font-semibold leading-none">
                {trader}
              </button>
              {tf.enabled && TRADER_LEVELS[trader].length > 1 && (
                <select
                  value={tf.level}
                  onChange={(e) => handleTraderLevel(trader, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-tarkov-bg border border-tarkov-border rounded text-xs px-1 py-0.5 focus:outline-none focus:border-tarkov-gold"
                >
                  {TRADER_LEVELS[trader].map((lvl) => (
                    <option key={lvl} value={lvl}>LL{lvl}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

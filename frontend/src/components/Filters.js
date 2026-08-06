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
  return Object.fromEntries(
    ALL_TRADERS.map((t) => [t, { enabled: true, level: 1 }])
  );
}

export function Filters({ filters, onChange, traderFilters, onTraderFiltersChange }) {
  const handleTraderToggle = (trader) => {
    const next = {
      ...traderFilters,
      [trader]: { ...traderFilters[trader], enabled: !traderFilters[trader].enabled },
    };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };

  const handleTraderLevel = (trader, level) => {
    const next = {
      ...traderFilters,
      [trader]: { ...traderFilters[trader], level: Number(level) },
    };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Filtre profit minimum */}
      <div className="flex flex-wrap gap-3">
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
              <button
                onClick={() => handleTraderToggle(trader)}
                className="font-semibold leading-none"
              >
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

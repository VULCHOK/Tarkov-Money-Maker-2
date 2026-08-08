import React, { useMemo } from 'react';

/**
 * Displays a quick summary bar above the filters:
 * total visible items, best profit, average profit.
 */
export function StatsBar({ items = [] }) {
  const stats = useMemo(() => {
    if (!items.length) return null;
    let best = -Infinity;
    let sum  = 0;
    let count = 0;
    for (const item of items) {
      try {
        const profit =
          item._bestProfit ??
          item.best_profit ??
          (item.flea_price ?? 0) - (item.flea_fee ?? 0);
        if (typeof profit === 'number' && isFinite(profit)) {
          if (profit > best) best = profit;
          sum += profit;
          count++;
        }
      } catch { /* skip */ }
    }
    return {
      total: items.length,
      best:  best === -Infinity ? null : best,
      avg:   count > 0 ? Math.round(sum / count) : null,
    };
  }, [items]);

  if (!stats) return null;

  const fmt = (n) =>
    n == null ? '—' : new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' ₽';

  return (
    <div className="flex items-center gap-4 mb-3 text-xs text-gray-400 flex-wrap">
      <span>
        <span className="text-tarkov-gold font-semibold">{stats.total.toLocaleString()}</span>
        {' '}items
      </span>
      <span className="w-px h-3 bg-white/10" />
      <span title="Best profit among visible items">
        Best&nbsp;
        <span className="text-green-400 font-semibold tabular-nums">{fmt(stats.best)}</span>
      </span>
      <span className="w-px h-3 bg-white/10" />
      <span title="Average profit among visible items">
        Avg&nbsp;
        <span className="text-gray-300 font-semibold tabular-nums">{fmt(stats.avg)}</span>
      </span>
    </div>
  );
}

import React from 'react';

export function StatsBar({ items }) {
  const profitable = items.filter((i) => i.recommendation === 'BUY_FROM_TRADER').length;
  const hotDeals   = items.filter((i) => (i.difference_pct || 0) >= 20).length;
  const total      = items.length;

  return (
    <div className="flex gap-6 mb-4 text-sm">
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Total items: </span>
        <span className="font-bold text-tarkov-gold">{total}</span>
      </div>
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Buy from trader: </span>
        <span className="font-bold text-tarkov-green">{profitable}</span>
      </div>
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Hot deals (&gt;20%): </span>
        <span className="font-bold text-orange-400">{hotDeals}</span>
      </div>
    </div>
  );
}

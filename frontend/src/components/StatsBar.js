import React from 'react';

export function StatsBar({ items }) {
  const total      = items.length;
  const profitable = items.filter((i) => i.recommendation === 'BUY_FROM_TRADER').length;
  const hotDeals   = items.filter((i) => (i.difference_pct || 0) >= 20).length;
  const fleaOnly   = items.filter((i) => i.recommendation === 'FLEA_ONLY').length;

  return (
    <div className="flex flex-wrap gap-3 mb-4 text-sm">
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Items affichés : </span>
        <span className="font-bold text-tarkov-gold">{total.toLocaleString('fr-FR')}</span>
      </div>
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Buy from trader : </span>
        <span className="font-bold text-tarkov-green">{profitable.toLocaleString('fr-FR')}</span>
      </div>
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Hot deals (&gt;20 %) : </span>
        <span className="font-bold text-orange-400">{hotDeals.toLocaleString('fr-FR')}</span>
      </div>
      <div className="bg-tarkov-card border border-tarkov-border rounded px-4 py-2">
        <span className="text-gray-400">Flea only : </span>
        <span className="font-bold text-blue-400">{fleaOnly.toLocaleString('fr-FR')}</span>
      </div>
    </div>
  );
}

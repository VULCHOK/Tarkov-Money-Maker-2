import React from 'react';

function toCSV(items, lang) {
  if (!items.length) return '';
  const nameKey    = lang === 'fr' ? 'name_fr'       : 'name_en';
  const snameKey   = lang === 'fr' ? 'short_name_fr' : 'short_name_en';
  const headers = ['id', nameKey, snameKey, 'category', 'flea_price', 'best_trader', 'best_trader_price', 'difference', 'difference_pct', 'recommendation'];
  const displayHeaders = ['id', 'name', 'short_name', 'category', 'flea_price', 'best_trader', 'best_trader_price', 'difference', 'difference_pct', 'recommendation'];
  const rows = items.map((item) => headers.map((h) => JSON.stringify(item[h] ?? '')).join(','));
  return [displayHeaders.join(','), ...rows].join('\n');
}

export function ExportButtons({ items, lang = 'en' }) {
  const exportCSV = () => {
    const blob = new Blob([toCSV(items, lang)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tarkov_prices_${lang}.csv`;
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tarkov_prices_${lang}.json`;
    a.click();
  };

  return (
    <div className="flex gap-2">
      <button onClick={exportCSV}  className="px-3 py-1.5 bg-tarkov-card border border-tarkov-border rounded text-sm hover:bg-tarkov-border transition-colors">CSV</button>
      <button onClick={exportJSON} className="px-3 py-1.5 bg-tarkov-card border border-tarkov-border rounded text-sm hover:bg-tarkov-border transition-colors">JSON</button>
    </div>
  );
}

import React from 'react';

function toCSV(items) {
  if (!items.length) return '';
  const headers = ['id','name','category','flea_price','best_trader','best_trader_price','difference','difference_pct','recommendation'];
  const rows = items.map((item) => headers.map((h) => JSON.stringify(item[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function ExportButtons({ items }) {
  const exportCSV = () => {
    const blob = new Blob([toCSV(items)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tarkov_prices.csv';
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tarkov_prices.json';
    a.click();
  };

  return (
    <div className="flex gap-2">
      <button onClick={exportCSV} className="px-3 py-1.5 bg-tarkov-card border border-tarkov-border rounded text-sm hover:bg-tarkov-border transition-colors">CSV</button>
      <button onClick={exportJSON} className="px-3 py-1.5 bg-tarkov-card border border-tarkov-border rounded text-sm hover:bg-tarkov-border transition-colors">JSON</button>
    </div>
  );
}

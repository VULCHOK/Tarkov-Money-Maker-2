import React from 'react';
import { useT } from '../hooks/useT';

function toCSV(items, lang) {
  if (!items.length) return '';
  const nameKey  = lang === 'fr' ? 'name_fr'       : 'name_en';
  const snameKey = lang === 'fr' ? 'short_name_fr' : 'short_name_en';
  const headers  = ['id', nameKey, snameKey, 'category', 'flea_price', 'best_trader', 'best_trader_price', 'difference', 'difference_pct', 'recommendation'];
  const display  = ['id', 'name', 'short_name', 'category', 'flea_price', 'best_trader', 'best_trader_price', 'difference', 'difference_pct', 'recommendation'];
  const rows     = items.map((item) => headers.map((h) => JSON.stringify(item[h] ?? '')).join(','));
  return [display.join(','), ...rows].join('\n');
}

export function ExportButtons({ items, lang = 'en', pillBase = '', pillOff = '' }) {
  const t = useT(lang);

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
    <>
      <button onClick={exportCSV}  className={`${pillBase} ${pillOff}`} title={t('exportCSV')}>
        ↓ CSV
      </button>
      <button onClick={exportJSON} className={`${pillBase} ${pillOff}`} title={t('exportJSON')}>
        ↓ JSON
      </button>
    </>
  );
}

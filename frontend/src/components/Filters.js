import React from 'react';

export function Filters({ filters, onChange, categories }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="bg-tarkov-card border border-tarkov-border rounded px-3 py-2 text-sm focus:outline-none focus:border-tarkov-gold w-48"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Min profit % (e.g. 20)"
        value={filters.minProfitPct}
        onChange={(e) => onChange({ ...filters, minProfitPct: e.target.value })}
        className="bg-tarkov-card border border-tarkov-border rounded px-3 py-2 text-sm focus:outline-none focus:border-tarkov-gold w-44"
      />
    </div>
  );
}

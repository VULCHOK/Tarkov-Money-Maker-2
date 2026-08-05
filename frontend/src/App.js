import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { RefreshButton } from './components/RefreshButton';
import { StatsBar } from './components/StatsBar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', minProfitPct: '' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.minProfitPct) params.min_profit_pct = filters.minProfitPct;
      const { data } = await axios.get(`${API_URL}/items/`, { params });
      setItems(data);
    } catch (err) {
      setError('Failed to load items. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleRefresh = async () => {
    await axios.post(`${API_URL}/refresh/`);
    setTimeout(fetchItems, 2000);
  };

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className="border-b border-tarkov-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tarkov-gold">Tarkov Money Maker 2</h1>
          <p className="text-sm text-gray-400">Compare trader prices vs Flea Market</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons items={items} />
          <RefreshButton onRefresh={handleRefresh} />
        </div>
      </header>
      <main className="px-6 py-4">
        <StatsBar items={items} />
        <Filters filters={filters} onChange={setFilters} />
        {loading && <p className="text-center py-8 text-gray-400">Loading items...</p>}
        {error && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && <ItemTable items={items} />}
      </main>
    </div>
  );
}

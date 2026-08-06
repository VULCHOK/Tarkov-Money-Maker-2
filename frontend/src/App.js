import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { RefreshButton } from './components/RefreshButton';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';

const API_BASE = '/api';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', minProfitPct: '' });
  const [categories, setCategories] = useState([]);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  // Persist language choice
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  // Load categories once
  useEffect(() => {
    axios.get(`${API_BASE}/items/categories`)
      .then(({ data }) => setCategories(data))
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.minProfitPct) params.min_profit_pct = filters.minProfitPct;
      const { data } = await axios.get(`${API_BASE}/items/`, { params });
      setItems(data);
    } catch (err) {
      console.error('API error:', err);
      setError(`Failed to load items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleRefresh = async () => {
    try {
      await axios.post(`${API_BASE}/refresh/`);
      setTimeout(fetchItems, 2000);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className="border-b border-tarkov-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-tarkov-gold">Tarkov Money Maker 2</h1>
            <p className="text-sm text-gray-400">Compare trader prices vs Flea Market</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 bg-tarkov-card border border-tarkov-border rounded px-2 py-1">
              <button
                onClick={() => setLang('en')}
                title="English"
                className={`text-lg transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
              >🇬🇧</button>
              <button
                onClick={() => setLang('fr')}
                title="Français"
                className={`text-lg transition-opacity ${lang === 'fr' ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
              >🇫🇷</button>
            </div>
            <ApiStatus />
            <ExportButtons items={items} lang={lang} />
            <RefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </header>
      <main className="px-6 py-4">
        <StatsBar items={items} />
        <Filters filters={filters} onChange={setFilters} categories={categories} />
        {loading && <p className="text-center py-8 text-gray-400">Loading items...</p>}
        {error && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && <ItemTable items={items} lang={lang} />}
      </main>
    </div>
  );
}

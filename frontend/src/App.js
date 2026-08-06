import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { RefreshButton } from './components/RefreshButton';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';

const API_BASE = '/api';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', minProfitRub: '' });
  const [traderFilters, setTraderFilters] = useState(defaultTraderFilters);
  const [categories, setCategories] = useState([]);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

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
      const { data } = await axios.get(`${API_BASE}/items/`, { params });
      // Filtre minProfitRub côté client (recalcul dynamique selon traders)
      setItems(data);
    } catch (err) {
      console.error('API error:', err);
      setError(`Failed to load items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters.category]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleRefresh = async () => {
    try {
      await axios.post(`${API_BASE}/refresh/`);
      setTimeout(fetchItems, 2000);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // Filtrage minProfitRub côté client après recalcul trader
  const minRub = parseFloat(filters.minProfitRub) || null;

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className="border-b border-tarkov-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-tarkov-gold">Tarkov Money Maker 2</h1>
            <p className="text-sm text-gray-400">Compare trader prices vs Flea Market</p>
          </div>
          <div className="flex items-center gap-4">
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
        <Filters
          filters={filters}
          onChange={setFilters}
          categories={categories}
          traderFilters={traderFilters}
          onTraderFiltersChange={setTraderFilters}
        />
        {loading && <p className="text-center py-8 text-gray-400">Loading items...</p>}
        {error && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && (
          <ItemTable
            items={
              minRub
                ? items.filter((item) => {
                    try {
                      const prices = JSON.parse(item.trader_prices || '{}');
                      const bestPrice = Math.max(
                        ...Object.entries(prices)
                          .filter(([t]) => traderFilters[t]?.enabled)
                          .map(([, p]) => p)
                      );
                      const diff = bestPrice - (item.flea_price ?? item.last_low_price ?? 0);
                      return diff >= minRub;
                    } catch { return true; }
                  })
                : items
            }
            lang={lang}
            traderFilters={traderFilters}
          />
        )}
      </main>
    </div>
  );
}

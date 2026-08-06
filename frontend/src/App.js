import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters, defaultIntelLevel } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';

const API_BASE = '/api';

const MODES = [
  { key: 'regular',    label: 'PVP',      emoji: '⚔️' },
  { key: 'pve',        label: 'PVE',      emoji: '🤖' },
  { key: 'pvp-season', label: 'Seasonal', emoji: '❄️' },
];

function defaultMinProfitRub() {
  const saved = localStorage.getItem('minProfitRub');
  return saved !== null ? saved : '20000';
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ minProfitRub: defaultMinProfitRub() });
  const [traderFilters, setTraderFilters] = useState(defaultTraderFilters);
  const [intelLevel, setIntelLevel] = useState(defaultIntelLevel);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');
  const [mode, setMode] = useState(() => localStorage.getItem('gameMode') || 'regular');

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('gameMode', mode); }, [mode]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/items/`, { params: { mode } });
      setItems(data);
    } catch (err) {
      console.error('API error:', err);
      setError(`Failed to load items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 0.30 };
  const feeDiscount = INTEL_DISCOUNTS[intelLevel] ?? 0;

  const minRub = parseFloat(filters.minProfitRub) || 0;

  const visibleItems = items.filter((item) => {
    try {
      const prices     = JSON.parse(item.trader_prices || '{}');
      const fleaPrice  = item.flea_price ?? item.last_low_price ?? 0;
      const activePrices = Object.entries(prices)
        .filter(([t]) => traderFilters[t]?.enabled)
        .map(([, p]) => p);
      const bestTrader = activePrices.length > 0 ? Math.max(...activePrices) : 0;
      const ftsProfit  = bestTrader - fleaPrice;
      const btfFee     = item.flea_fee ? item.flea_fee * (1 - feeDiscount) : 0;
      const traderBuy  = item.best_trader_buy_price || 0;
      const btfProfit  = traderBuy > 0 ? (fleaPrice - btfFee - traderBuy) : -Infinity;
      const bestProfit = Math.max(ftsProfit, btfProfit);
      return minRub > 0 ? bestProfit >= minRub : bestProfit > 0;
    } catch { return true; }
  });

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className="border-b border-tarkov-border px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-tarkov-gold">Tarkov Money Maker 2</h1>
            <p className="text-sm text-gray-400">Compare trader prices vs Flea Market</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sélecteur de mode */}
            <div className="flex items-center gap-1 bg-tarkov-card border border-tarkov-border rounded px-1 py-1">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} title={m.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                    mode === m.key ? 'bg-tarkov-gold text-tarkov-bg' : 'text-gray-400 hover:text-tarkov-gold'
                  }`}>
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            {/* Sélecteur de langue */}
            <div className="flex items-center gap-1 bg-tarkov-card border border-tarkov-border rounded px-2 py-1">
              <button onClick={() => setLang('en')} title="English"
                className={`text-lg transition-opacity ${lang === 'en' ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}>🇬🇧</button>
              <button onClick={() => setLang('fr')} title="Français"
                className={`text-lg transition-opacity ${lang === 'fr' ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}>🇫🇷</button>
            </div>
            <ApiStatus />
            <ExportButtons items={visibleItems} lang={lang} />
          </div>
        </div>
      </header>

      <main className="px-6 py-4">
        <StatsBar items={visibleItems} />
        <Filters
          filters={filters}
          onChange={setFilters}
          traderFilters={traderFilters}
          onTraderFiltersChange={setTraderFilters}
          intelLevel={intelLevel}
          onIntelLevelChange={setIntelLevel}
        />
        {loading && <p className="text-center py-8 text-gray-400">Chargement des items ({mode})...</p>}
        {error   && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && (
          <ItemTable
            items={visibleItems}
            lang={lang}
            traderFilters={traderFilters}
            intelLevel={intelLevel}
            feeDiscount={feeDiscount}
          />
        )}
      </main>
    </div>
  );
}

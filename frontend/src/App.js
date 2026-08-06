import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters, defaultIntelLevel } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';

const API_BASE = '/api';

const MODES = [
  { key: 'regular',    label: 'PVP',         emoji: '⚔️', headerBg: 'from-[#2a0a0a] to-[#111]', borderColor: 'border-red-900/60',   accentColor: 'text-red-300',   badge: 'Permanent' },
  { key: 'pve',        label: 'PVE',         emoji: '🤖', headerBg: 'from-[#0a2010] to-[#111]', borderColor: 'border-green-900/60', accentColor: 'text-green-300', badge: 'Co-op'     },
  { key: 'pvp-season', label: 'Kord Breach', emoji: '❄️', headerBg: 'from-[#071525] to-[#111]', borderColor: 'border-blue-900/60',  accentColor: 'text-blue-300',  badge: 'Season 1'  },
];

function defaultMinProfitRub() {
  const saved = localStorage.getItem('minProfitRub');
  return saved !== null ? saved : '20000';
}

function defaultPlayerLevel() {
  const saved = localStorage.getItem('playerLevel');
  return saved !== null ? Number(saved) : 15;
}

export default function App() {
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filters, setFilters]             = useState({ minProfitRub: defaultMinProfitRub() });
  const [traderFilters, setTraderFilters] = useState(defaultTraderFilters);
  const [intelLevel, setIntelLevel]       = useState(defaultIntelLevel);
  const [playerLevel, setPlayerLevel]     = useState(defaultPlayerLevel);
  const [lang, setLang]                   = useState(() => localStorage.getItem('lang') || 'fr');
  const [mode, setMode]                   = useState(() => localStorage.getItem('gameMode') || 'regular');

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('gameMode', mode); }, [mode]);

  const handlePlayerLevel = (val) => {
    const n = Math.min(79, Math.max(1, Number(val) || 1));
    localStorage.setItem('playerLevel', String(n));
    setPlayerLevel(n);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/items/`, { params: { mode } });
      setItems(data);
    } catch (err) {
      setError(`Failed to load items: ${err.message}`);
    } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 0.30 };
  const feeDiscount = INTEL_DISCOUNTS[intelLevel] ?? 0;
  const minRub      = parseFloat(filters.minProfitRub) || 0;
  const activeMeta  = MODES.find((m) => m.key === mode) || MODES[0];

  const visibleItems = items.filter((item) => {
    // Filtre niveau joueur : exclure les items nécessitant un niveau flea supérieur
    const minFleaLevel = item.min_level_flea ?? 0;
    if (minFleaLevel > 0 && playerLevel < minFleaLevel) return false;

    try {
      const prices       = JSON.parse(item.trader_prices || '{}');
      const fleaPrice    = item.flea_price ?? item.last_low_price ?? 0;
      const activePrices = Object.entries(prices).filter(([t]) => traderFilters[t]?.enabled).map(([, p]) => p);
      const bestTrader   = activePrices.length > 0 ? Math.max(...activePrices) : 0;
      const ftsProfit    = bestTrader - fleaPrice;
      const btfFee       = item.flea_fee ? item.flea_fee * (1 - feeDiscount) : 0;
      const traderBuy    = item.best_trader_buy_price || 0;
      const btfProfit    = traderBuy > 0 ? (fleaPrice - btfFee - traderBuy) : -Infinity;
      const bestProfit   = Math.max(ftsProfit, btfProfit);
      return minRub > 0 ? bestProfit >= minRub : bestProfit > 0;
    } catch { return true; }
  });

  const pillGroup = 'flex items-center gap-0.5 bg-black/50 border border-white/10 rounded-lg p-0.5';
  const pillBase  = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none';
  const pillOff   = 'text-gray-400 hover:text-white hover:bg-white/5';
  const pillOn    = 'bg-tarkov-gold text-tarkov-bg shadow-sm';

  const LANGS = [
    { code: 'en', flag: '🇬🇧', iso: 'EN' },
    { code: 'fr', flag: '🇫🇷', iso: 'FR' },
  ];

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className={`bg-gradient-to-r ${activeMeta.headerBg} border-b ${activeMeta.borderColor} px-5 py-3`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-tarkov-gold leading-tight">Tarkov Money Maker 2</h1>
            <p className={`text-xs ${activeMeta.accentColor} flex items-center gap-1 mt-0.5`}>
              <span>{activeMeta.emoji}</span>
              <span className="font-semibold">{activeMeta.label}</span>
              <span className="text-gray-600">—</span>
              <span className="text-gray-500">{activeMeta.badge}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={pillGroup}>
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} title={m.badge}
                  className={`${pillBase} ${mode === m.key ? pillOn : pillOff}`}>
                  <span>{m.emoji}</span><span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className={pillGroup}>
              {LANGS.map(({ code, flag, iso }) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`${pillBase} ${lang === code ? pillOn : pillOff}`}>
                  <span className="text-base leading-none">{flag}</span>
                  <span>{iso}</span>
                </button>
              ))}
            </div>
            <div className={pillGroup}>
              <ApiStatus pillBase={pillBase} pillOff={pillOff} />
              <span className="w-px h-4 bg-white/10 mx-0.5" />
              <ExportButtons items={visibleItems} lang={lang} pillBase={pillBase} pillOff={pillOff} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-4">
        <StatsBar items={visibleItems} />
        <Filters
          filters={filters}
          onChange={setFilters}
          traderFilters={traderFilters}
          onTraderFiltersChange={setTraderFilters}
          intelLevel={intelLevel}
          onIntelLevelChange={setIntelLevel}
          playerLevel={playerLevel}
          onPlayerLevelChange={handlePlayerLevel}
        />
        {loading && <p className="text-center py-8 text-gray-400">Chargement <span className={activeMeta.accentColor}>({activeMeta.label})</span>...</p>}
        {error   && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && (
          <ItemTable items={visibleItems} lang={lang} traderFilters={traderFilters} intelLevel={intelLevel} feeDiscount={feeDiscount} />
        )}
      </main>
    </div>
  );
}

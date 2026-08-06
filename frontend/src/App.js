import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters, defaultIntelLevel, defaultMinOffers, ALL_TRADERS } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';

const API_BASE = '/api';

const MODES = [
  { key: 'regular',    label: 'PVP',         icon: '/images/mode-pvp.png',    headerBg: 'from-[#2a0a0a] to-[#111]', borderColor: 'border-red-900/60',   accentColor: 'text-red-300',   badge: 'Permanent' },
  { key: 'pve',        label: 'PVE',         icon: '/images/mode-pve.png',    headerBg: 'from-[#071525] to-[#111]', borderColor: 'border-blue-900/60',  accentColor: 'text-blue-300',  badge: 'Co-op'     },
  { key: 'pvp-season', label: 'Kord Breach', icon: '/images/mode-season.png', headerBg: 'from-[#0a2010] to-[#111]', borderColor: 'border-green-900/60', accentColor: 'text-green-300', badge: 'Season 1'  },
];

const FLAG_GB = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="10" className="flex-shrink-0 rounded-sm">
    <clipPath id="gb-t"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="gb-c"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clipPath="url(#gb-t)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#gb-c)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const FLAG_FR = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" className="flex-shrink-0 rounded-sm">
    <rect width="10" height="20" fill="#002395"/>
    <rect x="10" width="10" height="20" fill="#fff"/>
    <rect x="20" width="10" height="20" fill="#ED2939"/>
  </svg>
);

const LANGS = [
  { code: 'en', flag: FLAG_GB, label: 'EN' },
  { code: 'fr', flag: FLAG_FR, label: 'FR' },
];

export const I18N = {
  en: { searchPlaceholder: 'F-1, grenade, scope...', loading: 'Loading' },
  fr: { searchPlaceholder: 'F-1, grenade, prise...', loading: 'Chargement' },
};

function defaultMinProfitRub() {
  const saved = localStorage.getItem('minProfitRub');
  return saved !== null ? saved : '20000';
}

function defaultPlayerLevel() {
  const saved = localStorage.getItem('playerLevel');
  return saved !== null ? Number(saved) : 15;
}

function getBestBuyPrice(item, traderFilters) {
  try {
    const buyByLevel = JSON.parse(item.trader_buy_prices || '{}');
    let best = null;
    for (const t of ALL_TRADERS) {
      if (!traderFilters[t]?.enabled) continue;
      const levels = buyByLevel[t];
      if (!levels || typeof levels !== 'object') continue;
      const userLevel = traderFilters[t]?.level ?? 1;
      for (let lvl = 1; lvl <= userLevel; lvl++) {
        const p = levels[String(lvl)];
        if (p != null && (best === null || p < best)) best = p;
      }
    }
    return best;
  } catch { return null; }
}

function LoadingSpinner({ label, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-tarkov-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">
        {label} <span className={accentColor}>...</span>
      </p>
    </div>
  );
}

export default function App() {
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filters, setFilters]             = useState({
    minProfitRub: defaultMinProfitRub(),
    search: '',
    minOffers: defaultMinOffers(),
  });
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

  // Disponible pour TOUS les modes de façon dynamique :
  // - true  → au moins 1 item du mode courant a un offer count → slider actif
  // - false → aucun item n'a de offer count pour ce mode → alerte jaune
  // Pendant le chargement on reste sur true pour éviter un flash d'alerte parasite.
  const offerCountAvailable = useMemo(() => {
    if (loading || items.length === 0) return true;
    return items.some((item) => item.last_offer_count != null);
  }, [items, loading]);

  const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 0.30 };
  const feeDiscount  = INTEL_DISCOUNTS[intelLevel] ?? 0;
  const minRub       = parseFloat(filters.minProfitRub) || 0;
  const searchTerm   = (filters.search || '').toLowerCase().trim();
  const minOffers    = offerCountAvailable ? Number(filters.minOffers ?? 1) : 1;
  const activeMeta   = MODES.find((m) => m.key === mode) || MODES[0];
  const t            = I18N[lang] || I18N.fr;

  const visibleItems = items.filter((item) => {
    if (minOffers > 1) {
      const count = item.last_offer_count;
      const hasFleaPresence = (item.flea_price ?? item.last_low_price ?? 0) > 0;
      if (count != null) {
        if (count < minOffers) return false;
      } else if (!hasFleaPresence) {
        return false;
      }
    }

    if (searchTerm) {
      const nameEn  = (item.name_en  || item.name  || '').toLowerCase();
      const nameFr  = (item.name_fr  || '').toLowerCase();
      const shortEn = (item.short_name_en || item.short_name || '').toLowerCase();
      const shortFr = (item.short_name_fr || '').toLowerCase();
      if (!nameEn.includes(searchTerm) && !nameFr.includes(searchTerm)
        && !shortEn.includes(searchTerm) && !shortFr.includes(searchTerm)) return false;
    }

    const minFleaLevel = item.min_level_flea ?? 0;
    if (minFleaLevel > 0 && playerLevel < minFleaLevel) return false;

    try {
      const fleaPrice  = item.flea_price ?? item.last_low_price ?? 0;
      const sellPrices = JSON.parse(item.trader_prices || '{}');
      const activeSell = Object.entries(sellPrices).filter(([tr]) => traderFilters[tr]?.enabled).map(([, p]) => p);
      const bestSell   = activeSell.length > 0 ? Math.max(...activeSell) : 0;
      const ftsProfit  = bestSell - fleaPrice;
      const bestBuy    = getBestBuyPrice(item, traderFilters);
      const btfFee     = item.flea_fee ? item.flea_fee * (1 - feeDiscount) : 0;
      const btfProfit  = bestBuy != null ? (fleaPrice - btfFee - bestBuy) : -Infinity;
      const bestProfit = Math.max(ftsProfit, btfProfit);
      if (searchTerm) return true;
      return minRub > 0 ? bestProfit >= minRub : bestProfit > 0;
    } catch { return true; }
  });

  const pillGroup = 'flex items-center gap-0.5 bg-black/50 border border-white/10 rounded-lg p-0.5';
  const pillBase  = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none';
  const pillOff   = 'text-gray-400 hover:text-white hover:bg-white/5';
  const pillOn    = 'bg-tarkov-gold text-tarkov-bg shadow-sm';

  return (
    <div className="min-h-screen bg-tarkov-bg text-tarkov-text">
      <header className={`bg-gradient-to-r ${activeMeta.headerBg} border-b ${activeMeta.borderColor} px-5 py-3`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <img src={activeMeta.icon} alt={activeMeta.label} className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-tarkov-gold leading-tight">Tarkov Money Maker 2</h1>
              <p className={`text-xs ${activeMeta.accentColor} flex items-center gap-1 mt-0.5`}>
                <span className="font-semibold">{activeMeta.label}</span>
                <span className="text-gray-600">&mdash;</span>
                <span className="text-gray-500">{activeMeta.badge}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={pillGroup}>
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} title={m.badge}
                  className={`${pillBase} ${mode === m.key ? pillOn : pillOff}`}>
                  <img src={m.icon} alt={m.label} className="w-4 h-4 object-contain" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className={pillGroup}>
              {LANGS.map(({ code, flag, label }) => (
                <button key={code} onClick={() => setLang(code)}
                  className={`${pillBase} ${lang === code ? pillOn : pillOff}`}>
                  {flag}
                  <span>{label}</span>
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
          lang={lang}
          gameMode={mode}
          offerCountAvailable={offerCountAvailable}
        />
        {loading && <LoadingSpinner label={t.loading} accentColor={activeMeta.accentColor} />}
        {error   && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && (
          <ItemTable items={visibleItems} lang={lang} traderFilters={traderFilters} intelLevel={intelLevel} feeDiscount={feeDiscount} />
        )}
      </main>
    </div>
  );
}

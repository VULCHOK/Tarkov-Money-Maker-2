import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters, defaultIntelLevel, defaultMinOffers, ALL_TRADERS } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { ApiStatus } from './components/ApiStatus';
import { LangSelector } from './components/LangSelector';
import { KofiButton } from './components/KofiButton';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useT } from './hooks/useT';
import { storage, itemMatchesTag, getItemName, getItemShortName } from './utils/itemHelpers';

export { getItemName, getItemShortName };

const API_BASE = '/api';

const MODES = [
  { key: 'regular',    label: 'PVP',         icon: '/images/mode-pvp.png',    headerBg: 'from-[#2a0a0a] to-[#111]', borderColor: 'border-red-900/60',   accentColor: 'text-red-300',   badgeKey: 'modeBadgePvp'    },
  { key: 'pve',        label: 'PVE',         icon: '/images/mode-pve.png',    headerBg: 'from-[#071525] to-[#111]', borderColor: 'border-blue-900/60',  accentColor: 'text-blue-300',  badgeKey: 'modeBadgePve'    },
  { key: 'pvp-season', label: 'Kord Breach', icon: '/images/mode-season.png', headerBg: 'from-[#0a2010] to-[#111]', borderColor: 'border-green-900/60', accentColor: 'text-green-300', badgeKey: 'modeBadgeSeason' },
];

// Constant outside component — no re-creation on every render
const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 0.30 };

function getBestBuyPrice(item, traderFilters) {
  try {
    const buyByLevel = JSON.parse(item.trader_buy_prices || '{}');
    let best = null;
    for (const tr of ALL_TRADERS) {
      if (!traderFilters[tr]?.enabled) continue;
      const levels = buyByLevel[tr];
      if (!levels || typeof levels !== 'object') continue;
      const userLevel = traderFilters[tr]?.level ?? 1;
      for (let lvl = 1; lvl <= userLevel; lvl++) {
        const p = levels[String(lvl)];
        if (p != null && (best === null || p < best)) best = p;
      }
    }
    return best;
  } catch { return null; }
}

function defaultMinProfitRub() { return storage.get('minProfitRub', '20000'); }
function defaultPlayerLevel()  { return Number(storage.get('playerLevel', '15')); }

export default function App() {
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [filters, setFilters]             = useState({
    minProfitRub: defaultMinProfitRub(),
    minOffers:    defaultMinOffers(),
  });
  const [searchTags, setSearchTags]       = useState([]);
  const [traderFilters, setTraderFilters] = useState(defaultTraderFilters);
  const [intelLevel, setIntelLevel]       = useState(defaultIntelLevel);
  const [playerLevel, setPlayerLevel]     = useState(defaultPlayerLevel);
  const [lang, setLang]                   = useState(() => storage.get('lang', 'fr'));
  const [mode, setMode]                   = useState(() => storage.get('gameMode', 'regular'));

  const t = useT(lang);

  useEffect(() => { storage.set('lang', lang); }, [lang]);
  useEffect(() => { storage.set('gameMode', mode); }, [mode]);

  const handlePlayerLevel = (val) => {
    const n = Math.min(79, Math.max(1, Number(val) || 1));
    storage.set('playerLevel', String(n));
    setPlayerLevel(n);
  };

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); }
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/items/`, { params: { mode } });
      setItems(data);
      setInitialLoaded(true);
    } catch (err) {
      setError(`Failed to load items: ${err.message}`);
    } finally {
      if (!silent) { setLoading(false); }
    }
  }, [mode]);

  useEffect(() => {
    setInitialLoaded(false);
    fetchItems(false);
  }, [fetchItems]);

  // Auto-refresh every 5 min — paused when tab is hidden
  useEffect(() => {
    if (!initialLoaded) return;
    let id = setInterval(() => fetchItems(true), 5 * 60 * 1000);
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(id);
      } else {
        fetchItems(true);
        id = setInterval(() => fetchItems(true), 5 * 60 * 1000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchItems, initialLoaded]);

  const offerCountAvailable = useMemo(() => {
    if (loading || items.length === 0) return true;
    return items.some((item) => item.last_offer_count != null);
  }, [items, loading]);

  const feeDiscount = INTEL_DISCOUNTS[intelLevel] ?? 0;
  const minRub      = parseFloat(filters.minProfitRub) || 0;
  const minOffers   = offerCountAvailable ? Number(filters.minOffers ?? 1) : 1;
  const activeMeta  = MODES.find((m) => m.key === mode) || MODES[0];

  const visibleItems = useMemo(() => items.filter((item) => {
    if (minOffers > 1) {
      const count = item.last_offer_count;
      const hasFleaPresence = (item.flea_price ?? item.last_low_price ?? 0) > 0;
      if (count != null) { if (count < minOffers) return false; }
      else if (!hasFleaPresence) { return false; }
    }
    if (searchTags.length > 0) {
      const matchesAny = searchTags.some((tag) => itemMatchesTag(item, tag, lang));
      if (!matchesAny) return false;
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
      return minRub > 0 ? bestProfit >= minRub : bestProfit > 0;
    } catch { return true; }
  }), [items, minRub, minOffers, searchTags, traderFilters, playerLevel, lang, feeDiscount, offerCountAvailable]);

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
              <h1 className="text-xl font-bold text-tarkov-gold leading-tight">{t('appTitle')}</h1>
              <p className={`text-xs ${activeMeta.accentColor} flex items-center gap-1 mt-0.5`}>
                <span className="font-semibold">{activeMeta.label}</span>
                <span className="text-gray-600">&mdash;</span>
                <span className="text-gray-500">{t(activeMeta.badgeKey)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={pillGroup}>
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} title={t(m.badgeKey)}
                  className={`${pillBase} ${mode === m.key ? pillOn : pillOff}`}>
                  <img src={m.icon} alt={m.label} className="w-4 h-4 object-contain" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-black/50 border border-white/10 rounded-lg p-0.5">
              <LangSelector lang={lang} setLang={setLang} pillBase={pillBase} pillOff={pillOff} pillOn={pillOn} />
            </div>

            <div className={pillGroup}>
              <ApiStatus pillBase={pillBase} pillOff={pillOff} lang={lang} />
              <span className="w-px h-4 bg-white/10 mx-0.5" />
              <ExportButtons items={visibleItems} lang={lang} pillBase={pillBase} pillOff={pillOff} />
              <span className="w-px h-4 bg-white/10 mx-0.5" />
              <KofiButton pillBase={pillBase} pillOff={pillOff} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-4">
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
          searchTags={searchTags}
          onSearchTagsChange={setSearchTags}
          allItems={items}
        />
        {loading && <LoadingSpinner label={t('loading')} accentColor={activeMeta.accentColor} />}
        {error   && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && visibleItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <p className="text-sm">{t('noResults') || 'No items match your filters'}</p>
          </div>
        )}
        {!loading && !error && visibleItems.length > 0 && (
          <ItemTable items={visibleItems} lang={lang} traderFilters={traderFilters} intelLevel={intelLevel} feeDiscount={feeDiscount} />
        )}
      </main>
    </div>
  );
}

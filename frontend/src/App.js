import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { ItemTable } from './components/ItemTable';
import { Filters, defaultTraderFilters, defaultIntelLevel, defaultMinOffers, ALL_TRADERS } from './components/Filters';
import { ExportButtons } from './components/ExportButtons';
import { StatsBar } from './components/StatsBar';
import { ApiStatus } from './components/ApiStatus';
import { useT } from './hooks/useT';

const API_BASE = '/api';

const MODES = [
  { key: 'regular',    label: 'PVP',         icon: '/images/mode-pvp.png',    headerBg: 'from-[#2a0a0a] to-[#111]', borderColor: 'border-red-900/60',   accentColor: 'text-red-300',   badgeKey: 'modeBadgePvp'    },
  { key: 'pve',        label: 'PVE',         icon: '/images/mode-pve.png',    headerBg: 'from-[#071525] to-[#111]', borderColor: 'border-blue-900/60',  accentColor: 'text-blue-300',  badgeKey: 'modeBadgePve'    },
  { key: 'pvp-season', label: 'Kord Breach', icon: '/images/mode-season.png', headerBg: 'from-[#0a2010] to-[#111]', borderColor: 'border-green-900/60', accentColor: 'text-green-300', badgeKey: 'modeBadgeSeason' },
];

// SVG flags — cross-platform (Windows ne supporte pas les emojis drapeaux)
const FlagGB = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="10" style={{flexShrink:0,borderRadius:'2px'}}>
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

const FlagFR = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="10" height="20" fill="#002395"/>
    <rect x="10" width="10" height="20" fill="#fff"/>
    <rect x="20" width="10" height="20" fill="#ED2939"/>
  </svg>
);

const FlagDE = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="7" fill="#000"/>
    <rect y="7" width="30" height="7" fill="#D00"/>
    <rect y="14" width="30" height="6" fill="#FFCE00"/>
  </svg>
);

const FlagRU = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="7" fill="#fff"/>
    <rect y="7" width="30" height="7" fill="#0039A6"/>
    <rect y="14" width="30" height="6" fill="#D52B1E"/>
  </svg>
);

const FlagPL = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="10" fill="#fff"/>
    <rect y="10" width="30" height="10" fill="#DC143C"/>
  </svg>
);

const FlagES = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="20" height="14" style={{flexShrink:0,borderRadius:'2px'}}>
    <rect width="30" height="20" fill="#AA151B"/>
    <rect y="5" width="30" height="10" fill="#F1BF00"/>
  </svg>
);

const LANGS = [
  { code: 'en', Flag: FlagGB, label: 'English' },
  { code: 'fr', Flag: FlagFR, label: 'Français' },
  { code: 'de', Flag: FlagDE, label: 'Deutsch' },
  { code: 'ru', Flag: FlagRU, label: 'Русский' },
  { code: 'pl', Flag: FlagPL, label: 'Polski' },
  { code: 'es', Flag: FlagES, label: 'Español' },
];

/** Bouton Ko-fi discret dans le header */
function KofiButton({ pillBase, pillOff }) {
  return (
    <a
      href="https://ko-fi.com/vulchok"
      target="_blank"
      rel="noopener noreferrer"
      className={`${pillBase} ${pillOff}`}
      title="Support the project on Ko-fi"
      style={{ textDecoration: 'none', gap: '5px' }}
    >
      {/* Ko-fi cup icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ color: '#ff5e5b', flexShrink: 0 }}
      >
        <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em' }}>Ko-fi</span>
    </a>
  );
}

/** Dropdown de sélection de langue */
function LangSelector({ lang, setLang, pillBase, pillOff }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const CurrentFlag = current.Flag;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (code) => { setLang(code); setOpen(false); };

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`${pillBase} ${pillOff}`}
        style={{gap:'6px'}}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Language / Langue"
      >
        <CurrentFlag />
        <span style={{fontWeight:600,fontSize:'11px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
          {current.code}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{opacity:0.5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 150ms'}}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          style={{
            position:'absolute', right:0, marginTop:'4px', zIndex:50,
            background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:'8px', boxShadow:'0 8px 24px rgba(0,0,0,0.6)',
            minWidth:'140px', overflow:'hidden', padding:'4px 0',
          }}
        >
          {LANGS.map(({ code, Flag, label }) => (
            <li key={code} role="option" aria-selected={code === lang}>
              <button
                onClick={() => select(code)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:'10px',
                  padding:'6px 12px', fontSize:'12px', cursor:'pointer', border:'none',
                  background: code === lang ? 'rgba(201,168,84,0.12)' : 'transparent',
                  color: code === lang ? '#c9a854' : '#ccc',
                  fontWeight: code === lang ? 600 : 400,
                  transition:'background 120ms, color 120ms',
                }}
                onMouseEnter={e => { if (code !== lang) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#fff'; }}}
                onMouseLeave={e => { if (code !== lang) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#ccc'; }}}
              >
                <Flag />
                <span>{label}</span>
                {code === lang && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"
                    fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{marginLeft:'auto'}}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function getItemName(item, lang = 'en') {
  try {
    const names = typeof item.names === 'string' ? JSON.parse(item.names) : (item.names || {});
    return names[lang] || names['en'] || item.normalized_name || item.id || '';
  } catch {
    return item.normalized_name || item.id || '';
  }
}

export function getItemShortName(item, lang = 'en') {
  try {
    const shorts = typeof item.short_names === 'string' ? JSON.parse(item.short_names) : (item.short_names || {});
    return shorts[lang] || shorts['en'] || '';
  } catch {
    return '';
  }
}

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

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function itemMatchesTag(item, tag, lang) {
  const q = normalize(tag);
  if (!q) return true;
  const name      = getItemName(item, lang);
  const shortName = getItemShortName(item, lang);
  return [name, shortName].some((f) => normalize(f).includes(q));
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
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [filters, setFilters]             = useState({
    minProfitRub: defaultMinProfitRub(),
    minOffers:    defaultMinOffers(),
  });
  const [searchTags, setSearchTags]       = useState([]);
  const [traderFilters, setTraderFilters] = useState(defaultTraderFilters);
  const [intelLevel, setIntelLevel]       = useState(defaultIntelLevel);
  const [playerLevel, setPlayerLevel]     = useState(defaultPlayerLevel);
  const [lang, setLang]                   = useState(() => localStorage.getItem('lang') || 'fr');
  const [mode, setMode]                   = useState(() => localStorage.getItem('gameMode') || 'regular');

  const t = useT(lang);

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('gameMode', mode); }, [mode]);

  const handlePlayerLevel = (val) => {
    const n = Math.min(79, Math.max(1, Number(val) || 1));
    localStorage.setItem('playerLevel', String(n));
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

  useEffect(() => {
    if (!initialLoaded) return;
    const id = setInterval(() => fetchItems(true), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchItems, initialLoaded]);

  const offerCountAvailable = useMemo(() => {
    if (loading || items.length === 0) return true;
    return items.some((item) => item.last_offer_count != null);
  }, [items, loading]);

  const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 0.30 };
  const feeDiscount  = INTEL_DISCOUNTS[intelLevel] ?? 0;
  const minRub       = parseFloat(filters.minProfitRub) || 0;
  const minOffers    = offerCountAvailable ? Number(filters.minOffers ?? 1) : 1;
  const activeMeta   = MODES.find((m) => m.key === mode) || MODES[0];

  const visibleItems = items.filter((item) => {
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
          searchTags={searchTags}
          onSearchTagsChange={setSearchTags}
          allItems={items}
        />
        {loading && <LoadingSpinner label={t('loading')} accentColor={activeMeta.accentColor} />}
        {error   && <p className="text-center py-8 text-red-400">{error}</p>}
        {!loading && !error && (
          <ItemTable items={visibleItems} lang={lang} traderFilters={traderFilters} intelLevel={intelLevel} feeDiscount={feeDiscount} />
        )}
      </main>
    </div>
  );
}

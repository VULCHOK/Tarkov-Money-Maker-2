import React from 'react';
import { RankBadge, getRankThreshold, RANK_NAMES } from './RankBadge';

export const TRADER_LEVELS = {
  Prapor:      [1, 2, 3, 4],
  Therapist:   [1, 2, 3, 4],
  Skier:       [1, 2, 3, 4],
  Peacekeeper: [1, 2, 3, 4],
  Mechanic:    [1, 2, 3, 4],
  Ragman:      [1, 2, 3, 4],
  Jaeger:      [1, 2, 3, 4],
  Lightkeeper: [1, 2, 3, 4],
};

export const ALL_TRADERS = Object.keys(TRADER_LEVELS);

const GH_RAW = 'https://raw.githubusercontent.com/the-hideout/tarkov-dev/main/public/images/traders';

export const TRADER_META = {
  Prapor:      { img: 'https://assets.tarkov.dev/prapor-portrait.png',      fallback: `${GH_RAW}/prapor-portrait.png` },
  Therapist:   { img: 'https://assets.tarkov.dev/therapist-portrait.png',   fallback: `${GH_RAW}/therapist-portrait.png` },
  Skier:       { img: 'https://assets.tarkov.dev/skier-portrait.png',       fallback: `${GH_RAW}/skier-portrait.png` },
  Peacekeeper: { img: 'https://assets.tarkov.dev/peacekeeper-portrait.png', fallback: `${GH_RAW}/peacekeeper-portrait.png` },
  Mechanic:    { img: 'https://assets.tarkov.dev/mechanic-portrait.png',    fallback: `${GH_RAW}/mechanic-portrait.png` },
  Ragman:      { img: 'https://assets.tarkov.dev/ragman-portrait.png',      fallback: `${GH_RAW}/ragman-portrait.png` },
  Jaeger:      { img: 'https://assets.tarkov.dev/jaeger-portrait.png',      fallback: `${GH_RAW}/jaeger-portrait.png` },
  Lightkeeper: { img: 'https://assets.tarkov.dev/lightkeeper-portrait.png', fallback: `${GH_RAW}/lightkeeper-portrait.png` },
};

export const FLEA_META = {
  img:      'https://assets.tarkov.dev/flea-market-portrait.png',
  fallback: `${GH_RAW}/flea-market-portrait.png`,
};

export function defaultTraderFilters() {
  const saved = localStorage.getItem('traderFilters');
  if (saved) {
    try {
      const { Fence: _f, ...rest } = JSON.parse(saved);
      return rest;
    } catch {}
  }
  return Object.fromEntries(ALL_TRADERS.map((t) => [t, { enabled: true, level: 1 }]));
}

export function defaultIntelLevel() {
  const saved = localStorage.getItem('intelLevel');
  return saved !== null ? Number(saved) : 0;
}

export function defaultMinOffers() {
  const saved = localStorage.getItem('minOffers');
  return saved !== null ? Number(saved) : 20;
}

const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 30 };
const INTEL_OPTIONS = [
  { level: 0, label: 'Non construit', title: 'Non construit' },
  { level: 1, label: 'Niveau 1',      title: 'Niveau 1' },
  { level: 2, label: 'Niveau 2',      title: 'Niveau 2' },
  { level: 3, label: 'Niveau 3 −30%', title: '-30% taxe flea' },
];
const INTEL_IMG = 'https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/2/2c/Banner_hideout.png/revision/latest?cb=20191102201125';
const FLEA_UNLOCK_LEVEL = 15;

const MODE_FILTER_GRADIENT = {
  regular:      'from-[#2a0a0a]/30 to-transparent',
  pve:          'from-[#071525]/30 to-transparent',
  'pvp-season': 'from-[#0a2010]/30 to-transparent',
};
const MODE_FILTER_BORDER = {
  regular:      'border-red-900/40',
  pve:          'border-blue-900/40',
  'pvp-season': 'border-green-900/40',
};

// ── Card Search ──────────────────────────────────────────────────────────────
function SearchCard({ value, onChange, lang }) {
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card overflow-hidden"
      style={{ height: 96 }}>
      <div className="flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="text-gray-500">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1" style={{ width: 120 }}>
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">
          {lang === 'en' ? 'Search' : 'Recherche'}
        </span>
        <div className="relative">
          <input
            type="text"
            placeholder={lang === 'en' ? 'Item name...' : "Nom d'item..."}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-tarkov-gold pr-5"
          />
          {value && (
            <button onClick={() => onChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-tarkov-gold text-[10px]"
            >&#10005;</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card Profit ──────────────────────────────────────────────────────────────
function ProfitCard({ value, onChange, lang }) {
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card overflow-hidden"
      style={{ height: 96 }}>
      <div className="flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <span className="text-tarkov-gold font-bold" style={{ fontSize: 26 }}>&#8381;</span>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1" style={{ width: 120 }}>
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">
          {lang === 'en' ? 'Min. profit' : 'Profit min.'}
        </span>
        <input
          type="number"
          placeholder="20000"
          value={value}
          onChange={(e) => { onChange(e.target.value); localStorage.setItem('minProfitRub', e.target.value); }}
          className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-tarkov-gold"
        />
      </div>
    </div>
  );
}

// ── Card Player Level ─────────────────────────────────────────────────────────
function PlayerLevelCard({ playerLevel, onChange, lang, fleaLocked }) {
  const threshold = getRankThreshold(playerLevel);
  const rankName  = RANK_NAMES[threshold]?.[lang] ?? RANK_NAMES[threshold]?.en ?? '';

  const dec = () => onChange(Math.max(1,  playerLevel - 1));
  const inc = () => onChange(Math.min(79, playerLevel + 1));

  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card overflow-hidden"
      style={{ height: 96 }}>
      <div className="relative flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <RankBadge level={playerLevel} size={52} />
        {fleaLocked && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-900/80 text-[9px] text-red-300 font-bold text-center py-0.5">
            Flea lock
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1" style={{ width: 120 }}>
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">
          {lang === 'en' ? 'Player level' : 'Niveau joueur'}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={dec}
            className="w-6 h-6 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-xs font-bold flex items-center justify-center flex-shrink-0"
          >-</button>
          <input
            type="number" min={1} max={79} value={playerLevel}
            onChange={(e) => onChange(e.target.value)}
            className="bg-tarkov-bg border border-tarkov-border rounded px-1 py-1 text-xs w-12 text-center focus:outline-none focus:border-tarkov-gold"
          />
          <button onClick={inc}
            className="w-6 h-6 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-xs font-bold flex items-center justify-center flex-shrink-0"
          >+</button>
        </div>
        <span className="text-[10px] text-tarkov-gold/70 leading-none truncate">{rankName}</span>
      </div>
    </div>
  );
}

// ── Card Min Offres (slider) ──────────────────────────────────────────────────
function MinOffersCard({ value, onChange, lang }) {
  const isActive = value > 1;
  return (
    <div className={`flex items-stretch rounded-lg border overflow-hidden ${
      isActive ? 'border-tarkov-gold bg-tarkov-card' : 'border-tarkov-border bg-tarkov-card'
    }`} style={{ height: 96 }}>
      <div className="relative flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <img src={FLEA_META.img} alt="Flea" className="w-full h-full object-cover"
          style={{ objectPosition: 'center 30%' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5">
          <span className="text-[9px] font-bold text-tarkov-gold leading-none block text-center">{value} offre{value > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-2" style={{ width: 120 }}>
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">
          {lang === 'en' ? 'Min. offers' : 'Offres min.'}
        </span>
        <input
          type="range" min={1} max={100} step={1} value={value}
          onChange={(e) => { const v = Number(e.target.value); onChange(v); localStorage.setItem('minOffers', String(v)); }}
          className="w-full accent-tarkov-gold cursor-pointer"
          title={`${value} offre${value > 1 ? 's' : ''} minimum`}
        />
        <div className="flex justify-between text-[9px] text-gray-600 leading-none">
          <span>1</span><span>50</span><span>100</span>
        </div>
      </div>
    </div>
  );
}

// ── TraderCard ────────────────────────────────────────────────────────────────
function TraderCard({ trader, tf, onToggle, onLevel }) {
  const meta      = TRADER_META[trader];
  const levels    = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;
  return (
    <div onClick={() => onToggle(trader)}
      className={`relative flex items-stretch rounded-lg border overflow-hidden cursor-pointer select-none transition-all ${
        isEnabled
          ? 'border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40'
          : 'border-tarkov-border bg-tarkov-bg opacity-40 grayscale'
      }`}
      style={{ width: 110, height: 96 }}
      title={`${trader} - ${isEnabled ? 'désactiver' : 'activer'}`}
    >
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={meta.img} alt={trader} className="w-full h-full object-cover"
          style={{ objectPosition: 'center 15%' }}
          onError={(e) => { if (e.target.src !== meta.fallback) e.target.src = meta.fallback; else e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 pt-3 pb-0.5">
          <span className={`text-[10px] font-bold leading-none block truncate ${
            isEnabled ? 'text-tarkov-gold' : 'text-gray-400'
          }`}>{trader}</span>
        </div>
      </div>
      <div className="flex flex-col justify-around items-center px-1 py-1 bg-black/30" style={{ width: 38 }}
        onClick={(e) => e.stopPropagation()}>
        {levels.map((lvl) => {
          const isActive = isEnabled && tf.level === lvl;
          return (
            <button key={lvl}
              onClick={(e) => { e.stopPropagation(); if (!isEnabled) onToggle(trader); onLevel(trader, lvl); }}
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-tarkov-gold text-tarkov-bg'
                  : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{lvl}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── IntelCard (labels complets, scroll mobile) ────────────────────────────────
function IntelCard({ intelLevel, onIntelLevelChange }) {
  const discount = INTEL_DISCOUNTS[intelLevel] ?? 0;
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40 overflow-hidden select-none"
      style={{ height: 96, minWidth: 180 }} title="Intelligence Center">
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={INTEL_IMG} alt="Intel Center" className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 pt-3 pb-0.5">
          <span className="text-[9px] font-bold text-tarkov-gold leading-none block">Intel Center</span>
          {discount > 0 && <span className="text-[9px] text-green-400 font-bold leading-none block">-{discount}% flea</span>}
        </div>
      </div>
      <div className="flex flex-col justify-around px-2 py-1 flex-1">
        {INTEL_OPTIONS.map(({ level, label, title }) => {
          const isActive = intelLevel === level;
          return (
            <button key={level} onClick={() => onIntelLevelChange(level)} title={title}
              className={`w-full px-2 h-5 rounded text-[10px] font-semibold transition-colors text-left ${
                isActive
                  ? 'bg-tarkov-gold text-tarkov-bg'
                  : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Filters principal ──────────────────────────────────────────────────────────
export function Filters({
  filters, onChange,
  traderFilters, onTraderFiltersChange,
  intelLevel, onIntelLevelChange,
  playerLevel, onPlayerLevelChange,
  lang,
  gameMode,
}) {
  const handleTraderToggle = (trader) => {
    const next = { ...traderFilters, [trader]: { ...traderFilters[trader], enabled: !traderFilters[trader].enabled } };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };
  const handleTraderLevel = (trader, level) => {
    const next = { ...traderFilters, [trader]: { ...traderFilters[trader], level: Number(level) } };
    localStorage.setItem('traderFilters', JSON.stringify(next));
    onTraderFiltersChange(next);
  };
  const handleIntelLevel = (level) => {
    localStorage.setItem('intelLevel', String(level));
    onIntelLevelChange(level);
  };

  const fleaLocked  = playerLevel < FLEA_UNLOCK_LEVEL;
  const gradientCls = MODE_FILTER_GRADIENT[gameMode] || MODE_FILTER_GRADIENT['regular'];
  const borderCls   = MODE_FILTER_BORDER[gameMode]   || MODE_FILTER_BORDER['regular'];

  return (
    <div className={`bg-gradient-to-br ${gradientCls} bg-tarkov-card border ${borderCls} rounded-lg px-4 py-3 mb-6`}>

      {/* ── Ligne 1 : 4 cards, wrap sur mobile, justify-between sur desktop ── */}
      <div className="flex flex-wrap justify-between gap-3">
        <SearchCard
          value={filters.search}
          onChange={(v) => onChange({ ...filters, search: v })}
          lang={lang}
        />
        <ProfitCard
          value={filters.minProfitRub}
          onChange={(v) => onChange({ ...filters, minProfitRub: v })}
          lang={lang}
        />
        <PlayerLevelCard
          playerLevel={playerLevel}
          onChange={onPlayerLevelChange}
          lang={lang}
          fleaLocked={fleaLocked}
        />
        <MinOffersCard
          value={filters.minOffers ?? 20}
          onChange={(v) => onChange({ ...filters, minOffers: v })}
          lang={lang}
        />
      </div>

      {/* Séparateur horizontal */}
      <div className="h-px bg-tarkov-border my-2" />

      {/* ── Ligne 2 : Traders scroll horizontal sur mobile, justify-between sur desktop ── */}
      <div className="flex overflow-x-auto md:overflow-x-visible md:flex-wrap md:justify-between gap-2 pb-1">
        {ALL_TRADERS.map((trader) => (
          <TraderCard key={trader} trader={trader}
            tf={traderFilters[trader] || { enabled: true, level: 1 }}
            onToggle={handleTraderToggle} onLevel={handleTraderLevel} />
        ))}
        <IntelCard intelLevel={intelLevel} onIntelLevelChange={handleIntelLevel} />
      </div>

    </div>
  );
}

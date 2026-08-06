import React from 'react';
import { I18N } from '../App';
import { RankBadge, getRankKey, RANK_NAMES } from './RankBadge';

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
  Prapor:      { img: '/images/traders-dynamic/traders/prapor-portrait.png',      fallback: `${GH_RAW}/prapor-portrait.png` },
  Therapist:   { img: '/images/traders-dynamic/traders/therapist-portrait.png',   fallback: `${GH_RAW}/therapist-portrait.png` },
  Skier:       { img: '/images/traders-dynamic/traders/skier-portrait.png',       fallback: `${GH_RAW}/skier-portrait.png` },
  Peacekeeper: { img: '/images/traders-dynamic/traders/peacekeeper-portrait.png', fallback: `${GH_RAW}/peacekeeper-portrait.png` },
  Mechanic:    { img: '/images/traders-dynamic/traders/mechanic-portrait.png',    fallback: `${GH_RAW}/mechanic-portrait.png` },
  Ragman:      { img: '/images/traders-dynamic/traders/ragman-portrait.png',      fallback: `${GH_RAW}/ragman-portrait.png` },
  Jaeger:      { img: '/images/traders-dynamic/traders/jaeger-portrait.png',      fallback: `${GH_RAW}/jaeger-portrait.png` },
  Lightkeeper: { img: '/images/traders-dynamic/traders/lightkeeper-portrait.png', fallback: `${GH_RAW}/lightkeeper-portrait.png` },
};

export const FLEA_META = {
  img:      '/images/traders-dynamic/traders/flea-market-portrait.png',
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

const INTEL_DISCOUNTS = { 0: 0, 1: 0, 2: 0, 3: 30 };
const INTEL_OPTIONS = [
  { level: 0, label: 'x',  title: 'Non construit - pas de reduction' },
  { level: 1, label: 'L1', title: 'Niveau 1 - pas de reduction' },
  { level: 2, label: 'L2', title: 'Niveau 2 - pas de reduction' },
  { level: 3, label: 'L3', title: 'Niveau 3 - -30% taxe flea' },
];
const INTEL_IMG = 'https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/2/2c/Banner_hideout.png/revision/latest?cb=20191102201125';
const FLEA_UNLOCK_LEVEL = 15;

const MODE_FILTER_GRADIENT = {
  regular:      'from-[#2a0a0a]/30 to-transparent',
  pve:          'from-[#0a2010]/30 to-transparent',
  'pvp-season': 'from-[#071525]/30 to-transparent',
};
const MODE_FILTER_BORDER = {
  regular:      'border-red-900/40',
  pve:          'border-green-900/40',
  'pvp-season': 'border-blue-900/40',
};

function PlayerLevelSelector({ playerLevel, onPlayerLevelChange, lang, fleaLocked }) {
  const key      = getRankKey(playerLevel);
  const rankName = RANK_NAMES[key]?.[lang] ?? RANK_NAMES[key]?.en ?? '';

  const decrement = () => onPlayerLevelChange(Math.max(1, playerLevel - 1));
  const increment = () => onPlayerLevelChange(Math.min(79, playerLevel + 1));

  return (
    <div className="flex items-center gap-2">
      <RankBadge level={playerLevel} size={36} />
      <div className="flex flex-col flex-1 sm:flex-none">
        <span className="text-[10px] text-gray-500 leading-none mb-0.5">
          {lang === 'en' ? 'Player level' : 'Niveau joueur'}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={decrement}
            className="w-6 h-7 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-sm font-bold flex items-center justify-center flex-shrink-0"
          >-</button>
          <input
            type="number" min={1} max={79} value={playerLevel}
            onChange={(e) => onPlayerLevelChange(e.target.value)}
            className="bg-tarkov-bg border border-tarkov-border rounded px-1.5 py-1 text-sm w-14 text-center focus:outline-none focus:border-tarkov-gold"
          />
          <button onClick={increment}
            className="w-6 h-7 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-sm font-bold flex items-center justify-center flex-shrink-0"
          >+</button>
          <span className="text-[10px] text-tarkov-gold font-semibold leading-tight whitespace-nowrap hidden sm:block">{rankName}</span>
        </div>
        <span className="text-[10px] text-tarkov-gold font-semibold mt-0.5 block sm:hidden">{rankName}</span>
        {fleaLocked && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-red-900/40 border-red-800/60 text-red-400 mt-0.5 self-start">
            Flea verrouille
          </span>
        )}
      </div>
    </div>
  );
}

function TraderCard({ trader, tf, onToggle, onLevel }) {
  const meta      = TRADER_META[trader];
  const levels    = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;
  return (
    <div onClick={() => onToggle(trader)}
      className={`relative flex items-stretch rounded-lg border overflow-hidden cursor-pointer select-none transition-all ${
        isEnabled ? 'border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40'
                  : 'border-tarkov-border bg-tarkov-bg opacity-40 grayscale'
      }`}
      style={{ width: 110, height: 96 }}
      title={`${trader} - ${isEnabled ? 'desactiver' : 'activer'}`}
    >
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={meta.img} alt={trader} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }}
          onError={(e) => { if (e.target.src !== meta.fallback) e.target.src = meta.fallback; else e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 pt-3 pb-0.5">
          <span className={`text-[10px] font-bold leading-none block truncate ${isEnabled ? 'text-tarkov-gold' : 'text-gray-400'}`}>{trader}</span>
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
                isActive ? 'bg-tarkov-gold text-tarkov-bg'
                         : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{lvl}</button>
          );
        })}
      </div>
    </div>
  );
}

function IntelCard({ intelLevel, onIntelLevelChange }) {
  const discount = INTEL_DISCOUNTS[intelLevel] ?? 0;
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40 overflow-hidden select-none"
      style={{ height: 96 }} title="Intelligence Center">
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={INTEL_IMG} alt="Intel Center" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }}
          onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 pt-3 pb-0.5">
          <span className="text-[9px] font-bold text-tarkov-gold leading-none block">Intel Center</span>
          {discount > 0 && <span className="text-[9px] text-green-400 font-bold leading-none block">-{discount}% flea</span>}
        </div>
      </div>
      <div className="flex flex-col justify-around items-center px-1 py-1 bg-black/30" style={{ width: 38 }}>
        {INTEL_OPTIONS.map(({ level, label, title }) => {
          const isActive = intelLevel === level;
          return (
            <button key={level} onClick={() => onIntelLevelChange(level)} title={title}
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${
                isActive ? 'bg-tarkov-gold text-tarkov-bg'
                         : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{label}</button>
          );
        })}
      </div>
    </div>
  );
}

export function Filters({
  filters, onChange,
  traderFilters, onTraderFiltersChange,
  intelLevel, onIntelLevelChange,
  playerLevel, onPlayerLevelChange,
  lang,
  gameMode,
}) {
  const t = I18N[lang] || I18N.fr;

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 sm:gap-4">

        {/* Recherche */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <div className="flex flex-col flex-1 sm:flex-none">
            <span className="text-[10px] text-gray-500 leading-none mb-0.5">
              {lang === 'en' ? 'Search' : 'Recherche'}
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={filters.search || ''}
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1.5 text-sm w-full sm:w-44 focus:outline-none focus:border-tarkov-gold pr-6"
              />
              {filters.search && (
                <button
                  onClick={() => onChange({ ...filters, search: '' })}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-tarkov-gold text-xs leading-none"
                  title="Effacer"
                >x</button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px self-stretch bg-tarkov-border" />
        <div className="block sm:hidden h-px bg-tarkov-border" />

        {/* Profit minimum */}
        <div className="flex items-center gap-2">
          {/* Icone rouble SVG */}
          <svg className="w-4 h-4 text-tarkov-gold flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <text x="2" y="18" fontSize="18" fontWeight="bold" fontFamily="serif">&#8381;</text>
          </svg>
          <div className="flex flex-col flex-1 sm:flex-none">
            <span className="text-[10px] text-gray-500 leading-none mb-0.5">
              {lang === 'en' ? 'Min. profit' : 'Profit min.'}
            </span>
            <input
              type="number" placeholder="20000" value={filters.minProfitRub}
              onChange={(e) => { const v = e.target.value; onChange({ ...filters, minProfitRub: v }); localStorage.setItem('minProfitRub', v); }}
              className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1.5 text-sm w-full sm:w-28 focus:outline-none focus:border-tarkov-gold"
            />
          </div>
        </div>

        <div className="hidden sm:block w-px self-stretch bg-tarkov-border" />
        <div className="block sm:hidden h-px bg-tarkov-border" />

        {/* Niveau joueur */}
        <PlayerLevelSelector
          playerLevel={playerLevel}
          onPlayerLevelChange={onPlayerLevelChange}
          lang={lang}
          fleaLocked={fleaLocked}
        />
      </div>

      <div className="h-px bg-tarkov-border my-3" />

      <div className="flex flex-wrap justify-center gap-2">
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

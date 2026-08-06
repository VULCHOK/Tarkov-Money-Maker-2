import React from 'react';

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
  { level: 0, label: '✕',  title: 'Non construit — pas de réduction' },
  { level: 1, label: 'L1', title: 'Niveau 1 — pas de réduction' },
  { level: 2, label: 'L2', title: 'Niveau 2 — pas de réduction' },
  { level: 3, label: 'L3', title: 'Niveau 3 — -30% taxe flea' },
];
const INTEL_IMG = 'https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/2/2c/Banner_hideout.png/revision/latest?cb=20191102201125';

// Niveau de déblocage de la Flea Market
const FLEA_UNLOCK_LEVEL = 15;

// ─── TraderCard ───────────────────────────────────────────────────────────────
function TraderCard({ trader, tf, onToggle, onLevel }) {
  const meta      = TRADER_META[trader];
  const levels    = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;
  return (
    <div
      onClick={() => onToggle(trader)}
      className={`relative flex items-stretch rounded-lg border overflow-hidden cursor-pointer select-none transition-all ${
        isEnabled
          ? 'border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40'
          : 'border-tarkov-border bg-tarkov-bg opacity-40 grayscale'
      }`}
      style={{ width: 110, height: 96 }}
      title={`${trader} — ${isEnabled ? 'désactiver' : 'activer'}`}
    >
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={meta.img} alt={trader} className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }}
          onError={(e) => { if (e.target.src !== meta.fallback) e.target.src = meta.fallback; else e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 pt-3 pb-0.5">
          <span className={`text-[10px] font-bold leading-none block truncate ${isEnabled ? 'text-tarkov-gold' : 'text-gray-400'}`}>{trader}</span>
        </div>
      </div>
      <div className="flex flex-col justify-around items-center px-1 py-1 bg-black/30" style={{ width: 38 }} onClick={(e) => e.stopPropagation()}>
        {levels.map((lvl) => {
          const isActive = isEnabled && tf.level === lvl;
          return (
            <button key={lvl}
              onClick={(e) => { e.stopPropagation(); if (!isEnabled) onToggle(trader); onLevel(trader, lvl); }}
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${
                isActive ? 'bg-tarkov-gold text-tarkov-bg' : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{lvl}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── IntelCard ────────────────────────────────────────────────────────────────
function IntelCard({ intelLevel, onIntelLevelChange }) {
  const discount = INTEL_DISCOUNTS[intelLevel] ?? 0;
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40 overflow-hidden select-none" style={{ height: 96 }} title="Intelligence Center">
      <div className="relative flex-shrink-0" style={{ width: 72 }}>
        <img src={INTEL_IMG} alt="Intel Center" className="w-full h-full object-cover" style={{ objectPosition: 'center 40%' }} onError={(e) => { e.target.style.display = 'none'; }} />
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
                isActive ? 'bg-tarkov-gold text-tarkov-bg' : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>{label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────────
export function Filters({
  filters, onChange,
  traderFilters, onTraderFiltersChange,
  intelLevel, onIntelLevelChange,
  playerLevel, onPlayerLevelChange,
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

  const fleaLocked = playerLevel < FLEA_UNLOCK_LEVEL;

  return (
    <div className="bg-tarkov-card border border-tarkov-border rounded-lg px-4 py-3 mb-6">
      <div className="flex flex-wrap items-center gap-4">

        {/* Profit minimum */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-tarkov-gold font-bold text-sm select-none">₽</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none mb-0.5">Profit min.</span>
            <input type="number" placeholder="20000" value={filters.minProfitRub}
              onChange={(e) => { const v = e.target.value; onChange({ ...filters, minProfitRub: v }); localStorage.setItem('minProfitRub', v); }}
              className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-tarkov-gold" />
          </div>
        </div>

        <div className="w-px self-stretch bg-tarkov-border flex-shrink-0" />

        {/* Niveau joueur */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg leading-none select-none" title="Niveau joueur">🎖️</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none mb-0.5">Niveau joueur</span>
            <div className="flex items-center gap-1.5">
              <input type="number" min={1} max={79} value={playerLevel}
                onChange={(e) => onPlayerLevelChange(e.target.value)}
                className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-sm w-16 focus:outline-none focus:border-tarkov-gold" />
              {/* Badge Flea débloquée / bloquée */}
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  fleaLocked
                    ? 'bg-red-900/40 border-red-800/60 text-red-400'
                    : 'bg-green-900/40 border-green-800/60 text-green-400'
                }`}
                title={fleaLocked ? `Flea bloquée — débloquage au niveau ${FLEA_UNLOCK_LEVEL}` : 'Flea débloquée'}
              >
                {fleaLocked ? `Flea ✕` : 'Flea ✓'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-px self-stretch bg-tarkov-border flex-shrink-0" />

        {/* Traders + Intel Center */}
        <div className="flex flex-wrap gap-2 items-start">
          {ALL_TRADERS.map((trader) => (
            <TraderCard key={trader} trader={trader}
              tf={traderFilters[trader] || { enabled: true, level: 1 }}
              onToggle={handleTraderToggle} onLevel={handleTraderLevel} />
          ))}
          <IntelCard intelLevel={intelLevel} onIntelLevelChange={handleIntelLevel} />
        </div>

      </div>
    </div>
  );
}

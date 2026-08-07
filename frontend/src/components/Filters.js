import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RankBadge, getRankThreshold, RANK_NAMES } from './RankBadge';
import { useT } from '../hooks/useT';
import { getItemName, getItemShortName } from '../App';

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
// Les labels sont injectés via t() dans IntelCard, on garde uniquement level + labelKey
const INTEL_OPTIONS = [
  { level: 0, label: 'x',  titleKey: 'intelNotBuilt' },
  { level: 1, label: 'L1', titleKey: 'intelLevel1' },
  { level: 2, label: 'L2', titleKey: 'intelLevel2' },
  { level: 3, label: 'L3', titleKey: 'intelLevel3' },
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

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fuzzyScore(text, query) {
  const t = normalize(text);
  const q = normalize(query);
  if (!q) return 999;
  if (t === q)         return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(q))   return 2;
  return 3;
}

export function SearchCard({ tags, onTagsChange, allItems, lang }) {
  const t = useT(lang);
  const [inputVal, setInputVal]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [open, setOpen]               = useState(false);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buildSuggestions = useCallback((val) => {
    if (!val.trim() || !allItems?.length) { setSuggestions([]); return; }
    const q = normalize(val);
    const seen = new Set();
    const results = [];
    for (const item of allItems) {
      // Nouveau schéma : on cherche dans toutes les langues disponibles via getItemName/getItemShortName
      const LANGS = ['en', 'fr', 'de', 'ru'];
      const candidates = [
        ...LANGS.map((l) => getItemName(item, l)),
        ...LANGS.map((l) => getItemShortName(item, l)),
        item.normalized_name || '',
      ].filter(Boolean);

      for (const name of candidates) {
        const key = normalize(name);
        if (seen.has(key)) continue;
        const score = fuzzyScore(name, val);
        if (score < 999 && key.includes(q)) {
          seen.add(key);
          results.push({ label: name, score });
        }
      }
    }
    results.sort((a, b) => a.score - b.score || a.label.localeCompare(b.label));
    setSuggestions(results.slice(0, 12).map((r) => r.label));
  }, [allItems]);

  const handleInput = (val) => {
    setInputVal(val);
    setHighlighted(-1);
    buildSuggestions(val);
    setOpen(true);
  };

  const addTag = (term) => {
    const tag = term.trim();
    if (!tag) return;
    if (tags.some((tg) => normalize(tg) === normalize(tag))) {
      setInputVal(''); setSuggestions([]); setOpen(false);
      return;
    }
    onTagsChange([...tags, tag]);
    setInputVal(''); setSuggestions([]); setOpen(false); setHighlighted(-1);
    inputRef.current?.focus();
  };

  const removeTag = (idx) => {
    onTagsChange(tags.filter((_, i) => i !== idx));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < suggestions.length) addTag(suggestions[highlighted]);
      else if (inputVal.trim()) addTag(inputVal);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const placeholder = tags.length === 0 ? t('filterSearchPlaceholder') : t('filterSearchAddTerm');
  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card w-full relative" style={{ minHeight: 96 }}>
      <div className="flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1.5 flex-1 min-w-0">
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">
          {t('filterSearchLabel')}
        </span>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputVal}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (inputVal) setOpen(true); }}
            className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-tarkov-gold pr-5"
          />
          {inputVal && (
            <button
              onClick={() => { setInputVal(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-tarkov-gold text-[10px]">
              ✕
            </button>
          )}
          {showDropdown && (
            <ul className="absolute left-0 right-0 top-full mt-0.5 z-50 bg-tarkov-card border border-tarkov-border rounded-lg shadow-xl overflow-y-auto max-h-52">
              {suggestions.map((s, i) => (
                <li key={s}
                  onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    i === highlighted
                      ? 'bg-tarkov-gold/20 text-tarkov-gold'
                      : 'text-gray-200 hover:bg-tarkov-border'
                  }`}>
                  <span className="truncate">{s}</span>
                  <span className="text-[9px] text-gray-600 flex-shrink-0">{t('filterSearchAdd')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i}
                className="inline-flex items-center gap-1 bg-tarkov-gold/20 border border-tarkov-gold/40 text-tarkov-gold text-[11px] font-semibold rounded-full px-2 py-0.5 leading-none">
                {tag}
                <button
                  onClick={() => removeTag(i)}
                  className="ml-0.5 text-tarkov-gold/60 hover:text-tarkov-gold transition-colors leading-none text-[10px]"
                  aria-label={`Supprimer ${tag}`}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfitCard({ value, onChange, lang }) {
  const t = useT(lang);
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card overflow-hidden w-full" style={{ height: 96 }}>
      <div className="flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <span className="text-tarkov-gold font-bold" style={{ fontSize: 26 }}>&#8381;</span>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1 flex-1 min-w-0">
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">{t('filterProfitLabel')}</span>
        <input type="number" placeholder="20000" value={value}
          onChange={(e) => { onChange(e.target.value); localStorage.setItem('minProfitRub', e.target.value); }}
          className="bg-tarkov-bg border border-tarkov-border rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-tarkov-gold" />
      </div>
    </div>
  );
}

function PlayerLevelCard({ playerLevel, onChange, lang, fleaLocked }) {
  const t = useT(lang);
  const threshold = getRankThreshold(playerLevel);
  const rankName  = RANK_NAMES[threshold]?.[lang] ?? RANK_NAMES[threshold]?.en ?? '';
  const dec = () => onChange(Math.max(1,  playerLevel - 1));
  const inc = () => onChange(Math.min(79, playerLevel + 1));
  return (
    <div className="flex items-stretch rounded-lg border border-tarkov-border bg-tarkov-card overflow-hidden w-full" style={{ height: 96 }}>
      <div className="relative flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <RankBadge level={playerLevel} size={52} />
        {fleaLocked && <div className="absolute bottom-0 left-0 right-0 bg-red-900/80 text-[9px] text-red-300 font-bold text-center py-0.5">Flea lock</div>}
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-1 flex-1 min-w-0">
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">{t('filterLevelLabel')}</span>
        <div className="flex items-center gap-1">
          <button onClick={dec} className="w-6 h-6 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-xs font-bold flex items-center justify-center flex-shrink-0">-</button>
          <input type="number" min={1} max={79} value={playerLevel} onChange={(e) => onChange(e.target.value)}
            className="bg-tarkov-bg border border-tarkov-border rounded px-1 py-1 text-xs w-12 text-center focus:outline-none focus:border-tarkov-gold" />
          <button onClick={inc} className="w-6 h-6 rounded border border-tarkov-border bg-tarkov-bg text-gray-400 hover:text-tarkov-gold hover:border-tarkov-gold transition-colors text-xs font-bold flex items-center justify-center flex-shrink-0">+</button>
        </div>
        <span className="text-[10px] text-tarkov-gold/70 leading-none truncate">{rankName}</span>
      </div>
    </div>
  );
}

function MinOffersCard({ value, onChange, lang, offerCountAvailable }) {
  const t = useT(lang);
  if (!offerCountAvailable) {
    return (
      <div className="flex items-stretch rounded-lg border border-yellow-700/60 bg-tarkov-card overflow-hidden w-full" style={{ height: 96 }}>
        <div className="relative flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
          <img src={FLEA_META.img} alt="Flea" className="w-full h-full object-cover opacity-30" style={{ objectPosition: 'center 30%' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-yellow-500 text-2xl font-bold">!</span>
          </div>
        </div>
        <div className="flex flex-col justify-center px-2 py-2 gap-1 flex-1 min-w-0">
          <span className="text-[10px] text-yellow-500 font-semibold uppercase tracking-wide leading-none">{t('filterOffersLabel')}</span>
          <span className="text-[9px] text-yellow-600 leading-snug">{t('filterOffersDisabled')}</span>
        </div>
      </div>
    );
  }
  const isActive = value > 1;
  return (
    <div className={`flex items-stretch rounded-lg border overflow-hidden w-full ${isActive ? 'border-tarkov-gold bg-tarkov-card' : 'border-tarkov-border bg-tarkov-card'}`} style={{ height: 96 }}>
      <div className="relative flex items-center justify-center bg-tarkov-bg flex-shrink-0" style={{ width: 72 }}>
        <img src={FLEA_META.img} alt="Flea" className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5">
          <span className="text-[9px] font-bold text-tarkov-gold leading-none block text-center">{value} {t('cardOffers')}</span>
        </div>
      </div>
      <div className="flex flex-col justify-center px-2 py-2 gap-2 flex-1 min-w-0">
        <span className="text-[10px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none">{t('filterOffersLabel')}</span>
        <input type="range" min={1} max={100} step={1} value={value}
          onChange={(e) => { const v = Number(e.target.value); onChange(v); localStorage.setItem('minOffers', String(v)); }}
          className="w-full accent-tarkov-gold cursor-pointer" />
        <div className="flex justify-between text-[9px] text-gray-600 leading-none"><span>1</span><span>50</span><span>100</span></div>
      </div>
    </div>
  );
}

function TraderCard({ trader, tf, onToggle, onLevel, lang }) {
  const t = useT(lang);
  const meta      = TRADER_META[trader];
  const levels    = TRADER_LEVELS[trader];
  const isEnabled = tf.enabled;
  return (
    <div onClick={() => onToggle(trader)}
      className={`relative flex items-stretch rounded-lg border overflow-hidden cursor-pointer select-none transition-all ${isEnabled ? 'border-tarkov-gold bg-tarkov-card shadow-md shadow-black/40' : 'border-tarkov-border bg-tarkov-bg opacity-40 grayscale'}`}
      style={{ width: 110, height: 96 }}
      title={`${trader} — ${isEnabled ? t('traderDisable') : t('traderEnable')}`}>
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
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${isActive ? 'bg-tarkov-gold text-tarkov-bg' : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'}`}>
              {lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntelCard({ intelLevel, onIntelLevelChange, lang }) {
  const t = useT(lang);
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
        {INTEL_OPTIONS.map(({ level, label, titleKey }) => {
          const isActive = intelLevel === level;
          return (
            <button key={level}
              onClick={() => onIntelLevelChange(level)}
              title={t(titleKey)}
              className={`w-7 h-5 rounded text-xs font-bold transition-colors ${isActive ? 'bg-tarkov-gold text-tarkov-bg' : 'bg-tarkov-bg border border-tarkov-border text-gray-500 hover:border-tarkov-gold hover:text-tarkov-gold'}`}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Filters({ filters, onChange, traderFilters, onTraderFiltersChange, intelLevel, onIntelLevelChange, playerLevel, onPlayerLevelChange, lang, gameMode, offerCountAvailable, searchTags, onSearchTagsChange, allItems }) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
        <SearchCard tags={searchTags} onTagsChange={onSearchTagsChange} allItems={allItems} lang={lang} />
        <ProfitCard value={filters.minProfitRub} onChange={(v) => onChange({ ...filters, minProfitRub: v })} lang={lang} />
        <PlayerLevelCard playerLevel={playerLevel} onChange={onPlayerLevelChange} lang={lang} fleaLocked={fleaLocked} />
        <MinOffersCard value={filters.minOffers ?? 20} onChange={(v) => onChange({ ...filters, minOffers: v })} lang={lang} offerCountAvailable={offerCountAvailable} />
      </div>
      <div className="h-px bg-tarkov-border my-2" />
      <div className="flex flex-wrap justify-center gap-2">
        {ALL_TRADERS.map((trader) => (
          <TraderCard key={trader} trader={trader} tf={traderFilters[trader] || { enabled: true, level: 1 }} onToggle={handleTraderToggle} onLevel={handleTraderLevel} lang={lang} />
        ))}
        <IntelCard intelLevel={intelLevel} onIntelLevelChange={handleIntelLevel} lang={lang} />
      </div>
    </div>
  );
}

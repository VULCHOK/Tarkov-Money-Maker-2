import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ALL_TRADERS } from './Filters';
import { ActionCell } from './ActionCell';
import { PriceChart } from './PriceChart';
import { HistoryExpandRow, ExpandArrow } from './HistoryCharts';
import { useT } from '../hooks/useT';
import { getItemName } from '../App';

const col = createColumnHelper();
const RUB = '\u20BD';
const fmt = (n) => n != null ? `${n.toLocaleString('fr-FR')} ${RUB}` : '\u2014';
const fmtK = (n) => {
  if (n == null) return '\u2014';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${RUB}`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k ${RUB}`;
  return `${n} ${RUB}`;
};
const HOT_DEAL_THRESHOLD = 100_000;

const TRADER_META = {
  Prapor:      { img: 'https://assets.tarkov.dev/prapor-portrait.png' },
  Therapist:   { img: 'https://assets.tarkov.dev/therapist-portrait.png' },
  Skier:       { img: 'https://assets.tarkov.dev/skier-portrait.png' },
  Peacekeeper: { img: 'https://assets.tarkov.dev/peacekeeper-portrait.png' },
  Mechanic:    { img: 'https://assets.tarkov.dev/mechanic-portrait.png' },
  Ragman:      { img: 'https://assets.tarkov.dev/ragman-portrait.png' },
  Jaeger:      { img: 'https://assets.tarkov.dev/jaeger-portrait.png' },
  Fence:       { img: 'https://assets.tarkov.dev/fence-portrait.png' },
  Lightkeeper: { img: 'https://assets.tarkov.dev/lightkeeper-portrait.png' },
};

const PAGE_SIZES = [10, 25, 50];

/* ── Portal helper ── */
function Portal({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

function useSmartTooltip(open, tooltipWidth = 208) {
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ openUp: false, openLeft: false });
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      openUp:   window.innerHeight - rect.bottom < 320,
      openLeft: window.innerWidth  - rect.right  < tooltipWidth + 8,
    });
  }, [open, tooltipWidth]);
  return { triggerRef, pos };
}

function tooltipCls(pos, extra = '') {
  const v = pos.openUp   ? 'bottom-full mb-1' : 'top-full mt-1';
  const h = pos.openLeft ? 'right-0'          : 'left-0';
  return `absolute z-50 ${v} ${h} ${extra} bg-tarkov-card border border-tarkov-border rounded shadow-xl py-1 pointer-events-auto`;
}

/* ── CopyBurst via portal ── */
function CopyBurst({ label, anchorRef }) {
  const [style, setStyle] = useState(null);
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setStyle({
      position: 'fixed',
      top:  rect.top  + rect.height / 2,
      left: rect.right + 8,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      zIndex: 9999,
    });
  }, [anchorRef]);
  if (!style) return null;
  return (
    <Portal>
      <span style={style}>
        <style>{`
          @keyframes copyBurst {
            0%   { opacity:0; transform:translateY(0) translateX(-6px) scale(0.75); }
            18%  { opacity:1; transform:translateY(-10px) translateX(0) scale(1.14); }
            38%  { opacity:1; transform:translateY(-14px) translateX(0) scale(0.96); }
            62%  { opacity:1; transform:translateY(-18px) translateX(2px) scale(1.02); }
            100% { opacity:0; transform:translateY(-28px) translateX(6px) scale(0.9); }
          }
          @keyframes copyGlow {
            0%   { opacity:0; box-shadow:0 0 0 0 rgba(74,222,128,0.0); }
            30%  { opacity:1; box-shadow:0 0 0 8px rgba(74,222,128,0.16); }
            100% { opacity:0; box-shadow:0 0 0 18px rgba(74,222,128,0.0); }
          }
        `}</style>
        <span className="relative inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/15 px-2 py-1 shadow-lg animate-[copyBurst_900ms_ease-out_forwards]">
          <span className="absolute inset-0 rounded-full animate-[copyGlow_900ms_ease-out_forwards]" />
          <span className="relative text-[10px] font-extrabold uppercase tracking-[0.18em] text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,0.35)]">
            + {label}
          </span>
        </span>
      </span>
    </Portal>
  );
}

/* ── Copy-name button ── */
function CopyNameButton({ name, toastLabel, mobile = false }) {
  const [copied, setCopied] = useState(false);
  const timerRef  = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const showCopiedState = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1200);
  }, []);
  const fallbackCopy = useCallback(() => {
    const el = document.createElement('textarea');
    el.value = name;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  }, [name]);
  const handleCopy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name) return;
    let success = false;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(name);
        success = true;
      } else {
        success = fallbackCopy();
      }
    } catch { success = fallbackCopy(); }
    if (success) showCopiedState();
  }, [name, fallbackCopy, showCopiedState]);
  return (
    <span className={`relative inline-flex ${mobile ? 'self-start' : 'items-center justify-center'}`}>
      <style>{`
        @keyframes copyButtonPop {
          0%   { transform:scale(1); }
          35%  { transform:scale(1.18); }
          60%  { transform:scale(0.92); }
          100% { transform:scale(1); }
        }
      `}</style>
      <button
        ref={buttonRef}
        onClick={handleCopy}
        title={copied ? toastLabel : 'Copy name'}
        aria-label={copied ? toastLabel : 'Copy name'}
        className={`relative flex-shrink-0 rounded transition-all duration-200 ${
          mobile ? 'p-1.5' : 'p-1'
        } ${
          copied
            ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.45)]'
            : 'text-gray-500 hover:text-tarkov-gold hover:scale-110'
        }`}
        style={{ lineHeight: 1, animation: copied ? 'copyButtonPop 420ms ease-out' : 'none' }}
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {copied && <CopyBurst label={toastLabel} anchorRef={buttonRef} />}
    </span>
  );
}

function TraderPricesTooltip({ pricesJson, highlight, label }) {
  const [open, setOpen] = useState(false);
  const { triggerRef, pos } = useSmartTooltip(open, 208);
  let prices = {};
  try { prices = JSON.parse(pricesJson || '{}'); } catch {}
  const entries = ALL_TRADERS
    .map((t) => ({ trader: t, price: prices[t] }))
    .filter((e) => e.price != null)
    .sort((a, b) => b.price - a.price);
  if (entries.length === 0) return <span className="text-gray-600 text-xs">\u2014</span>;
  const best = entries[0];
  const bestEntry = highlight ? entries.find((e) => e.trader === highlight) || best : best;
  return (
    <div className="relative inline-block" ref={triggerRef}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="flex items-center gap-1.5 cursor-default group">
        {TRADER_META[bestEntry.trader]?.img && (
          <img src={TRADER_META[bestEntry.trader].img} alt={bestEntry.trader}
            className="w-5 h-5 rounded-full object-cover border border-tarkov-border flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <span className="flex flex-col leading-tight">
          <span className="text-tarkov-gold text-xs font-semibold">{bestEntry.trader}</span>
          <span className="text-white text-xs">{fmt(bestEntry.price)}</span>
        </span>
        <span className="text-gray-600 text-xs ml-0.5 group-hover:text-gray-400">\u25bc</span>
      </span>
      {open && (
        <div className={tooltipCls(pos, 'w-52')}>
          <p className="text-xs text-gray-500 px-3 pt-1 pb-1.5 border-b border-tarkov-border">{label}</p>
          {entries.map(({ trader, price }) => (
            <div key={trader} className={`flex items-center justify-between px-3 py-1 text-xs ${
              trader === bestEntry.trader ? 'bg-tarkov-border' : ''
            }`}>
              <span className="flex items-center gap-1.5">
                <img src={TRADER_META[trader]?.img} alt={trader}
                  className="w-4 h-4 rounded-full object-cover border border-tarkov-border"
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <span className={trader === bestEntry.trader ? 'text-tarkov-gold font-semibold' : 'text-gray-300'}>{trader}</span>
              </span>
              <span className={trader === bestEntry.trader ? 'text-tarkov-gold font-semibold' : 'text-gray-400'}>{fmt(price)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraderBuyPricesTooltip({ pricesJson, highlight, label, traderFilters }) {
  const [open, setOpen] = useState(false);
  const { triggerRef, pos } = useSmartTooltip(open, 256);
  let pricesByLevel = {};
  try { pricesByLevel = JSON.parse(pricesJson || '{}'); } catch {}
  const entries = ALL_TRADERS.map((trader) => {
    const levels = pricesByLevel[trader];
    if (!levels || typeof levels !== 'object') return null;
    const userLevel = traderFilters?.[trader]?.level ?? 1;
    let bestPrice = null, accessibleLevel = null;
    for (let lvl = 1; lvl <= userLevel; lvl++) {
      const p = levels[String(lvl)];
      if (p != null && (bestPrice === null || p < bestPrice)) { bestPrice = p; accessibleLevel = lvl; }
    }
    if (bestPrice === null) return null;
    return { trader, price: bestPrice, accessibleLevel, userLevel, levels };
  }).filter(Boolean).sort((a, b) => a.price - b.price);
  if (entries.length === 0) return <span className="text-gray-600 text-xs">\u2014</span>;
  const bestEntry = highlight ? entries.find((e) => e.trader === highlight) || entries[0] : entries[0];
  return (
    <div className="relative inline-block" ref={triggerRef}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="flex items-center gap-1.5 cursor-default group">
        {TRADER_META[bestEntry.trader]?.img && (
          <img src={TRADER_META[bestEntry.trader].img} alt={bestEntry.trader}
            className="w-5 h-5 rounded-full object-cover border border-tarkov-border flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <span className="flex flex-col leading-tight">
          <span className="text-tarkov-gold text-xs font-semibold">{bestEntry.trader}</span>
          <span className="text-white text-xs">{fmt(bestEntry.price)}</span>
        </span>
        <span className="text-gray-600 text-xs ml-0.5 group-hover:text-gray-400">\u25bc</span>
      </span>
      {open && (
        <div className={tooltipCls(pos, 'w-64')}>
          <p className="text-xs text-gray-500 px-3 pt-1 pb-1.5 border-b border-tarkov-border">{label}</p>
          {entries.map(({ trader, price, accessibleLevel, userLevel, levels }) => {
            const lockedLevels = Object.keys(levels).map(Number).filter((lvl) => lvl > userLevel);
            return (
              <div key={trader} className={`px-3 py-1.5 text-xs ${
                trader === bestEntry.trader ? 'bg-tarkov-border' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <img src={TRADER_META[trader]?.img} alt={trader}
                      className="w-4 h-4 rounded-full object-cover border border-tarkov-border"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                    <span className={trader === bestEntry.trader ? 'text-tarkov-gold font-semibold' : 'text-gray-300'}>{trader}</span>
                    <span className="text-gray-500 text-[10px]">LL{accessibleLevel}</span>
                  </span>
                  <span className={trader === bestEntry.trader ? 'text-tarkov-gold font-semibold' : 'text-gray-400'}>{fmt(price)}</span>
                </div>
                {lockedLevels.length > 0 && (
                  <div className="text-gray-600 text-[10px] mt-0.5 pl-5">
                    {lockedLevels.map((lvl) => (
                      <span key={lvl} className="mr-2">\uD83D\uDD12 LL{lvl}: {fmt(levels[String(lvl)])}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FleaPriceTooltip({ item, t }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const { triggerRef, pos } = useSmartTooltip(open, 232);
  const { flea_price, last_low_price, low24h_price, avg24h_price, high24h_price, last_offer_count } = item;
  const current = flea_price ?? last_low_price ?? null;
  if (current == null) return <span className="text-gray-600 text-xs">\u2014</span>;
  const handleMouseEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const handleMouseLeave = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };
  return (
    <div className="relative inline-block" ref={triggerRef}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <span className="flex flex-col leading-tight cursor-default">
        <span className="text-blue-300 text-xs font-semibold">{fmt(current)}</span>
        {avg24h_price != null && <span className="text-gray-500 text-xs">\u00f8 {fmt(avg24h_price)}</span>}
      </span>
      {open && (
        <div
          className={tooltipCls(pos, 'w-56 px-3 pb-2')}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p className="text-xs text-tarkov-gold font-semibold mb-2 border-b border-tarkov-border pb-1.5 pt-1">{t('flea24h')}</p>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">{t('fleaCur')}</span><span className="text-blue-300 font-semibold">{fmt(current)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('fleaLow')}</span><span className="text-green-400">{fmt(low24h_price)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('fleaAvg')}</span><span className="text-gray-200">{fmt(avg24h_price)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('fleaHigh')}</span><span className="text-red-400">{fmt(high24h_price)}</span></div>
            {last_offer_count != null && (
              <div className="flex justify-between border-t border-tarkov-border mt-1 pt-1">
                <span className="text-gray-500">{t('fleaOffers')}</span>
                <span className="text-gray-400">{last_offer_count}</span>
              </div>
            )}
          </div>
          <PriceChart item={item} t={t} />
        </div>
      )}
    </div>
  );
}

function ProfitCell({ value, pct, isBest }) {
  if (value == null) return <span className="text-gray-600 text-xs">\u2014</span>;
  const color = value > 0 ? 'text-green-400' : 'text-red-400';
  const fire  = isBest && value >= HOT_DEAL_THRESHOLD ? ' \uD83D\uDD25' : '';
  const bold  = isBest ? 'font-bold text-sm' : 'text-xs';
  return (
    <span className="flex flex-col leading-tight">
      <span className={`${color} ${bold}`}>{value > 0 ? '+' : ''}{value.toLocaleString('fr-FR')} {RUB}{fire}</span>
      {pct != null && <span className="text-gray-500 text-xs">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
    </span>
  );
}

function computeRow(item, traderFilters, feeDiscount) {
  const flea = item.flea_price ?? item.last_low_price ?? null;
  let bestSellTrader = null, bestSellPrice = null;
  try {
    const sell = JSON.parse(item.trader_prices || '{}');
    for (const tr of ALL_TRADERS) {
      if (!traderFilters[tr]?.enabled) continue;
      const p = sell[tr];
      if (p != null && (bestSellPrice === null || p > bestSellPrice)) { bestSellPrice = p; bestSellTrader = tr; }
    }
  } catch {}
  let bestBuyTrader = null, bestBuyPrice = null;
  try {
    const buyByLevel = JSON.parse(item.trader_buy_prices || '{}');
    for (const tr of ALL_TRADERS) {
      if (!traderFilters[tr]?.enabled) continue;
      const levels = buyByLevel[tr];
      if (!levels || typeof levels !== 'object') continue;
      const userLevel = traderFilters[tr]?.level ?? 1;
      for (let lvl = 1; lvl <= userLevel; lvl++) {
        const p = levels[String(lvl)];
        if (p != null && (bestBuyPrice === null || p < bestBuyPrice)) { bestBuyPrice = p; bestBuyTrader = tr; }
      }
    }
  } catch {}
  let profitFTS = null, pctFTS = null;
  if (flea != null && bestSellPrice != null) { profitFTS = bestSellPrice - flea; pctFTS = flea > 0 ? (profitFTS / flea) * 100 : null; }
  let profitBTF = null, pctBTF = null;
  if (flea != null && bestBuyPrice != null) {
    const fee = Math.round((item.flea_fee ?? 0) * (1 - (feeDiscount ?? 0)));
    profitBTF = flea - fee - bestBuyPrice;
    pctBTF = bestBuyPrice > 0 ? (profitBTF / bestBuyPrice) * 100 : null;
  }
  let bestProfit = null, bestPct = null, bestRec = null;
  const ftsOk = profitFTS != null && profitFTS > 0;
  const btfOk = profitBTF != null && profitBTF > 0;
  if (ftsOk && (!btfOk || profitFTS >= profitBTF)) { bestProfit = profitFTS; bestPct = pctFTS; bestRec = 'BUY_FLEA_SELL_TRADER'; }
  else if (btfOk) { bestProfit = profitBTF; bestPct = pctBTF; bestRec = 'BUY_TRADER_SELL_FLEA'; }
  const bestActionTrader = bestRec === 'BUY_FLEA_SELL_TRADER' ? bestSellTrader : bestBuyTrader;
  return { flea, bestSellTrader, bestSellPrice, bestBuyTrader, bestBuyPrice, profitFTS, pctFTS, profitBTF, pctBTF, bestProfit, bestPct, bestRec, bestActionTrader };
}

function wikiUrl(item) {
  if (item.wiki_link) return item.wiki_link;
  const nameEn = getItemName(item, 'en');
  const slug = nameEn.trim().replace(/\s+/g, '_');
  if (!slug) return null;
  return `https://escapefromtarkov.fandom.com/wiki/${encodeURIComponent(slug)}`;
}

const MOBILE_SORTS = [
  { id: 'best_profit', labelKey: 'colBestProfit', desc: true  },
  { id: 'profit_btf', labelKey: 'colTraderFlea',  desc: true  },
  { id: 'profit_fts', labelKey: 'colFleaTrader',  desc: true  },
  { id: 'flea_price', labelKey: 'colFlea',         desc: false },
  { id: 'buy_trader', labelKey: 'cardBuy',         desc: false },
];

function MobileSortBar({ sorting, onSort, t, total, from, to }) {
  return (
    <div className="sticky top-0 z-20 bg-tarkov-bg border-b border-tarkov-border px-3 py-2 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{from}\u2013{to} {t('paginationOf')} <span className="text-tarkov-gold font-semibold">{total}</span></span>
        <span className="text-gray-600">{t('paginationTapSort')}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {MOBILE_SORTS.map(({ id, labelKey, desc }) => {
          const active = sorting?.[0]?.id === id;
          const isDesc = active ? (sorting[0].desc ?? desc) : desc;
          return (
            <button key={id}
              onClick={() => onSort(id, active ? !isDesc : desc)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                active
                  ? 'bg-tarkov-gold text-tarkov-bg border-tarkov-gold'
                  : 'border-tarkov-border text-gray-400 hover:border-tarkov-gold hover:text-tarkov-gold'
              }`}>
              {t(labelKey)}
              {active && <span className="text-[10px]">{isDesc ? '\u2193' : '\u2191'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemCard({ row, lang, t }) {
  const { _c: c } = row;
  const name  = getItemName(row, lang);
  const isHot = c.bestProfit != null && c.bestProfit >= HOT_DEAL_THRESHOLD;
  const isBTF = c.bestRec === 'BUY_TRADER_SELL_FLEA';
  const url   = wikiUrl(row);

  const cardBorder  = isBTF ? 'border-blue-700/40'  : 'border-green-700/40';
  const cardBg      = isBTF ? 'bg-blue-900/10'       : 'bg-green-900/10';
  const accentColor = isBTF ? 'text-blue-300'        : 'text-green-300';
  const recLabel    = isBTF ? t('recBTF') : t('recFTS');
  const topLabel    = isBTF ? (c.bestBuyTrader ?? 'Trader') : 'Flea';
  const topProfit   = c.bestProfit;
  const topPct      = c.bestPct;
  const topOfferCount = !isBTF ? row.last_offer_count : null;

  return (
    <div className={`rounded-xl border ${cardBorder} ${cardBg} overflow-hidden`}>
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
        {row.icon_link
          ? <img src={row.icon_link} alt="" className="w-11 h-11 rounded-lg object-contain bg-tarkov-bg border border-tarkov-border flex-shrink-0 mt-0.5" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
          : <span className="w-11 h-11 rounded-lg bg-tarkov-bg border border-tarkov-border flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">?</span>
        }
        <div className="flex-1 min-w-0">
          {url
            ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm leading-snug text-tarkov-text hover:text-tarkov-gold hover:underline line-clamp-2 block">{name || row.id}</a>
            : <p className="font-semibold text-sm leading-snug text-tarkov-text line-clamp-2">{name || row.id}</p>
          }
          <CopyNameButton name={name || row.id} toastLabel={t('copyToast')} mobile />
        </div>
        <div className="flex-shrink-0 flex flex-col items-end min-w-[64px]">
          <span className="text-[9px] text-tarkov-gold font-semibold uppercase tracking-wide leading-none mb-0.5">{topLabel}</span>
          {topProfit != null && (
            <span className="text-sm font-extrabold leading-none text-tarkov-gold">
              {topProfit > 0 ? '+' : ''}{fmtK(topProfit)}{isHot ? '\uD83D\uDD25' : ''}
            </span>
          )}
          {topPct != null && (
            <span className="text-[10px] font-semibold mt-0.5 text-tarkov-gold opacity-80">
              {topPct > 0 ? '+' : ''}{topPct.toFixed(1)}%
            </span>
          )}
          {topOfferCount != null && (
            <span className="text-[9px] text-tarkov-gold/60 mt-0.5 leading-none">
              {topOfferCount} {t('cardOffers')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
        <div className="bg-tarkov-bg/60 rounded-lg px-2 py-2 flex flex-col justify-between min-h-[56px]">
          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide leading-none mb-1">{t('cardBuy')}</p>
          <p className="text-white text-xs font-bold leading-none">{fmtK(c.bestBuyPrice)}</p>
          {c.bestBuyTrader
            ? <div className="flex items-center gap-1 mt-1"><img src={TRADER_META[c.bestBuyTrader]?.img} alt={c.bestBuyTrader} className="w-3.5 h-3.5 rounded-full object-cover border border-tarkov-border flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} /><span className="text-tarkov-gold text-[9px] truncate">{c.bestBuyTrader}</span></div>
            : <div className="mt-1 h-3.5" />
          }
        </div>
        <div className="bg-tarkov-bg/60 rounded-lg px-2 py-2 flex flex-col justify-between min-h-[56px]">
          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide leading-none mb-1">{t('cardSell')}</p>
          <p className="text-white text-xs font-bold leading-none">{fmtK(c.bestSellPrice)}</p>
          {c.bestSellTrader
            ? <div className="flex items-center gap-1 mt-1"><img src={TRADER_META[c.bestSellTrader]?.img} alt={c.bestSellTrader} className="w-3.5 h-3.5 rounded-full object-cover border border-tarkov-border flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} /><span className="text-tarkov-gold text-[9px] truncate">{c.bestSellTrader}</span></div>
            : <div className="mt-1 h-3.5" />
          }
        </div>
        <div className="bg-tarkov-bg/60 rounded-lg px-2 py-2 flex flex-col justify-between min-h-[56px]">
          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide leading-none mb-1">Flea</p>
          <p className="text-blue-300 text-xs font-bold leading-none">{fmtK(c.flea)}</p>
          {row.last_offer_count != null
            ? <p className="text-gray-600 text-[9px] mt-1">{row.last_offer_count} {t('cardOffers')}</p>
            : <div className="mt-1 h-3.5" />
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
        <div className={`rounded-lg px-2.5 py-2 border ${
          c.bestRec === 'BUY_FLEA_SELL_TRADER' ? 'border-green-700/60 bg-green-900/20' : 'border-tarkov-border bg-tarkov-bg/40'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">Flea \u2192 Trader</span>
            {c.bestSellTrader && (
              <img src={TRADER_META[c.bestSellTrader]?.img} alt={c.bestSellTrader} className="w-4 h-4 rounded-full object-cover border border-tarkov-border" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <p className={`text-sm font-bold leading-none ${c.profitFTS > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {c.profitFTS != null ? `${c.profitFTS > 0 ? '+' : ''}${fmtK(c.profitFTS)}` : '\u2014'}
          </p>
          {c.pctFTS != null && <p className="text-gray-500 text-[10px] mt-0.5">{c.pctFTS > 0 ? '+' : ''}{c.pctFTS.toFixed(1)}%</p>}
        </div>
        <div className={`rounded-lg px-2.5 py-2 border ${
          c.bestRec === 'BUY_TRADER_SELL_FLEA' ? 'border-blue-700/60 bg-blue-900/20' : 'border-tarkov-border bg-tarkov-bg/40'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-wide">Trader \u2192 Flea</span>
            {c.bestBuyTrader && (
              <img src={TRADER_META[c.bestBuyTrader]?.img} alt={c.bestBuyTrader} className="w-4 h-4 rounded-full object-cover border border-tarkov-border" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <p className={`text-sm font-bold leading-none ${c.profitBTF > 0 ? 'text-blue-300' : 'text-red-400'}`}>
            {c.profitBTF != null ? `${c.profitBTF > 0 ? '+' : ''}${fmtK(c.profitBTF)}` : '\u2014'}
          </p>
          {c.pctBTF != null && <p className="text-gray-500 text-[10px] mt-0.5">{c.pctBTF > 0 ? '+' : ''}{c.pctBTF.toFixed(1)}%</p>}
        </div>
      </div>

      <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border-t border-white/5 ${
        isBTF ? 'bg-blue-900/20' : 'bg-green-900/20'
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>{recLabel}</span>
      </div>
    </div>
  );
}

function PaginationBar({ table, t, mobile }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from  = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to    = Math.min((pageIndex + 1) * pageSize, total);
  if (mobile) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-t border-tarkov-border">
        <div className="flex gap-1">
          {PAGE_SIZES.map((s) => (
            <button key={s} onClick={() => table.setPageSize(s)}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                pageSize === s ? 'border-tarkov-gold text-tarkov-gold' : 'border-tarkov-border text-gray-500'
              }`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1.5 rounded border border-tarkov-border disabled:opacity-30 text-sm">\u2039</button>
          <span className="text-xs text-gray-400 px-1">{pageIndex + 1} / {table.getPageCount()}</span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1.5 rounded border border-tarkov-border disabled:opacity-30 text-sm">\u203a</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mt-3 text-xs text-gray-400">
      <span>{from}\u2013{to} {t('paginationOf')} {total}</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">{t('paginationPerPage')}</span>
        {PAGE_SIZES.map((s) => (
          <button key={s} onClick={() => table.setPageSize(s)}
            className={`px-2 py-0.5 rounded border text-xs transition-colors ${
              pageSize === s ? 'border-tarkov-gold text-tarkov-gold' : 'border-tarkov-border text-gray-500 hover:border-gray-400'
            }`}>{s}</button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">\u00ab</button>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">\u2039</button>
        <span className="px-2">{t('paginationPage')} {pageIndex + 1} / {table.getPageCount()}</span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">\u203a</button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">\u00bb</button>
      </div>
    </div>
  );
}

export function ItemTable({ items, lang, traderFilters, feeDiscount }) {
  const t = useT(lang);
  const rows     = useMemo(() => items.map((item) => ({ ...item, _c: computeRow(item, traderFilters, feeDiscount) })), [items, traderFilters, feeDiscount]);
  const filtered = useMemo(() => rows.filter((r) => r._c.bestProfit != null && r._c.bestProfit > 0), [rows]);
  const [mobileSorting, setMobileSorting] = useState([{ id: 'best_profit', desc: true }]);
  const [expandedRows, setExpandedRows]   = useState(new Set());

  const toggleExpand = useCallback((rowId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const handleMobileSort = (id, desc) => setMobileSorting([{ id, desc }]);

  const columns = useMemo(() => [
    /* ─── Col 0 : ExpandArrow + CopyNameButton ─── */
    col.display({
      id: 'expand',
      header: '',
      enableSorting: false,
      cell: (info) => {
        const row   = info.row.original;
        const rowId = row.id + '_' + (row.mode || 'regular');
        const expanded = expandedRows.has(rowId);
        const name  = getItemName(row, lang) || row.normalized_name || row.id;
        return (
          <span className="flex items-center gap-1.5">
            <ExpandArrow expanded={expanded} onToggle={() => toggleExpand(rowId)} />
            <CopyNameButton name={name} toastLabel={t('copyToast')} />
          </span>
        );
      },
    }),
    /* ─── Col 1 : icône + nom (wiki link) ─── */
    col.accessor((row) => getItemName(row, lang), {
      id: 'name',
      header: t('colItem'),
      cell: (info) => {
        const row  = info.row.original;
        const name = info.getValue() || row.normalized_name || row.id;
        const url  = wikiUrl(row);
        return (
          <span className="flex items-center gap-1.5 min-w-[160px]">
            {row.icon_link
              ? <img src={row.icon_link} alt="" className="w-8 h-8 rounded object-contain bg-tarkov-card border border-tarkov-border flex-shrink-0" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
              : <span className="w-8 h-8 rounded bg-tarkov-card border border-tarkov-border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">?</span>
            }
            {url
              ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm leading-tight hover:text-tarkov-gold hover:underline transition-colors">{name}</a>
              : <span className="font-medium text-sm leading-tight">{name}</span>
            }
          </span>
        );
      },
    }),
    col.accessor((row) => row._c.bestBuyPrice, {
      id: 'buy_trader', header: t('colBuyTrader'),
      cell: (info) => <TraderBuyPricesTooltip pricesJson={info.row.original.trader_buy_prices} highlight={info.row.original._c.bestBuyTrader} label={t('tooltipBuyPrices')} traderFilters={traderFilters} />,
      sortingFn: (a, b) => (a.original._c.bestBuyPrice ?? Infinity) - (b.original._c.bestBuyPrice ?? Infinity),
    }),
    col.accessor((row) => row._c.flea, {
      id: 'flea_price', header: () => <span>Flea</span>,
      cell: (info) => <FleaPriceTooltip item={info.row.original} t={t} />,
    }),
    col.accessor((row) => row._c.bestSellPrice, {
      id: 'sell_trader', header: t('colSellTrader'),
      cell: (info) => <TraderPricesTooltip pricesJson={info.row.original.trader_prices} highlight={info.row.original._c.bestSellTrader} label={t('tooltipSellPrices')} />,
      sortingFn: (a, b) => (a.original._c.bestSellPrice ?? -Infinity) - (b.original._c.bestSellPrice ?? -Infinity),
    }),
    col.accessor((row) => row._c.profitBTF, {
      id: 'profit_btf', header: 'Trader\u2192Flea',
      cell: (info) => <ProfitCell value={info.row.original._c.profitBTF} pct={info.row.original._c.pctBTF} isBest={info.row.original._c.bestRec === 'BUY_TRADER_SELL_FLEA'} />,
      sortingFn: (a, b) => (a.original._c.profitBTF ?? -Infinity) - (b.original._c.profitBTF ?? -Infinity),
    }),
    col.accessor((row) => row._c.profitFTS, {
      id: 'profit_fts', header: 'Flea\u2192Trader',
      cell: (info) => <ProfitCell value={info.row.original._c.profitFTS} pct={info.row.original._c.pctFTS} isBest={info.row.original._c.bestRec === 'BUY_FLEA_SELL_TRADER'} />,
      sortingFn: (a, b) => (a.original._c.profitFTS ?? -Infinity) - (b.original._c.profitFTS ?? -Infinity),
    }),
    col.accessor((row) => row._c.bestProfit, {
      id: 'best_profit', header: '\u2605 Best Profit',
      cell: (info) => <ProfitCell value={info.row.original._c.bestProfit} pct={info.row.original._c.bestPct} isBest={true} />,
      sortingFn: (a, b) => (a.original._c.bestProfit ?? -Infinity) - (b.original._c.bestProfit ?? -Infinity),
    }),
    col.accessor((row) => row._c.bestRec, {
      id: 'action', header: t('colAction'), enableSorting: false,
      cell: (info) => { const r = info.row.original; return <ActionCell rec={r._c.bestRec} traderName={r._c.bestActionTrader} profit={r._c.bestProfit} />; },
    }),
  ], [lang, traderFilters, feeDiscount, t, expandedRows, toggleExpand]);

  const table = useReactTable({
    data: filtered, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { sorting: [{ id: 'best_profit', desc: true }], pagination: { pageSize: 25, pageIndex: 0 } },
  });

  const mobileTable = useReactTable({
    data: filtered, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting: mobileSorting },
    onSortingChange: setMobileSorting,
    initialState: { pagination: { pageSize: 25, pageIndex: 0 } },
  });

  if (filtered.length === 0) {
    return <p className="text-center py-8 text-gray-500">{t('noItems')}</p>;
  }

  const desktopRows = table.getRowModel().rows;
  const mobileRows  = mobileTable.getRowModel().rows;
  const { pageIndex: mpi, pageSize: mps } = mobileTable.getState().pagination;
  const mTotal = mobileTable.getFilteredRowModel().rows.length;
  const mFrom  = mTotal === 0 ? 0 : mpi * mps + 1;
  const mTo    = Math.min((mpi + 1) * mps, mTotal);

  const colCount = columns.length;

  return (
    <div className="mt-4">
      {/* ── Mobile ── */}
      <div className="lg:hidden rounded-xl border border-tarkov-border overflow-hidden">
        <MobileSortBar sorting={mobileSorting} onSort={handleMobileSort} t={t} total={mTotal} from={mFrom} to={mTo} />
        <div className="flex flex-col gap-3 p-3">
          {mobileRows.map((row) => (
            <ItemCard key={row.id} row={row.original} lang={lang} t={t} />
          ))}
        </div>
        <PaginationBar table={mobileTable} t={t} mobile />
      </div>

      {/* ── Desktop ── */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-tarkov-border">
        <table className="w-full text-sm">
          <thead className="bg-tarkov-card sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-3 py-2 text-left font-semibold text-tarkov-gold select-none whitespace-nowrap ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-tarkov-border transition-colors' : ''
                    }`}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' \u2191' : header.column.getIsSorted() === 'desc' ? ' \u2193' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {desktopRows.map((row, i) => {
              const rowId    = row.original.id + '_' + (row.original.mode || 'regular');
              const expanded = expandedRows.has(rowId);
              return (
                <React.Fragment key={row.id}>
                  <tr className={`border-t border-tarkov-border ${
                    i % 2 === 0 ? 'bg-tarkov-bg' : 'bg-tarkov-card'
                  } hover:bg-tarkov-border transition-colors`}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expanded && (
                    <HistoryExpandRow
                      key={rowId + '_history'}
                      itemId={row.original.id}
                      mode={row.original.mode || 'regular'}
                      colSpan={colCount}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="hidden lg:block">
        <PaginationBar table={table} t={t} />
      </div>
    </div>
  );
}

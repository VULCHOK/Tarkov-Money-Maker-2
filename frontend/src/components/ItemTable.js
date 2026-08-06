import React, { useMemo, useState } from 'react';
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

const col = createColumnHelper();
const fmt = (n) => n != null ? `${n.toLocaleString('fr-FR')} ₽` : '—';

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

function TraderPricesTooltip({ pricesJson, highlight, label }) {
  const [open, setOpen] = useState(false);
  let prices = {};
  try { prices = JSON.parse(pricesJson || '{}'); } catch {}

  const entries = ALL_TRADERS
    .map((t) => ({ trader: t, price: prices[t] }))
    .filter((e) => e.price != null)
    .sort((a, b) => b.price - a.price);

  if (entries.length === 0) return <span className="text-gray-600 text-xs">—</span>;

  const best = entries[0];
  const bestEntry = highlight ? entries.find((e) => e.trader === highlight) || best : best;

  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
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
        <span className="text-gray-600 text-xs ml-0.5 group-hover:text-gray-400">▾</span>
      </span>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-52 bg-tarkov-card border border-tarkov-border rounded shadow-lg py-1">
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
  let pricesByLevel = {};
  try { pricesByLevel = JSON.parse(pricesJson || '{}'); } catch {}

  const entries = ALL_TRADERS.map((trader) => {
    const levels = pricesByLevel[trader];
    if (!levels || typeof levels !== 'object') return null;
    const userLevel = traderFilters?.[trader]?.level ?? 1;
    let bestPrice = null;
    let accessibleLevel = null;
    for (let lvl = 1; lvl <= userLevel; lvl++) {
      const p = levels[String(lvl)];
      if (p != null && (bestPrice === null || p < bestPrice)) {
        bestPrice = p;
        accessibleLevel = lvl;
      }
    }
    if (bestPrice === null) return null;
    return { trader, price: bestPrice, accessibleLevel, userLevel, levels };
  }).filter(Boolean).sort((a, b) => a.price - b.price);

  if (entries.length === 0) return <span className="text-gray-600 text-xs">—</span>;

  const bestEntry = highlight ? entries.find((e) => e.trader === highlight) || entries[0] : entries[0];

  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
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
        <span className="text-gray-600 text-xs ml-0.5 group-hover:text-gray-400">▾</span>
      </span>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-tarkov-card border border-tarkov-border rounded shadow-lg py-1">
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
                      <span key={lvl} className="mr-2">🔒 LL{lvl}: {fmt(levels[String(lvl)])}</span>
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

function FleaPriceTooltip({ current, low24h, avg24h, high24h, lastOfferCount }) {
  const [open, setOpen] = useState(false);
  if (current == null) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="flex flex-col leading-tight cursor-default">
        <span className="text-blue-300 text-xs font-semibold">{fmt(current)}</span>
        {avg24h != null && <span className="text-gray-500 text-xs">moy {fmt(avg24h)}</span>}
      </span>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-52 bg-tarkov-card border border-tarkov-border rounded shadow-lg py-2 px-3">
          <p className="text-xs text-tarkov-gold font-semibold mb-2 border-b border-tarkov-border pb-1.5">📊 Flea — dernières 24h</p>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Actuel (last low)</span><span className="text-blue-300 font-semibold">{fmt(current)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">🟢 Plus bas 24h</span><span className="text-green-400">{fmt(low24h)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">⚪ Moyenne 24h</span><span className="text-gray-200">{fmt(avg24h)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">🔴 Plus haut 24h</span><span className="text-red-400">{fmt(high24h)}</span></div>
            {lastOfferCount != null && (
              <div className="flex justify-between border-t border-tarkov-border mt-1 pt-1">
                <span className="text-gray-500">Offres actives</span>
                <span className="text-gray-400">{lastOfferCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfitCell({ value, pct, isBest }) {
  if (value == null) return <span className="text-gray-600 text-xs">—</span>;
  const color   = value > 0 ? 'text-green-400' : 'text-red-400';
  // Flamme uniquement si best profit ET >= 100 000 ₽
  const fire    = isBest && value >= HOT_DEAL_THRESHOLD ? ' 🔥' : '';
  const bold    = isBest ? 'font-bold text-sm' : 'text-xs';
  return (
    <span className="flex flex-col leading-tight">
      <span className={`${color} ${bold}`}>{value > 0 ? '+' : ''}{value.toLocaleString('fr-FR')} ₽{fire}</span>
      {pct != null && <span className="text-gray-500 text-xs">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
    </span>
  );
}

function computeRow(item, traderFilters, feeDiscount) {
  const flea = item.flea_price ?? item.last_low_price ?? null;

  let bestSellTrader = null, bestSellPrice = null;
  try {
    const sell = JSON.parse(item.trader_prices || '{}');
    for (const t of ALL_TRADERS) {
      if (!traderFilters[t]?.enabled) continue;
      const p = sell[t];
      if (p != null && (bestSellPrice === null || p > bestSellPrice)) {
        bestSellPrice = p; bestSellTrader = t;
      }
    }
  } catch {}

  let bestBuyTrader = null, bestBuyPrice = null;
  try {
    const buyByLevel = JSON.parse(item.trader_buy_prices || '{}');
    for (const t of ALL_TRADERS) {
      if (!traderFilters[t]?.enabled) continue;
      const levels = buyByLevel[t];
      if (!levels || typeof levels !== 'object') continue;
      const userLevel = traderFilters[t]?.level ?? 1;
      for (let lvl = 1; lvl <= userLevel; lvl++) {
        const p = levels[String(lvl)];
        if (p != null && (bestBuyPrice === null || p < bestBuyPrice)) {
          bestBuyPrice = p; bestBuyTrader = t;
        }
      }
    }
  } catch {}

  let profitFTS = null, pctFTS = null;
  if (flea != null && bestSellPrice != null) {
    profitFTS = bestSellPrice - flea;
    pctFTS    = flea > 0 ? (profitFTS / flea) * 100 : null;
  }

  let profitBTF = null, pctBTF = null;
  if (flea != null && bestBuyPrice != null) {
    const fee = Math.round((item.flea_fee ?? 0) * (1 - (feeDiscount ?? 0)));
    profitBTF = flea - fee - bestBuyPrice;
    pctBTF    = bestBuyPrice > 0 ? (profitBTF / bestBuyPrice) * 100 : null;
  }

  let bestProfit = null, bestPct = null, bestRec = null;
  const ftsOk = profitFTS != null && profitFTS > 0;
  const btfOk = profitBTF != null && profitBTF > 0;
  if (ftsOk && (!btfOk || profitFTS >= profitBTF)) { bestProfit = profitFTS; bestPct = pctFTS; bestRec = 'BUY_FLEA_SELL_TRADER'; }
  else if (btfOk)                                   { bestProfit = profitBTF; bestPct = pctBTF; bestRec = 'BUY_TRADER_SELL_FLEA'; }

  const bestActionTrader = bestRec === 'BUY_FLEA_SELL_TRADER' ? bestSellTrader : bestBuyTrader;
  return { flea, bestSellTrader, bestSellPrice, bestBuyTrader, bestBuyPrice, profitFTS, pctFTS, profitBTF, pctBTF, bestProfit, bestPct, bestRec, bestActionTrader };
}

export function ItemTable({ items, lang, traderFilters, feeDiscount }) {
  const rows     = useMemo(() => items.map((item) => ({ ...item, _c: computeRow(item, traderFilters, feeDiscount) })), [items, traderFilters, feeDiscount]);
  const filtered = useMemo(() => rows.filter((r) => r._c.bestProfit != null && r._c.bestProfit > 0), [rows]);

  const columns = useMemo(() => [
    col.accessor((row) => lang === 'fr' ? (row.name_fr || row.name_en) : row.name_en, {
      id: 'name', header: lang === 'en' ? 'Item' : 'Item',
      cell: (info) => {
        const row  = info.row.original;
        const name = info.getValue() || row.normalized_name || row.id;
        return (
          <span className="flex items-center gap-2 min-w-[160px]">
            {row.icon_link
              ? <img src={row.icon_link} alt="" className="w-8 h-8 rounded object-contain bg-tarkov-card border border-tarkov-border flex-shrink-0" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
              : <span className="w-8 h-8 rounded bg-tarkov-card border border-tarkov-border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">?</span>
            }
            <span className="font-medium text-sm leading-tight">{name}</span>
          </span>
        );
      },
    }),
    col.accessor((row) => row._c.bestBuyPrice, {
      id: 'buy_trader', header: lang === 'en' ? 'Buy (Trader)' : 'Achat Trader',
      cell: (info) => (
        <TraderBuyPricesTooltip
          pricesJson={info.row.original.trader_buy_prices}
          highlight={info.row.original._c.bestBuyTrader}
          label={lang === 'en' ? 'Buy prices by trader (your level)' : "Prix d'achat chez les traders (selon votre niveau)"}
          traderFilters={traderFilters}
        />
      ),
      sortingFn: (a, b) => (a.original._c.bestBuyPrice ?? Infinity) - (b.original._c.bestBuyPrice ?? Infinity),
    }),
    col.accessor((row) => row._c.flea, {
      id: 'flea_price', header: () => <span>🛍 Flea</span>,
      cell: (info) => {
        const r = info.row.original;
        return <FleaPriceTooltip current={r._c.flea} low24h={r.low24h_price} avg24h={r.avg24h_price} high24h={r.high24h_price} lastOfferCount={r.last_offer_count} />;
      },
    }),
    col.accessor((row) => row._c.bestSellPrice, {
      id: 'sell_trader', header: lang === 'en' ? 'Sell (Trader)' : 'Vente Trader',
      cell: (info) => <TraderPricesTooltip pricesJson={info.row.original.trader_prices} highlight={info.row.original._c.bestSellTrader} label={lang === 'en' ? 'Trader buy-back prices' : 'Prix de rachat par les traders'} />,
      sortingFn: (a, b) => (a.original._c.bestSellPrice ?? -Infinity) - (b.original._c.bestSellPrice ?? -Infinity),
    }),
    col.accessor((row) => row._c.profitBTF, {
      id: 'profit_btf', header: lang === 'en' ? 'Profit Trader→Flea' : 'Profit Trader→Flea',
      cell: (info) => <ProfitCell value={info.row.original._c.profitBTF} pct={info.row.original._c.pctBTF} isBest={info.row.original._c.bestRec === 'BUY_TRADER_SELL_FLEA'} />,
      sortingFn: (a, b) => (a.original._c.profitBTF ?? -Infinity) - (b.original._c.profitBTF ?? -Infinity),
    }),
    col.accessor((row) => row._c.profitFTS, {
      id: 'profit_fts', header: lang === 'en' ? 'Profit Flea→Trader' : 'Profit Flea→Trader',
      cell: (info) => <ProfitCell value={info.row.original._c.profitFTS} pct={info.row.original._c.pctFTS} isBest={info.row.original._c.bestRec === 'BUY_FLEA_SELL_TRADER'} />,
      sortingFn: (a, b) => (a.original._c.profitFTS ?? -Infinity) - (b.original._c.profitFTS ?? -Infinity),
    }),
    col.accessor((row) => row._c.bestProfit, {
      id: 'best_profit', header: '⭐ Best Profit',
      cell: (info) => <ProfitCell value={info.row.original._c.bestProfit} pct={info.row.original._c.bestPct} isBest={true} />,
      sortingFn: (a, b) => (a.original._c.bestProfit ?? -Infinity) - (b.original._c.bestProfit ?? -Infinity),
    }),
    col.accessor((row) => row._c.bestRec, {
      id: 'action', header: lang === 'en' ? 'Action' : 'Action', enableSorting: false,
      cell: (info) => {
        const r = info.row.original;
        return <ActionCell rec={r._c.bestRec} traderName={r._c.bestActionTrader} profit={r._c.bestProfit} />;
      },
    }),
  ], [lang, traderFilters, feeDiscount]);

  const table = useReactTable({
    data: filtered, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { sorting: [{ id: 'best_profit', desc: true }], pagination: { pageSize: 25, pageIndex: 0 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = filtered.length;
  const from  = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to    = Math.min((pageIndex + 1) * pageSize, total);

  const noItemsMsg = lang === 'en'
    ? 'No profitable items found. Try lowering the profit threshold or enabling more traders.'
    : 'Aucun item profitable trouvé. Essaie de diminuer le seuil de profit ou d\'activer plus de traders.';

  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-lg border border-tarkov-border">
        <table className="w-full text-sm">
          <thead className="bg-tarkov-card sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                    className={`px-3 py-2 text-left font-semibold text-tarkov-gold select-none whitespace-nowrap ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-tarkov-border transition-colors' : ''
                    }`}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={`border-t border-tarkov-border ${
                i % 2 === 0 ? 'bg-tarkov-bg' : 'bg-tarkov-card'
              } hover:bg-tarkov-border transition-colors`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && <p className="text-center py-8 text-gray-500">{noItemsMsg}</p>}
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-3 text-xs text-gray-400">
          <span>{from}–{to} {lang === 'en' ? 'of' : 'sur'} {total} {lang === 'en' ? 'items' : 'items'}</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">{lang === 'en' ? 'Per page:' : 'Par page :'}</span>
            {PAGE_SIZES.map((s) => (
              <button key={s} onClick={() => table.setPageSize(s)}
                className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                  pageSize === s ? 'border-tarkov-gold text-tarkov-gold' : 'border-tarkov-border text-gray-500 hover:border-gray-400'
                }`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">«</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">‹</button>
            <span className="px-2">{lang === 'en' ? 'Page' : 'Page'} {pageIndex + 1} / {table.getPageCount()}</span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">›</button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">»</button>
          </div>
        </div>
      )}
    </div>
  );
}

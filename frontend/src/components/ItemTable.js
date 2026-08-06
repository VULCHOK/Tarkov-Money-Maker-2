import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ALL_TRADERS } from './Filters';

const col = createColumnHelper();
const fmt = (n) => n != null ? `${n.toLocaleString('fr-FR')} ₽` : '—';

const TRADER_META = {
  Prapor:     { img: 'https://assets.tarkov.dev/prapor-portrait.png' },
  Therapist:  { img: 'https://assets.tarkov.dev/therapist-portrait.png' },
  Skier:      { img: 'https://assets.tarkov.dev/skier-portrait.png' },
  Peacekeeper:{ img: 'https://assets.tarkov.dev/peacekeeper-portrait.png' },
  Mechanic:   { img: 'https://assets.tarkov.dev/mechanic-portrait.png' },
  Ragman:     { img: 'https://assets.tarkov.dev/ragman-portrait.png' },
  Jaeger:     { img: 'https://assets.tarkov.dev/jaeger-portrait.png' },
  Fence:      { img: 'https://assets.tarkov.dev/fence-portrait.png' },
  Lightkeeper:{ img: 'https://assets.tarkov.dev/lightkeeper-portrait.png' },
};

function TraderHeader({ trader }) {
  const meta = TRADER_META[trader];
  return (
    <span className="flex items-center gap-1.5">
      <img src={meta.img} alt={trader}
        className="w-5 h-5 rounded-full object-cover border border-tarkov-border"
        onError={(e) => { e.target.style.display = 'none'; }} />
      <span className="text-xs">{trader}</span>
    </span>
  );
}

function FleaHeader() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-base leading-none">🛒</span>
      <span className="text-xs">Flea</span>
    </span>
  );
}

const REC_META = {
  BUY_FLEA_SELL_TRADER: { text: 'Buy Flea → Trader', cls: 'bg-green-900 text-green-200', icon: '💰' },
  BUY_TRADER_SELL_FLEA: { text: 'Buy Trader → Flea', cls: 'bg-blue-900 text-blue-200',  icon: '🔄' },
  FLEA_ONLY:            { text: 'Flea only',          cls: 'bg-gray-700 text-gray-300',  icon: '🛒' },
};

const HIDDEN_RECS = new Set(['TRADER_ONLY', 'NO_PROFIT']);
const PAGE_SIZES  = [10, 25, 50];

function computeBestTrader(item, traderFilters) {
  let prices;
  try { prices = JSON.parse(item.trader_prices || '{}'); } catch { return null; }

  let bestTrader = null;
  let bestPrice  = -Infinity;
  for (const trader of ALL_TRADERS) {
    const tf = traderFilters[trader];
    if (!tf?.enabled) continue;
    const price = prices[trader];
    if (price == null) continue;
    if (price > bestPrice) { bestPrice = price; bestTrader = trader; }
  }
  if (!bestTrader) return null;

  const fleaPrice = item.flea_price ?? item.last_low_price;
  if (fleaPrice == null) return { trader: bestTrader, price: bestPrice, diff: null, diffPct: null };
  const diff    = bestPrice - fleaPrice;
  const diffPct = fleaPrice > 0 ? (diff / fleaPrice) * 100 : null;
  return { trader: bestTrader, price: bestPrice, diff, diffPct };
}

export function ItemTable({ items, lang, traderFilters, intelLevel, feeDiscount }) {
  const filtered = useMemo(
    () => items.filter((item) => !HIDDEN_RECS.has(item.recommendation)),
    [items]
  );

  const enriched = useMemo(() => {
    if (!traderFilters) return filtered;
    return filtered.map((item) => ({
      ...item,
      _best: computeBestTrader(item, traderFilters),
    }));
  }, [filtered, traderFilters]);

  const columns = useMemo(() => [
    // Item name + icon
    col.accessor((row) => lang === 'fr' ? (row.name_fr || row.name_en) : row.name_en, {
      id: 'name',
      header: 'Item',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="flex items-center gap-2">
            {row.icon_link ? (
              <img src={row.icon_link} alt=""
                className="w-7 h-7 rounded object-contain bg-tarkov-card border border-tarkov-border flex-shrink-0"
                loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <span className="w-7 h-7 rounded bg-tarkov-card border border-tarkov-border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">?</span>
            )}
            <span className="font-medium leading-tight">{info.getValue() || row.normalized_name || row.id}</span>
          </span>
        );
      },
    }),

    // Trader price columns
    ...ALL_TRADERS.map((trader) =>
      col.accessor(
        (row) => { try { return JSON.parse(row.trader_prices || '{}')[trader] ?? null; } catch { return null; } },
        {
          id: `trader_${trader}`,
          header: () => <TraderHeader trader={trader} />,
          cell: (info) => {
            const v   = info.getValue();
            const row = info.row.original;
            const tf  = traderFilters?.[trader];
            if (v == null) return <span className="text-gray-600 text-xs">—</span>;
            const isBest = tf?.enabled && row._best?.trader === trader && row.recommendation === 'BUY_FLEA_SELL_TRADER';
            const colorCls = !tf?.enabled ? 'text-gray-600 line-through'
              : isBest ? 'text-green-400 font-bold' : 'text-tarkov-gold';
            return (
              <span className={`text-xs ${colorCls}`}>
                {fmt(v)}
                {tf?.enabled && tf.level > 1 && <span className="text-gray-500 ml-1">LL{tf.level}</span>}
              </span>
            );
          },
        }
      )
    ),

    // Flea price
    col.accessor('flea_price', {
      id: 'flea',
      header: () => <FleaHeader />,
      cell: (info) => {
        const row  = info.row.original;
        const flea = info.getValue();
        const avg  = row.avg24h_price;
        const fee  = row.flea_fee;
        if (flea == null) return <span className="text-gray-600 text-xs">—</span>;
        return (
          <span className="flex flex-col">
            <span className="text-blue-300 text-xs font-semibold">{fmt(flea)}</span>
            {avg  != null && <span className="text-gray-500 text-xs">moy {fmt(avg)}</span>}
            {fee  != null && (
              <span className="text-orange-400 text-xs">
                taxe {fmt(Math.round(fee * (1 - (feeDiscount ?? 0))))}
              </span>
            )}
          </span>
        );
      },
    }),

    // Profit (Diff ₽)
    col.accessor((row) => row._best?.diff ?? null, {
      id: 'diff_rub',
      header: 'Profit ₽',
      cell: (info) => {
        const v    = info.getValue();
        const best = info.row.original._best;
        const rec  = info.row.original.recommendation;
        if (v == null) return <span className="text-gray-600 text-xs">—</span>;
        const color = v > 0 ? 'text-green-400' : 'text-red-400';
        const fire  = v >= 5000 ? ' 🔥' : '';
        const pct   = best?.diffPct;
        // For BUY_TRADER_SELL_FLEA, show fee info
        const fee   = info.row.original.flea_fee;
        return (
          <span className="flex flex-col">
            <span className={`font-bold text-sm ${color}`}>
              {v > 0 ? '+' : ''}{v.toLocaleString('fr-FR')} ₽{fire}
            </span>
            {pct != null && <span className="text-gray-500 text-xs">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
            {rec === 'BUY_TRADER_SELL_FLEA' && fee != null && (
              <span className="text-orange-400 text-xs">taxe -{fmt(Math.round(fee * (1 - (feeDiscount ?? 0))))}</span>
            )}
          </span>
        );
      },
      sortingFn: (a, b) => (a.original._best?.diff ?? -Infinity) - (b.original._best?.diff ?? -Infinity),
    }),

    // Best trader
    col.accessor((row) => row._best?.trader ?? null, {
      id: 'best_trader',
      header: 'Meilleur trader',
      cell: (info) => {
        const trader = info.getValue();
        const best   = info.row.original._best;
        if (!trader) return <span className="text-gray-600 text-xs">—</span>;
        const meta = TRADER_META[trader];
        return (
          <span className="flex items-center gap-1.5">
            {meta && <img src={meta.img} alt={trader}
              className="w-5 h-5 rounded-full object-cover border border-tarkov-border"
              onError={(e) => { e.target.style.display = 'none'; }} />}
            <span className="flex flex-col">
              <span className="text-tarkov-gold text-xs font-semibold">{trader}</span>
              {best?.price != null && <span className="text-gray-400 text-xs">{fmt(best.price)}</span>}
            </span>
          </span>
        );
      },
    }),

    // Action badge
    col.accessor('recommendation', {
      id: 'action',
      header: 'Action',
      cell: (info) => {
        const v      = info.getValue();
        const trader = info.row.original._best?.trader || info.row.original.best_trader;
        const meta   = REC_META[v] || { text: v || '—', cls: 'bg-gray-800 text-gray-500', icon: '' };
        const text   = v === 'BUY_FLEA_SELL_TRADER' && trader ? `Buy Flea → ${trader}` : meta.text;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${meta.cls}`}>
            <span>{meta.icon}</span><span>{text}</span>
          </span>
        );
      },
    }),
  ], [lang, traderFilters, feeDiscount]);

  const table = useReactTable({
    data: enriched,
    columns,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting:    [{ id: 'diff_rub', desc: true }],
      pagination: { pageSize: 25, pageIndex: 0 },
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = enriched.length;
  const from  = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to    = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-lg border border-tarkov-border">
        <table className="w-full text-sm">
          <thead className="bg-tarkov-card sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3 py-2 text-left font-semibold text-tarkov-gold cursor-pointer select-none hover:bg-tarkov-border transition-colors whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id}
                className={`border-t border-tarkov-border ${
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
        {total === 0 && (
          <p className="text-center py-8 text-gray-500">Aucun item trouvé. Essaie de diminuer le seuil de profit.</p>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-3 text-xs text-gray-400">
          <span>{from}–{to} sur {total} items</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Par page :</span>
            {PAGE_SIZES.map((s) => (
              <button key={s} onClick={() => table.setPageSize(s)}
                className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                  pageSize === s ? 'border-tarkov-gold text-tarkov-gold' : 'border-tarkov-border text-gray-500 hover:border-gray-400'
                }`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
              className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">«</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
              className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">‹</button>
            <span className="px-2">Page {pageIndex + 1} / {table.getPageCount()}</span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
              className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">›</button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}
              className="px-2 py-0.5 rounded border border-tarkov-border disabled:opacity-30 hover:border-tarkov-gold transition-colors">»</button>
          </div>
        </div>
      )}
    </div>
  );
}

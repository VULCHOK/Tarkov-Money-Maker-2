import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { ALL_TRADERS } from './Filters';

const col = createColumnHelper();
const fmt = (n) => n != null ? `${n.toLocaleString('fr-FR')} ₽` : '—';

// Prix minimum par trader selon son niveau de loyauté
// Basé sur les seuils officiels EFT :
const TRADER_LEVEL_MIN_PRICE = {
  Prapor:      { 1: 0,        2: 100000,   3: 300000,   4: 1000000  },
  Therapist:   { 1: 0,        2: 150000,   3: 400000,   4: 1500000  },
  Skier:       { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
  Peacekeeper: { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
  Mechanic:    { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
  Ragman:      { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
  Jaeger:      { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
  Fence:       { 1: 0 },
  Lightkeeper: { 1: 0,        2: 150000,   3: 400000,   4: 1000000  },
};

// Trader avatars
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
      <img
        src={meta.img}
        alt={trader}
        className="w-5 h-5 rounded-full object-cover border border-tarkov-border"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
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
  BUY_FLEA_SELL_TRADER: { text: 'Buy Flea → Trader', cls: 'bg-green-900 text-green-200',     icon: '💰' },
  BUY_TRADER_SELL_FLEA: { text: 'Buy Trader → Flea', cls: 'bg-blue-900 text-blue-200',      icon: '🔄' },
  FLEA_ONLY:            { text: 'Flea only',          cls: 'bg-gray-700 text-gray-300',      icon: '🛒' },
  TRADER_ONLY:          { text: 'Trader only',         cls: 'bg-yellow-900 text-yellow-200', icon: '🏪' },
  NO_PROFIT:            { text: 'No profit',           cls: 'bg-gray-800 text-gray-500',     icon: '➖' },
};

/**
 * Calcule le meilleur trader disponible selon les filtres actifs.
 * Retourne { trader, price, diff, diffPct } ou null si aucun trader dispo.
 */
function computeBestTrader(item, traderFilters) {
  let prices;
  try { prices = JSON.parse(item.trader_prices || '{}'); } catch { return null; }

  let bestTrader = null;
  let bestPrice = -Infinity;

  for (const trader of ALL_TRADERS) {
    const tf = traderFilters[trader];
    if (!tf || !tf.enabled) continue;
    const price = prices[trader];
    if (price == null) continue;
    if (price > bestPrice) {
      bestPrice = price;
      bestTrader = trader;
    }
  }

  if (!bestTrader) return null;

  const fleaPrice = item.flea_price ?? item.last_low_price;
  if (fleaPrice == null) return { trader: bestTrader, price: bestPrice, diff: null, diffPct: null };

  const diff = bestPrice - fleaPrice;
  const diffPct = fleaPrice > 0 ? (diff / fleaPrice) * 100 : null;
  return { trader: bestTrader, price: bestPrice, diff, diffPct };
}

export function ItemTable({ items, lang, traderFilters }) {
  // Enrichir chaque item avec le meilleur trader calculé côté client
  const enriched = useMemo(() => {
    if (!traderFilters) return items;
    return items.map((item) => ({
      ...item,
      _best: computeBestTrader(item, traderFilters),
    }));
  }, [items, traderFilters]);

  const columns = useMemo(() => [
    // Nom + icône
    col.accessor((row) => lang === 'fr' ? (row.name_fr || row.name_en) : row.name_en, {
      id: 'name',
      header: 'Item',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="flex items-center gap-2">
            {row.icon_link ? (
              <img
                src={row.icon_link}
                alt=""
                className="w-7 h-7 rounded object-contain bg-tarkov-card border border-tarkov-border flex-shrink-0"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="w-7 h-7 rounded bg-tarkov-card border border-tarkov-border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">?</span>
            )}
            <span className="font-medium leading-tight">{info.getValue() || row.normalized_name || row.id}</span>
          </span>
        );
      },
    }),

    // Catégorie
    col.accessor('category', {
      header: 'Catégorie',
      cell: (info) => <span className="text-gray-400 text-xs">{info.getValue() || '—'}</span>,
    }),

    // Colonnes trader (affichage, grisées si désactivées)
    ...ALL_TRADERS.map((trader) =>
      col.accessor(
        (row) => {
          try { return JSON.parse(row.trader_prices || '{}')[trader] ?? null; }
          catch { return null; }
        },
        {
          id: `trader_${trader}`,
          header: () => <TraderHeader trader={trader} />,
          cell: (info) => {
            const v = info.getValue();
            const tf = traderFilters?.[trader];
            const active = tf?.enabled;
            if (v == null) return <span className="text-gray-600 text-xs">—</span>;
            return (
              <span className={`text-xs ${active ? 'text-tarkov-gold' : 'text-gray-600 line-through'}`}>
                {fmt(v)}{active && tf.level > 1 ? <span className="text-gray-500 ml-1">LL{tf.level}</span> : null}
              </span>
            );
          },
        }
      )
    ),

    // Flea — last_low_price + avg24h en secondaire
    col.accessor('flea_price', {
      id: 'flea',
      header: () => <FleaHeader />,
      cell: (info) => {
        const row = info.row.original;
        const flea = info.getValue();
        const avg = row.avg24h_price;
        if (flea == null) return <span className="text-gray-600 text-xs">—</span>;
        return (
          <span className="flex flex-col">
            <span className="text-blue-300 text-xs font-semibold">{fmt(flea)}</span>
            {avg != null && (
              <span className="text-gray-500 text-xs">moy {fmt(avg)}</span>
            )}
          </span>
        );
      },
    }),

    // ★ Diff ₽ — valeur principale (issue #1)
    col.accessor((row) => row._best?.diff ?? null, {
      id: 'diff_rub',
      header: 'Diff ₽',
      cell: (info) => {
        const v = info.getValue();
        const row = info.row.original;
        const best = row._best;
        if (v == null) return <span className="text-gray-600 text-xs">—</span>;
        const isProfit = v > 0;
        const color = isProfit ? 'text-green-400' : 'text-red-400';
        const fire = isProfit && v >= 5000 ? ' 🔥' : '';
        const pct = best?.diffPct;
        return (
          <span className="flex flex-col">
            <span className={`font-bold text-sm ${color}`}>
              {v > 0 ? '+' : ''}{v.toLocaleString('fr-FR')} ₽{fire}
            </span>
            {pct != null && (
              <span className="text-gray-500 text-xs">
                {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
              </span>
            )}
          </span>
        );
      },
      sortingFn: (a, b) => {
        const da = a.original._best?.diff ?? -Infinity;
        const db = b.original._best?.diff ?? -Infinity;
        return da - db;
      },
    }),

    // Meilleur trader (recalculé)
    col.accessor((row) => row._best?.trader ?? null, {
      id: 'best_trader',
      header: 'Meilleur trader',
      cell: (info) => {
        const trader = info.getValue();
        const best = info.row.original._best;
        if (!trader) return <span className="text-gray-600 text-xs">—</span>;
        const meta = TRADER_META[trader];
        return (
          <span className="flex items-center gap-1.5">
            {meta && (
              <img
                src={meta.img}
                alt={trader}
                className="w-5 h-5 rounded-full object-cover border border-tarkov-border"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span className="flex flex-col">
              <span className="text-tarkov-gold text-xs font-semibold">{trader}</span>
              {best?.price != null && (
                <span className="text-gray-400 text-xs">{fmt(best.price)}</span>
              )}
            </span>
          </span>
        );
      },
    }),

    // Action / Recommendation
    col.accessor('recommendation', {
      id: 'action',
      header: 'Action',
      cell: (info) => {
        const v = info.getValue();
        const trader = info.row.original._best?.trader || info.row.original.best_trader;
        const meta = REC_META[v] || { text: v || '—', cls: 'bg-gray-800 text-gray-500', icon: '' };
        const text = (v === 'BUY_FLEA_SELL_TRADER' && trader)
          ? `Buy Flea → ${trader}`
          : meta.text;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${meta.cls}`}>
            <span>{meta.icon}</span>
            <span>{text}</span>
          </span>
        );
      },
    }),
  ], [lang, traderFilters]);

  const table = useReactTable({
    data: enriched,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'diff_rub', desc: true }],  // tri par défaut : meilleur profit ₽
    },
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-tarkov-border mt-4">
      <table className="w-full text-sm">
        <thead className="bg-tarkov-card sticky top-0 z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-3 py-2 text-left font-semibold text-tarkov-gold cursor-pointer select-none hover:bg-tarkov-border transition-colors whitespace-nowrap"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' ↑'
                    : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-t border-tarkov-border ${
                i % 2 === 0 ? 'bg-tarkov-bg' : 'bg-tarkov-card'
              } hover:bg-tarkov-border transition-colors`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {enriched.length === 0 && (
        <p className="text-center py-8 text-gray-500">No items found. Try refreshing data.</p>
      )}
    </div>
  );
}

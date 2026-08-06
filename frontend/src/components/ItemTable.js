import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

const col = createColumnHelper();
const fmt = (n) => n != null ? `${n.toLocaleString('fr-FR')}₽` : '—';

// Trader avatars — small images from tarkov.dev CDN
const TRADER_META = {
  Prapor:     { img: 'https://assets.tarkov.dev/prapor-portrait.png',     label: 'Prapor' },
  Therapist:  { img: 'https://assets.tarkov.dev/therapist-portrait.png',  label: 'Therapist' },
  Skier:      { img: 'https://assets.tarkov.dev/skier-portrait.png',      label: 'Skier' },
  Peacekeeper:{ img: 'https://assets.tarkov.dev/peacekeeper-portrait.png',label: 'Peacekeeper' },
  Mechanic:   { img: 'https://assets.tarkov.dev/mechanic-portrait.png',   label: 'Mechanic' },
  Ragman:     { img: 'https://assets.tarkov.dev/ragman-portrait.png',     label: 'Ragman' },
  Jaeger:     { img: 'https://assets.tarkov.dev/jaeger-portrait.png',     label: 'Jaeger' },
};

const TRADERS = Object.keys(TRADER_META);

// Trader header with avatar
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

// Flea market icon (using a market stall emoji rendered nicely)
function FleaHeader() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-base leading-none">🛒</span>
      <span className="text-xs">Flea</span>
    </span>
  );
}

// Recommendation badge
const REC_META = {
  BUY_FLEA_SELL_TRADER: { text: 'Buy Flea → Trader', cls: 'bg-green-900 text-green-200',  icon: '💰' },
  BUY_TRADER_SELL_FLEA: { text: 'Buy Trader → Flea', cls: 'bg-blue-900 text-blue-200',   icon: '🔄' },
  FLEA_ONLY:            { text: 'Flea only',          cls: 'bg-gray-700 text-gray-300',   icon: '🛒' },
  TRADER_ONLY:          { text: 'Trader only',         cls: 'bg-yellow-900 text-yellow-200', icon: '🏪' },
  NO_PROFIT:            { text: 'No profit',           cls: 'bg-gray-800 text-gray-500',  icon: '➖' },
};

export function ItemTable({ items, lang }) {
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

    // Category
    col.accessor('category', {
      header: 'Category',
      cell: (info) => <span className="text-gray-400 text-xs">{info.getValue() || '—'}</span>,
    }),

    // One column per trader
    ...TRADERS.map((trader) =>
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
            return v != null
              ? <span className="text-tarkov-gold text-xs">{fmt(v)}</span>
              : <span className="text-gray-600 text-xs">—</span>;
          },
        }
      )
    ),

    // Flea price
    col.accessor('flea_price', {
      header: () => <FleaHeader />,
      cell: (info) => {
        const v = info.getValue();
        return v != null
          ? <span className="text-blue-300 text-xs">{fmt(v)}</span>
          : <span className="text-gray-600 text-xs">—</span>;
      },
    }),

    // Diff %
    col.accessor('difference_pct', {
      header: 'Diff %',
      cell: (info) => {
        const v = info.getValue();
        if (v == null) return <span className="text-gray-600">—</span>;
        // negative = flea cheaper than trader = profit opportunity
        const isProfit = v < 0;
        const color = isProfit ? 'text-green-400' : 'text-red-400';
        const fire = isProfit && Math.abs(v) >= 20 ? ' 🔥' : '';
        return (
          <span className={`font-bold text-xs ${color}`}>
            {v > 0 ? '+' : ''}{v.toFixed(1)}%{fire}
          </span>
        );
      },
    }),

    // Recommendation / Action
    col.accessor('recommendation', {
      id: 'action',
      header: 'Action',
      cell: (info) => {
        const v = info.getValue();
        const trader = info.row.original.best_trader;
        const meta = REC_META[v] || { text: v || '—', cls: 'bg-gray-800 text-gray-500', icon: '' };
        // Override label for BUY_FLEA_SELL_TRADER to include trader name
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
  ], [lang]);

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
      {items.length === 0 && (
        <p className="text-center py-8 text-gray-500">No items found. Try refreshing data.</p>
      )}
    </div>
  );
}

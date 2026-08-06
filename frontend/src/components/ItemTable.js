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
const TRADERS = ['Prapor', 'Therapist', 'Skier', 'Peacekeeper', 'Mechanic', 'Ragman', 'Jaeger'];

export function ItemTable({ items, lang }) {
  const columns = useMemo(() => [
    col.accessor((row) => lang === 'fr' ? (row.name_fr || row.name_en) : row.name_en, {
      id: 'name',
      header: 'Item',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    col.accessor('category', {
      header: 'Category',
      cell: (info) => <span className="text-gray-400 text-sm">{info.getValue() || '—'}</span>,
    }),
    ...TRADERS.map((trader) =>
      col.accessor(
        (row) => {
          try { return JSON.parse(row.trader_prices || '{}')[trader] ?? null; }
          catch { return null; }
        },
        {
          id: `trader_${trader}`,
          header: trader,
          cell: (info) => fmt(info.getValue()),
        }
      )
    ),
    col.accessor('flea_price', {
      header: 'Flea Market',
      cell: (info) => fmt(info.getValue()),
    }),
    col.accessor('difference_pct', {
      header: 'Diff %',
      cell: (info) => {
        const v = info.getValue();
        if (v == null) return '—';
        const color = v > 0 ? 'text-tarkov-green' : 'text-tarkov-red';
        const fire = v >= 20 ? ' 🔥' : '';
        return <span className={`font-bold ${color}`}>{v > 0 ? '+' : ''}{v.toFixed(1)}%{fire}</span>;
      },
    }),
    col.accessor('recommendation', {
      id: 'action',
      header: 'Action',
      cell: (info) => {
        const v = info.getValue();
        const trader = info.row.original.best_trader;
        const labels = {
          BUY_FROM_TRADER: {
            text: trader ? `Buy from ${trader}` : 'Buy from trader',
            cls: 'bg-green-900 text-green-200',
          },
          BUY_FROM_FLEA:   { text: 'Buy from flea',   cls: 'bg-blue-900 text-blue-200' },
          FLEA_ONLY:       { text: 'Flea only',        cls: 'bg-gray-700 text-gray-300' },
          TRADER_ONLY:     { text: 'Trader only',      cls: 'bg-yellow-900 text-yellow-200' },
        };
        const label = labels[v] || { text: v || '—', cls: 'bg-gray-700 text-gray-300' };
        return <span className={`px-2 py-1 rounded text-xs ${label.cls}`}>{label.text}</span>;
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
        <thead className="bg-tarkov-card">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-3 py-2 text-left font-semibold text-tarkov-gold cursor-pointer select-none hover:bg-tarkov-border transition-colors"
                >
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
      {items.length === 0 && (
        <p className="text-center py-8 text-gray-500">No items found. Try refreshing data.</p>
      )}
    </div>
  );
}

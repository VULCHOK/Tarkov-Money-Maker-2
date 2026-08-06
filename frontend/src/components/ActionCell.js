import React, { useState } from 'react';
import { TRADER_META, FLEA_META } from './Filters';

// Portrait circulaire — taille augmentée, exploit pleine hauteur du badge
function Portrait({ meta, name, size = 26 }) {
  if (!meta?.img) {
    return (
      <span
        className="rounded-full bg-tarkov-card border border-tarkov-border flex items-center justify-center text-[9px] font-bold text-gray-400 flex-shrink-0"
        style={{ width: size, height: size }}
      >{name?.[0] ?? '?'}</span>
    );
  }
  return (
    <img
      src={meta.img}
      alt={name}
      title={name}
      className="rounded-full object-cover border border-white/20 flex-shrink-0"
      style={{ width: size, height: size, objectPosition: 'center 15%' }}
      onError={(e) => {
        if (meta.fallback && e.target.src !== meta.fallback) e.target.src = meta.fallback;
        else e.target.style.display = 'none';
      }}
    />
  );
}

const Arrow = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 opacity-60">
    <path d="M1 5h8M6 2l3 3-3 3" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ActionCell({ rec, traderName, profit }) {
  const [open, setOpen] = useState(false);

  if (!rec) return <span className="text-gray-600 text-xs">—</span>;

  const isFTS = rec === 'BUY_FLEA_SELL_TRADER';
  const isBTF = rec === 'BUY_TRADER_SELL_FLEA';

  const traderMeta = TRADER_META[traderName] ?? null;
  const fleaMeta   = FLEA_META;

  const bgCls = isFTS
    ? 'bg-green-900/50 border-green-700/50'
    : 'bg-blue-900/50 border-blue-700/50';

  const tooltipText = isFTS
    ? `Acheter sur la Flea → Vendre à ${traderName}`
    : `Acheter chez ${traderName} → Vendre sur la Flea`;

  const profitStr = profit != null ? `+${profit.toLocaleString('fr-FR')} ₽` : '';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Badge — hauteur 32px, portraits 26px, gap réduit */}
      <span
        className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 ${bgCls}`}
        style={{ width: 76, height: 32 }}
      >
        {isFTS && (<><Portrait meta={fleaMeta}   name="Flea"       size={26} /><Arrow /><Portrait meta={traderMeta} name={traderName} size={26} /></>)}
        {isBTF && (<><Portrait meta={traderMeta} name={traderName} size={26} /><Arrow /><Portrait meta={fleaMeta}   name="Flea"       size={26} /></>)}
      </span>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-52 bg-tarkov-card border border-tarkov-border rounded shadow-lg px-3 py-2 pointer-events-none">
          <p className="text-xs text-gray-300 leading-snug">{tooltipText}</p>
          {profitStr && <p className="text-xs text-green-400 font-semibold mt-1">{profitStr}</p>}
        </div>
      )}
    </div>
  );
}

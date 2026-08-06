import React, { useState, useRef, useEffect } from 'react';
import { TRADER_META, FLEA_META } from './Filters';

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
      src={meta.img} alt={name} title={name}
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
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ openUp: false, openLeft: false });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow  = window.innerHeight - rect.bottom;
    const spaceRight  = window.innerWidth  - rect.right;
    setPos({
      openUp:   spaceBelow < 100,
      openLeft: spaceRight < 220,
    });
  }, [open]);

  if (!rec) return <span className="text-gray-600 text-xs">&#8212;</span>;

  const isFTS = rec === 'BUY_FLEA_SELL_TRADER';
  const isBTF = rec === 'BUY_TRADER_SELL_FLEA';
  const traderMeta = TRADER_META[traderName] ?? null;
  const fleaMeta   = FLEA_META;

  const bgCls = isFTS
    ? 'bg-green-900/50 border-green-700/50'
    : 'bg-blue-900/50 border-blue-700/50';

  const tooltipText = isFTS
    ? `Acheter sur la Flea \u2192 Vendre \u00e0 ${traderName}`
    : `Acheter chez ${traderName} \u2192 Vendre sur la Flea`;

  const profitStr = profit != null ? `+${profit.toLocaleString('fr-FR')} \u20bd` : '';

  const vPos = pos.openUp   ? 'bottom-full mb-1' : 'top-full mt-1';
  const hPos = pos.openLeft ? 'right-0'          : 'left-0';

  return (
    <div
      className="relative inline-flex"
      ref={triggerRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 ${bgCls}`}
        style={{ width: 76, height: 32 }}
      >
        {isFTS && (<><Portrait meta={fleaMeta}   name="Flea"       size={26} /><Arrow /><Portrait meta={traderMeta} name={traderName} size={26} /></>)}
        {isBTF && (<><Portrait meta={traderMeta} name={traderName} size={26} /><Arrow /><Portrait meta={fleaMeta}   name="Flea"       size={26} /></>)}
      </span>

      {open && (
        <div className={`absolute z-50 ${vPos} ${hPos} w-52 bg-tarkov-card border border-tarkov-border rounded shadow-lg px-3 py-2 pointer-events-none`}>
          <p className="text-xs text-gray-300 leading-snug">{tooltipText}</p>
          {profitStr && <p className="text-xs text-green-400 font-semibold mt-1">{profitStr}</p>}
        </div>
      )}
    </div>
  );
}

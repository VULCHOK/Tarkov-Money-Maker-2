import React, { useState } from 'react';

const TRADER_PORTRAITS = {
  Prapor:      'https://assets.tarkov.dev/prapor-portrait.png',
  Therapist:   'https://assets.tarkov.dev/therapist-portrait.png',
  Skier:       'https://assets.tarkov.dev/skier-portrait.png',
  Peacekeeper: 'https://assets.tarkov.dev/peacekeeper-portrait.png',
  Mechanic:    'https://assets.tarkov.dev/mechanic-portrait.png',
  Ragman:      'https://assets.tarkov.dev/ragman-portrait.png',
  Jaeger:      'https://assets.tarkov.dev/jaeger-portrait.png',
  Fence:       'https://assets.tarkov.dev/fence-portrait.png',
  Lightkeeper: 'https://assets.tarkov.dev/lightkeeper-portrait.png',
};

const FLEA_ICON = '🛒';

function Portrait({ name, size = 20 }) {
  const src = TRADER_PORTRAITS[name];
  if (!src) return (
    <span
      className="rounded-full bg-tarkov-card border border-tarkov-border flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0"
      style={{ width: size, height: size }}>
      {name?.[0] ?? '?'}
    </span>
  );
  return (
    <img src={src} alt={name} title={name}
      className="rounded-full object-cover border border-tarkov-border flex-shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

/**
 * Colonne Action — taille fixe, icônes uniquement, tooltip au survol.
 * rec : 'BUY_FLEA_SELL_TRADER' | 'BUY_TRADER_SELL_FLEA'
 * traderName : nom du trader impliqué
 * profit : valeur numérique du meilleur profit
 */
export function ActionCell({ rec, traderName, profit }) {
  const [open, setOpen] = useState(false);

  if (!rec) return <span className="text-gray-600 text-xs">—</span>;

  const isFTS = rec === 'BUY_FLEA_SELL_TRADER';
  const isBTF = rec === 'BUY_TRADER_SELL_FLEA';

  const bgCls   = isFTS ? 'bg-green-900/60 border-green-800' : 'bg-blue-900/60 border-blue-800';
  const arrow   = <span className="text-gray-400 text-xs font-bold select-none">→</span>;

  const tooltipText = isFTS
    ? `Acheter sur la Flea → Vendre à ${traderName}`
    : `Acheter chez ${traderName} → Vendre sur la Flea`;

  const profitStr = profit != null
    ? `+${profit.toLocaleString('fr-FR')} ₽`
    : '';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Badge fixe 72px */}
      <span
        className={`inline-flex items-center justify-center gap-1 rounded border px-1.5 py-1 ${bgCls}`}
        style={{ width: 72, height: 28 }}
      >
        {isFTS && (<>{FLEA_ICON}{arrow}<Portrait name={traderName} size={18} /></>)}
        {isBTF && (<><Portrait name={traderName} size={18} />{arrow}{FLEA_ICON}</>)}
      </span>

      {/* Tooltip */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-48 bg-tarkov-card border border-tarkov-border rounded shadow-lg px-3 py-2 pointer-events-none">
          <p className="text-xs text-gray-300 leading-snug">{tooltipText}</p>
          {profitStr && <p className="text-xs text-green-400 font-semibold mt-1">{profitStr}</p>}
        </div>
      )}
    </div>
  );
}

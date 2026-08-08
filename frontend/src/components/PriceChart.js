/**
 * PriceChart.js
 *
 * Mini graphique de prix 24h pour la Flea Market.
 * Utilise uniquement les données disponibles dans ItemOut :
 *   low24h_price, avg24h_price, flea_price, high24h_price
 *   last_offer_count, change_48h, change_48h_pct
 *
 * Règle : si last_offer_count est null/undefined (PVE / pvp-season)
 *   => return null, le graphique n'est pas rendu.
 *
 * Graphique SVG inline, sans dépendance externe.
 *
 * Fix: chaque instance utilise un id de gradient unique pour éviter les
 * conflits quand plusieurs tooltips sont montés simultanément dans le DOM.
 */

import React, { useId } from 'react';

const RUB = '₽';

function buildPolyline(points, W, H, PAD) {
  if (points.length < 2) return '';
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  return points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * innerW;
      const y = PAD + (1 - (p.value - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildFillPath(points, W, H, PAD) {
  if (points.length < 2) return '';
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * innerW;
    const y = PAD + (1 - (p.value - min) / range) * innerH;
    return [x.toFixed(1), y.toFixed(1)];
  });
  const firstX = coords[0][0];
  const lastX  = coords[coords.length - 1][0];
  const bottom = H - PAD;
  return (
    `M${firstX},${bottom} ` +
    coords.map(([x, y]) => `L${x},${y}`).join(' ') +
    ` L${lastX},${bottom} Z`
  );
}

function buildDots(points, W, H, PAD) {
  if (points.length < 2) return [];
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  return points.map((p, i) => ({
    cx: (PAD + (i / (points.length - 1)) * innerW).toFixed(1),
    cy: (PAD + (1 - (p.value - min) / range) * innerH).toFixed(1),
    color: p.color,
    label: p.timeLabel,
  }));
}

/* Génère les labels d'heure relatifs à maintenant */
function buildTimeLabels(count) {
  const now = new Date();
  // On répartit les points sur 24h, le dernier point = maintenant
  const hours = [];
  for (let i = 0; i < count; i++) {
    const offsetH = Math.round(((count - 1 - i) / (count - 1)) * 24);
    if (offsetH === 0) {
      hours.push('now');
    } else {
      const d = new Date(now.getTime() - offsetH * 3600 * 1000);
      hours.push(`${d.getHours().toString().padStart(2, '0')}h`);
    }
  }
  return hours;
}

export function PriceChart({ item, t }) {
  // useId génère un id unique par instance de composant — évite les conflits
  // de <defs> entre plusieurs graphiques montés simultanément.
  const uid = useId().replace(/:/g, '');
  const gradId = `chartFill_${uid}`;

  if (item.last_offer_count == null) return null;

  const {
    low24h_price, avg24h_price, flea_price, high24h_price,
    change_48h, change_48h_pct, last_offer_count,
  } = item;

  const raw = [
    { labelKey: 'fleaLow',  value: low24h_price,  color: '#4ade80' },
    { labelKey: 'fleaAvg',  value: avg24h_price,  color: '#93c5fd' },
    { labelKey: 'fleaCur',  value: flea_price,    color: '#facc15' },
    { labelKey: 'fleaHigh', value: high24h_price, color: '#f87171' },
  ];

  const points = raw.filter((p) => p.value != null);
  const hasChart = points.length >= 2;

  // Ajoute les labels d'heure aux points filtrés
  const timeLabels = buildTimeLabels(points.length);
  const pointsWithTime = points.map((p, i) => ({ ...p, timeLabel: timeLabels[i] }));

  const W      = 200;
  const H      = 56;
  const PAD    = 8;
  const X_AXIS = 12; // hauteur réservée pour les labels d'heure sous le SVG

  const polyline = hasChart ? buildPolyline(pointsWithTime, W, H, PAD) : '';
  const fillPath = hasChart ? buildFillPath(pointsWithTime, W, H, PAD) : '';
  const dots     = hasChart ? buildDots(pointsWithTime, W, H, PAD) : [];

  const change48Positive = change_48h != null && change_48h >= 0;
  const changeColor = change48Positive ? 'text-green-400' : 'text-red-400';
  const changeSign  = change48Positive ? '+' : '';

  return (
    <div className="mt-2 border-t border-tarkov-border pt-2">
      <p className="text-[9px] text-tarkov-gold font-semibold uppercase tracking-wider mb-1.5">
        {t('chartTitle')}
      </p>

      {hasChart ? (
        <div className="relative">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#facc15" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#${gradId})`} />
            <polyline
              points={polyline}
              fill="none" stroke="#facc15" strokeWidth="1.5"
              strokeLinejoin="round" strokeLinecap="round" opacity="0.8"
            />
            {dots.map((d, i) => (
              <g key={i}>
                {/* Halo */}
                <circle cx={d.cx} cy={d.cy} r="5"
                  fill={d.color} opacity="0.15" />
                {/* Point principal */}
                <circle cx={d.cx} cy={d.cy} r="3"
                  fill={d.color} stroke="#111" strokeWidth="1.2" />
              </g>
            ))}
          </svg>
          {/* Labels d'heure sous chaque point */}
          <div
            className="flex justify-between"
            style={{ width: W, marginTop: 2 }}
          >
            {dots.map((d, i) => (
              <span
                key={i}
                className="text-[8px] text-gray-600"
                style={{
                  position: 'absolute',
                  left: `${d.cx}px`,
                  transform: 'translateX(-50%)',
                  top: `${H + 2}px`,
                  color: d.color,
                  opacity: 0.7,
                }}
              >
                {d.label}
              </span>
            ))}
            {/* spacer pour la hauteur */}
            <span style={{ height: X_AXIS, display: 'block', visibility: 'hidden' }}>&nbsp;</span>
          </div>
          {/* Espace pour les labels */}
          <div style={{ height: X_AXIS }} />
        </div>
      ) : (
        <p className="text-gray-600 text-[10px]">{t('chartNoData')}</p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5">
        {raw.map(({ labelKey, value, color }) => (
          <div key={labelKey} className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-gray-500 text-[9px]">{t(labelKey)}</span>
            </span>
            <span className="text-[9px] font-semibold" style={{ color }}>
              {value != null ? value.toLocaleString('fr-FR') : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5">
        <span className="text-gray-600 text-[9px]">
          {last_offer_count != null ? `${last_offer_count} ${t('fleaOffers')}` : ''}
        </span>
        {change_48h != null && (
          <span className={`text-[9px] font-semibold ${changeColor}`}>
            {changeSign}{change_48h.toLocaleString('fr-FR')} {RUB}
            {change_48h_pct != null && (
              <span className="opacity-70 ml-1">({changeSign}{change_48h_pct.toFixed(1)}%)</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

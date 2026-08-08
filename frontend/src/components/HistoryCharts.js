/**
 * HistoryCharts.js
 *
 * Ligne expansible sous chaque item de la table.
 * Affiche 2 mini-graphiques SVG pur (pas de librairie externe) :
 *   - Graphique 1 : flea_price toutes les 10 min sur 24h
 *   - Graphique 2 : offer_count toutes les 10 min sur 24h
 *
 * Usage :
 *   <HistoryExpandRow itemId={id} mode={mode} colSpan={N} lang={lang} />
 *
 * Fix: la largeur du SVG est désormais mesurée dynamiquement via ResizeObserver
 * sur le <td> conteneur, ce qui évite les problèmes avec la largeur fixe
 * précédente (340 px) quand le tableau est plus étroit (zoom, petite fenêtre).
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const RUB = '\u20BD';
const fmtK = (n) => {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
};

/* ── Tooltip inline positionné via onMouseMove ── */
function SvgTooltip({ tooltip }) {
  if (!tooltip) return null;
  const { x, y, label, value, svgWidth } = tooltip;
  const W = 100, H = 36;
  const tx = Math.min(Math.max(x - W / 2, 4), svgWidth - W - 4);
  const ty = y > 50 ? y - H - 8 : y + 12;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx} y={ty} width={W} height={H} rx="4" fill="#1e1c19" stroke="#3a3836" strokeWidth="1" />
      <text x={tx + W / 2} y={ty + 13} textAnchor="middle" fill="#a89060" fontSize="9" fontWeight="600" fontFamily="monospace">{label}</text>
      <text x={tx + W / 2} y={ty + 27} textAnchor="middle" fill="#e0d9cc" fontSize="10" fontWeight="700" fontFamily="monospace">{value}</text>
    </g>
  );
}

/* ── Hook : observe la largeur d'un élément DOM ── */
function useElementWidth(ref, fallback = 340) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setWidth(w);
      }
    });
    ro.observe(ref.current);
    // Valeur initiale immédiate
    const w = ref.current.getBoundingClientRect().width;
    if (w > 0) setWidth(w);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/* ── Mini SVG sparkline ── */
function Sparkline({ points, color, valueFormatter, label, height = 90, svgWidth }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  // useId pour des ids de gradient uniques par instance
  const uid = useId().replace(/:/g, '');
  const gradId = `sparkGrad_${uid}`;

  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <span className="text-xs text-gray-600">—</span>
      </div>
    );
  }

  const vals   = points.map((p) => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const range  = maxVal - minVal || 1;

  const PAD_L = 36, PAD_R = 8, PAD_T = 10, PAD_B = 18;
  const W = svgWidth - PAD_L - PAD_R;
  const H = height - PAD_T - PAD_B;

  const toX = (i) => PAD_L + (i / (points.length - 1 || 1)) * W;
  const toY = (v) => PAD_T + H - ((v - minVal) / range) * H;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L${toX(points.length - 1).toFixed(1)},${(PAD_T + H).toFixed(1)} L${PAD_L.toFixed(1)},${(PAD_T + H).toFixed(1)} Z`;

  const yTicks = [minVal, minVal + range / 2, maxVal];

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const idx = Math.round(((mx - PAD_L) / W) * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, idx));
    const p = points[clamped];
    const ts = new Date(p.ts);
    const timeLabel = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTooltip({
      x:        toX(clamped),
      y:        toY(p.value),
      label:    timeLabel,
      value:    valueFormatter(p.value),
      svgWidth: svgWidth,
    });
  };

  return (
    <div>
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1 pl-1">{label}</p>
      <svg
        ref={svgRef}
        width={svgWidth}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L} y1={toY(v).toFixed(1)}
              x2={PAD_L + W} y2={toY(v).toFixed(1)}
              stroke="#2a2826" strokeWidth="1"
            />
            <text
              x={PAD_L - 4} y={toY(v) + 3.5}
              textAnchor="end" fill="#605e5b"
              fontSize="8" fontFamily="monospace"
            >
              {fmtK(Math.round(v))}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const ts = new Date(p.ts);
          if (ts.getMinutes() !== 0 || ts.getHours() % 6 !== 0) return null;
          return (
            <text key={i}
              x={toX(i).toFixed(1)} y={PAD_T + H + 13}
              textAnchor="middle" fill="#504e4b"
              fontSize="8" fontFamily="monospace"
            >
              {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          );
        })}

        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {tooltip && (
          <circle
            cx={tooltip.x} cy={tooltip.y} r="3.5"
            fill={color} stroke="#1e1c19" strokeWidth="1.5"
          />
        )}

        <SvgTooltip tooltip={tooltip} />
      </svg>
    </div>
  );
}

/* ── Ligne expansible complète ── */
export function HistoryExpandRow({ itemId, mode, colSpan }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const fetchedRef = useRef(false);
  // Ref sur le <td> pour mesurer sa largeur réelle
  const containerRef = useRef(null);
  const containerWidth = useElementWidth(containerRef, 340);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}/history?mode=${mode || 'regular'}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e)  => { setError(e.message); setLoading(false); });
  }, [itemId, mode]);

  const pricePoints  = data?.points?.filter((p) => p.flea_price  != null).map((p) => ({ ts: p.ts, value: p.flea_price  })) ?? [];
  const offerPoints  = data?.points?.filter((p) => p.offer_count != null).map((p) => ({ ts: p.ts, value: p.offer_count })) ?? [];
  const hasData      = pricePoints.length > 0 || offerPoints.length > 0;

  // Chaque graphique prend ~45% de la largeur du conteneur (avec gap),
  // avec un minimum de 200 px et un maximum de 500 px.
  const CHART_W = Math.min(500, Math.max(200, Math.floor((containerWidth - 24) / 2)));

  return (
    <tr className="border-t border-tarkov-border/40">
      <td ref={containerRef} colSpan={colSpan} className="px-4 py-3 bg-[#141311]">
        {loading && (
          <div className="flex items-center gap-2 py-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-tarkov-gold border-t-transparent animate-spin" />
            <span className="text-xs text-gray-500">Chargement historique…</span>
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400 py-1">Erreur : {error}</p>
        )}
        {!loading && !error && !hasData && (
          <p className="text-xs text-gray-600 py-1">Pas encore de données historiques — elles s'accumulent après chaque sync.</p>
        )}
        {!loading && !error && hasData && (
          <div className="flex flex-wrap gap-6">
            <Sparkline
              points={pricePoints}
              color="#5ba8c4"
              label={`Prix Flea (${pricePoints.length} pts)`}
              valueFormatter={(v) => `${fmtK(v)} ${RUB}`}
              height={96}
              svgWidth={CHART_W}
            />
            <Sparkline
              points={offerPoints}
              color="#7ab87a"
              label={`Offres disponibles (${offerPoints.length} pts)`}
              valueFormatter={(v) => `${v} offres`}
              height={96}
              svgWidth={CHART_W}
            />
          </div>
        )}
      </td>
    </tr>
  );
}

/* ── Bouton flèche ▶ / ▼ ── */
export function ExpandArrow({ expanded, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-label={expanded ? 'Masquer graphiques' : 'Afficher graphiques'}
      title={expanded ? 'Masquer graphiques' : 'Afficher les graphiques 24h'}
      className={`flex items-center justify-center w-5 h-5 rounded transition-all duration-200 ${
        expanded
          ? 'text-tarkov-gold rotate-0'
          : 'text-gray-500 hover:text-tarkov-gold'
      }`}
      style={{ flexShrink: 0 }}
    >
      <svg
        width="9" height="9" viewBox="0 0 9 9" fill="currentColor"
        style={{ transition: 'transform 180ms ease', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
      >
        <polygon points="2,1 8,4.5 2,8" />
      </svg>
    </button>
  );
}

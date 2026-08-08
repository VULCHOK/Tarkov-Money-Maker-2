/**
 * HistoryCharts.js
 */

import React, { useState, useEffect, useRef, useId } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const RUB = '₽';
const fmtK = (n) => {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
};

/* ── Fallback t function so HistoryExpandRow never crashes if t prop is missing ── */
const FALLBACK_STRINGS = {
  histError:    'Failed to load history',
  histLoading:  'Loading…',
  histNoData:   'No data available',
  histFleaPrice:'Flea price',
  histOffers:   'Offers',
};
const fallbackT = (key) => FALLBACK_STRINGS[key] ?? key;

/* ── Tooltip SVG inline ── */
function SvgTooltip({ tooltip, svgWidth }) {
  if (!tooltip) return null;
  const { x, y, label, value } = tooltip;
  const W = 110, H = 38;
  const tx = Math.min(Math.max(x - W / 2, 4), (svgWidth || 300) - W - 4);
  const ty = y > 60 ? y - H - 10 : y + 14;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx} y={ty} width={W} height={H} rx="4" fill="#1e1c19" stroke="#3a3836" strokeWidth="1" />
      <text x={tx + W / 2} y={ty + 14} textAnchor="middle" fill="#a89060" fontSize="9" fontWeight="600" fontFamily="monospace">{label}</text>
      <text x={tx + W / 2} y={ty + 28} textAnchor="middle" fill="#e0d9cc" fontSize="11" fontWeight="700" fontFamily="monospace">{value}</text>
    </g>
  );
}

/* ── Mini SVG sparkline ── */
function Sparkline({ points, color, valueFormatter, label, height = 110 }) {
  const [tooltip, setTooltip]   = useState(null);
  const [svgWidth, setSvgWidth] = useState(300);
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);
  const uid     = useId().replace(/:/g, '');
  const gradId  = `sparkGrad_${uid}`;

  useEffect(() => {
    if (!wrapRef.current) return;
    const measure = () => {
      const w = wrapRef.current?.getBoundingClientRect().width;
      if (w > 0) setSvgWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!points || points.length === 0) {
    return (
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }} ref={wrapRef}>
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center justify-center" style={{ height }}>
          <span className="text-xs text-gray-600">—</span>
        </div>
      </div>
    );
  }

  const vals   = points.map((p) => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const range  = maxVal - minVal || 1;

  const PAD_L = 40, PAD_R = 8, PAD_T = 10, PAD_B = 20;
  const W = Math.max(1, svgWidth - PAD_L - PAD_R);
  const H = height - PAD_T - PAD_B;

  const toX = (i) => PAD_L + (i / (points.length - 1 || 1)) * W;
  const toY = (v) => PAD_T + H - ((v - minVal) / range) * H;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(' ');

  const areaD =
    `${pathD} ` +
    `L${toX(points.length - 1).toFixed(1)},${(PAD_T + H).toFixed(1)} ` +
    `L${PAD_L.toFixed(1)},${(PAD_T + H).toFixed(1)} Z`;

  const yTicks = [minVal, minVal + range / 2, maxVal];

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const idx  = Math.round(((mx - PAD_L) / W) * (points.length - 1));
    const cl   = Math.max(0, Math.min(points.length - 1, idx));
    const p    = points[cl];
    const ts   = new Date(p.ts);
    setTooltip({
      x: toX(cl), y: toY(p.value),
      label: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: valueFormatter(p.value),
    });
  };

  return (
    <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }} ref={wrapRef}>
      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
      <svg
        ref={svgRef}
        width={svgWidth}
        height={height}
        style={{ cursor: 'crosshair', display: 'block', width: '100%', height }}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={toY(v)} x2={PAD_L + W} y2={toY(v)} stroke="#2a2826" strokeWidth="1" />
            <text x={PAD_L - 4} y={toY(v) + 4} textAnchor="end" fill="#605e5b" fontSize="8" fontFamily="monospace">
              {fmtK(Math.round(v))}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const ts = new Date(p.ts);
          if (ts.getMinutes() !== 0 || ts.getHours() % 6 !== 0) return null;
          return (
            <text key={i} x={toX(i)} y={PAD_T + H + 14}
              textAnchor="middle" fill="#504e4b" fontSize="8" fontFamily="monospace">
              {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          );
        })}

        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} stroke="#1e1c19" strokeWidth="1.5" />
        )}

        <SvgTooltip tooltip={tooltip} svgWidth={svgWidth} />
      </svg>
    </div>
  );
}

/* ── Ligne expansible complète ── */
export function HistoryExpandRow({ itemId, mode, colSpan, t: tProp }) {
  const t = tProp ?? fallbackT;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);

    const controller = new AbortController();
    const url = `${API_BASE}/items/${encodeURIComponent(itemId)}/history?mode=${mode || 'regular'}`;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.statusText}`);
        return r.json();
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        const msg = e.message?.includes('Failed to fetch')
          ? t('histError')
          : e.message;
        setError(msg);
        setLoading(false);
      });

    return () => controller.abort();
  }, [itemId, mode, t]);

  const pricePoints = data?.points?.filter((p) => p.flea_price  != null).map((p) => ({ ts: p.ts, value: p.flea_price  })) ?? [];
  const offerPoints = data?.points?.filter((p) => p.offer_count != null).map((p) => ({ ts: p.ts, value: p.offer_count })) ?? [];
  const hasData     = pricePoints.length > 0 || offerPoints.length > 0;

  return (
    <tr className="border-t border-tarkov-border/40">
      <td colSpan={colSpan} className="px-4 py-3 bg-[#141311]">
        {loading && (
          <div className="flex items-center gap-2 py-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-tarkov-gold border-t-transparent animate-spin" />
            <span className="text-xs text-gray-500">{t('histLoading')}</span>
          </div>
        )}
        {error && (
          <p className="text-xs text-yellow-600/80 py-1 italic">{error}</p>
        )}
        {!loading && !error && !hasData && (
          <p className="text-xs text-gray-600 py-1">{t('histNoData')}</p>
        )}
        {!loading && !error && hasData && (
          <div style={{ display: 'flex', gap: '16px', width: '100%', overflow: 'hidden' }}>
            <Sparkline
              points={pricePoints}
              color="#5ba8c4"
              label={t('histFleaPrice')}
              valueFormatter={(v) => `${fmtK(v)} ${RUB}`}
              height={110}
            />
            <Sparkline
              points={offerPoints}
              color="#7ab87a"
              label={t('histOffers')}
              valueFormatter={(v) => `${v}`}
              height={110}
            />
          </div>
        )}
      </td>
    </tr>
  );
}

/* ── Bouton flèche ▶/▼ avec label 24h ── */
export function ExpandArrow({ expanded, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-label={expanded ? 'Hide charts' : 'Show 24h charts'}
      title={expanded ? 'Hide charts' : 'Show 24h charts'}
      className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all duration-150 text-[10px] font-semibold select-none ${
        expanded
          ? 'border-tarkov-gold/60 text-tarkov-gold bg-tarkov-gold/10'
          : 'border-tarkov-border text-gray-500 hover:border-tarkov-gold/50 hover:text-tarkov-gold hover:bg-tarkov-gold/5'
      }`}
    >
      <svg
        width="7" height="7" viewBox="0 0 9 9" fill="currentColor"
        style={{ transition: 'transform 180ms ease', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
      >
        <polygon points="2,1 8,4.5 2,8" />
      </svg>
      <span>24h</span>
    </button>
  );
}

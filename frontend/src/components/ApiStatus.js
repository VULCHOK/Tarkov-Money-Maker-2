import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Displays a coloured dot + tooltip showing tarkov.dev service health.
 *
 * ● GREEN   — api.tarkov.dev GraphQL online, data fresh
 * ● ORANGE  — GraphQL down but REST fallback (json.tarkov.dev) active
 * ● RED     — both sources offline
 * ● GREY    — status unknown / first load
 */
export function ApiStatus() {
  const [status, setStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get('/api/status/');
      setStatus(data);
      setLastChecked(new Date());
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const dot = (() => {
    if (!status) return { color: 'bg-gray-500', pulse: false, label: 'Checking...' };
    switch (status.overall) {
      case 'online':   return { color: 'bg-green-500',  pulse: true,  label: 'tarkov.dev Online' };
      case 'degraded': return { color: 'bg-orange-400', pulse: true,  label: 'tarkov.dev Degraded — Fallback active' };
      case 'offline':  return { color: 'bg-red-500',    pulse: false, label: 'tarkov.dev Offline' };
      default:         return { color: 'bg-gray-500',   pulse: false, label: 'Unknown' };
    }
  })();

  const formatTime = (isoString) => {
    if (!isoString) return 'never';
    const d = new Date(isoString);
    const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.round(diffMin / 60)}h ago`;
  };

  const tooltipLines = status ? [
    `GraphQL: ${status.sources?.graphql ?? '?'}`,
    `REST:    ${status.sources?.rest ?? '?'}`,
    `Last sync: ${formatTime(status.last_sync)}`,
    status.item_count ? `Items: ${status.item_count}` : null,
    status.last_error ? `⚠ ${status.last_error.slice(0, 60)}` : null,
  ].filter(Boolean) : ['Loading...'];

  return (
    <div className="group relative flex items-center gap-2 cursor-default select-none">
      {/* Dot */}
      <span className="relative flex h-3 w-3">
        {dot.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot.color} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${dot.color}`} />
      </span>

      {/* Label */}
      <span className="text-xs text-gray-400 hidden sm:inline">
        {dot.label}
      </span>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50
                      bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl
                      text-xs text-gray-300 whitespace-pre min-w-max">
        {tooltipLines.map((line, i) => (
          <div key={i} className={line.startsWith('⚠') ? 'text-red-400 mt-1' : ''}>
            {line}
          </div>
        ))}
        {lastChecked && (
          <div className="text-gray-500 mt-2 border-t border-gray-700 pt-1">
            Checked {formatTime(lastChecked.toISOString())}
          </div>
        )}
      </div>
    </div>
  );
}

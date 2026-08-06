import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MODE_LABELS = {
  regular: { label: 'PVP', emoji: '⚔️' },
  pve: { label: 'PVE', emoji: '🤖' },
  'pvp-season': { label: 'Seasonal', emoji: '❄️' },
};

function fmtTime(isoString) {
  if (!isoString) return 'jamais';
  const d = new Date(isoString);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'à l’instant';
  if (diffMin < 60) return `il y a ${diffMin}m`;
  return `il y a ${Math.round(diffMin / 60)}h`;
}

function fmtDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function ApiStatus() {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/status/');
      setStatus(data);
      setLastChecked(new Date());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const dot = (() => {
    if (!status) return { color: 'bg-gray-500', pulse: false, label: 'Vérification...' };
    switch (status.overall) {
      case 'online':   return { color: 'bg-green-500',  pulse: true,  label: 'tarkov.dev Online' };
      case 'degraded': return { color: 'bg-orange-400', pulse: true,  label: 'tarkov.dev Dégradé' };
      case 'offline':  return { color: 'bg-red-500',    pulse: false, label: 'tarkov.dev Offline' };
      default:         return { color: 'bg-gray-500',   pulse: false, label: 'Inconnu' };
    }
  })();

  const modes = Object.entries(MODE_LABELS);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-2 cursor-pointer select-none"
        title="Voir le statut détaillé"
      >
        <span className="relative flex h-3 w-3">
          {dot.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot.color} opacity-60`} />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${dot.color}`} />
        </span>

        <span className="text-xs text-gray-400 hidden sm:inline group-hover:text-tarkov-gold transition-colors">
          {dot.label}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-tarkov-card border border-tarkov-border rounded-xl shadow-2xl w-full max-w-5xl mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-tarkov-gold font-bold text-lg flex items-center gap-2">
                <span className={`inline-flex rounded-full h-2.5 w-2.5 ${dot.color}`} />
                Statut de synchronisation
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
              >×</button>
            </div>

            {status && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-xs">
                <div className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                  <div className="text-gray-400 mb-1">Statut global</div>
                  <div className={`font-semibold ${
                    status.overall === 'online' ? 'text-green-400' :
                    status.overall === 'degraded' ? 'text-orange-400' : 'text-red-400'
                  }`}>{status.overall ?? '—'}</div>
                </div>
                <div className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                  <div className="text-gray-400 mb-1">Dernière sync</div>
                  <div className="font-semibold text-white">{fmtDate(status.last_sync)}</div>
                  <div className="text-gray-500">{fmtTime(status.last_sync)}</div>
                </div>
                <div className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                  <div className="text-gray-400 mb-1">Items synchronisés</div>
                  <div className="font-semibold text-white">{status.items_synced?.toLocaleString('fr-FR') ?? '—'}</div>
                  <div className="text-gray-500">total cumulé</div>
                </div>
                <div className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                  <div className="text-gray-400 mb-1">Source API</div>
                  <div className="font-semibold text-white">{status.api_source_used ?? '—'}</div>
                  <div className="text-gray-500">check auto toutes les 30s</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {modes.map(([modeKey, meta]) => {
                const modeData = status?.modes?.[modeKey];
                return (
                  <div key={modeKey} className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="text-tarkov-gold font-semibold text-sm">{meta.label}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Statut</span>
                        <span className={`font-semibold ${
                          modeData?.status === 'success' ? 'text-green-400' :
                          modeData?.status === 'error' ? 'text-red-400' : 'text-gray-500'
                        }`}>{modeData?.status ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Items</span>
                        <span className="text-white">{modeData?.items_synced?.toLocaleString('fr-FR') ?? '—'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Dernière sync</span>
                        <span className="text-gray-300">{fmtTime(modeData?.last_sync)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-400">Durée</span>
                        <span className="text-gray-300">{modeData?.elapsed_seconds != null ? `${modeData.elapsed_seconds}s` : '—'}</span>
                      </div>
                      {modeData?.error && (
                        <div className="text-red-400 text-xs mt-1 break-all">⚠ {modeData.error.slice(0, 80)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {status?.sources && (
              <div className="flex gap-3 flex-wrap text-xs">
                <div className="bg-tarkov-bg rounded px-3 py-2 border border-tarkov-border flex gap-2 items-center">
                  <span className="text-gray-400">REST</span>
                  <span className={status.sources.rest === 'online' ? 'text-green-400' : status.sources.rest === 'degraded' ? 'text-orange-400' : 'text-red-400'}>
                    {status.sources.rest ?? '—'}
                  </span>
                </div>
                {lastChecked && (
                  <div className="bg-tarkov-bg rounded px-3 py-2 border border-tarkov-border text-gray-500">
                    Vérifié {fmtTime(lastChecked.toISOString())}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

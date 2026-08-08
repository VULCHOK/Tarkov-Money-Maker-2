import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useT } from '../hooks/useT';

// Literals instead of \uXXXX escapes — fixes display on Windows
const MODE_LABELS = {
  regular:      { label: 'PVP',         emoji: '⚔️' },
  pve:          { label: 'PVE',         emoji: '🤖' },
  'pvp-season': { label: 'Kord Breach', emoji: '❄️' },
};

function fmtTime(isoString, t) {
  if (!isoString) return t('apiStatusNever');
  const d = new Date(isoString);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1)  return t('apiStatusJustNow');
  const prefix = t('apiStatusTimeAgoPrefix');
  if (diffMin < 60) {
    return prefix
      ? `${prefix} ${diffMin}${t('apiStatusMinutesAgo')}`
      : `${diffMin}${t('apiStatusMinutesAgo')}`;
  }
  const hrs = Math.round(diffMin / 60);
  return prefix
    ? `${prefix} ${hrs}${t('apiStatusHoursAgo')}`
    : `${hrs}${t('apiStatusHoursAgo')}`;
}

function fmtDate(isoString, lang = 'en') {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString(lang, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function SyncCountdown({ nextSyncIso, fallbackIso, fallbackSecs = 600 }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const targetIso = nextSyncIso
      ?? (fallbackIso
        ? new Date(new Date(fallbackIso).getTime() + fallbackSecs * 1000).toISOString()
        : null);

    if (!targetIso) { setRemaining(null); return; }

    const tick = () => {
      const rem = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      setRemaining(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextSyncIso, fallbackIso, fallbackSecs]);

  if (remaining === null) return null;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const label = remaining === 0
    ? 'sync…'
    : `${m}:${String(s).padStart(2, '0')}`;

  return (
    <span
      className="text-[10px] text-gray-500 tabular-nums"
      title="Prochaine synchronisation des prix / Next price sync"
    >
      ⏱ {label}
    </span>
  );
}

export function ApiStatus({ pillBase = '', pillOff = '', lang = 'en' }) {
  const t = useT(lang);
  const [status, setStatus]           = useState(null);
  const [open, setOpen]               = useState(false);
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

  // Pause polling when tab is hidden — resume when visible again
  useEffect(() => {
    fetchStatus();
    let interval = setInterval(fetchStatus, 30_000);

    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchStatus();
        interval = setInterval(fetchStatus, 30_000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const dot = (() => {
    if (!status) return { color: 'bg-gray-500', pulse: false, label: t('apiStatusChecking') };
    switch (status.overall) {
      case 'online':   return { color: 'bg-green-500',  pulse: true,  label: t('apiStatusOnline') };
      case 'degraded': return { color: 'bg-orange-400', pulse: true,  label: t('apiStatusDegraded') };
      case 'offline':  return { color: 'bg-red-500',    pulse: false, label: t('apiStatusOffline') };
      default:         return { color: 'bg-gray-500',   pulse: false, label: t('apiStatusChecking') };
    }
  })();

  const nextSyncIso = status?.next_sync ?? null;
  const lastSyncIso = status?.last_sync
    ?? Object.values(status?.modes ?? {}).map((m) => m?.last_sync).filter(Boolean).sort().at(-1)
    ?? null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${pillBase} ${pillOff} flex items-center gap-1.5`}
        title={t('apiStatusTitle')}
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {dot.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot.color} opacity-60`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dot.color}`} />
        </span>
        <span>{dot.label}</span>
        <SyncCountdown nextSyncIso={nextSyncIso} fallbackIso={lastSyncIso} />
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
                {t('apiStatusTitle')}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {status && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-xs">
                {[{
                  label: t('apiStatusGlobal'),
                  value: status.overall ?? '—',
                  cls: status.overall === 'online' ? 'text-green-400' : status.overall === 'degraded' ? 'text-orange-400' : 'text-red-400',
                }, {
                  label: t('apiStatusLastSync'),
                  value: fmtDate(status.last_sync, lang),
                  sub:   fmtTime(status.last_sync, t),
                }, {
                  label: t('apiStatusItems'),
                  value: status.items_synced?.toLocaleString(lang) ?? '—',
                  sub:   t('apiStatusItemsSub'),
                }, {
                  label: t('apiStatusSource'),
                  value: status.api_source_used ?? '—',
                  sub:   t('apiStatusSourceSub'),
                }].map(({ label, value, sub, cls }) => (
                  <div key={label} className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                    <div className="text-gray-400 mb-1">{label}</div>
                    <div className={`font-semibold ${cls ?? 'text-white'}`}>{value}</div>
                    {sub && <div className="text-gray-500 text-[10px] mt-0.5">{sub}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {Object.entries(MODE_LABELS).map(([modeKey, meta]) => {
                const modeData = status?.modes?.[modeKey];
                return (
                  <div key={modeKey} className="bg-tarkov-bg rounded-lg p-3 border border-tarkov-border">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="text-tarkov-gold font-semibold text-sm">{meta.label}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        [t('apiStatusModeStatus'),   modeData?.status ?? 'N/A', modeData?.status === 'success' ? 'text-green-400' : modeData?.status === 'error' ? 'text-red-400' : 'text-gray-500'],
                        [t('apiStatusModeItems'),    modeData?.items_synced?.toLocaleString(lang) ?? '—', 'text-white'],
                        [t('apiStatusModeLastSync'), fmtTime(modeData?.last_sync, t), 'text-gray-300'],
                        [t('apiStatusModeDuration'), modeData?.elapsed_seconds != null ? `${modeData.elapsed_seconds}s` : '—', 'text-gray-300'],
                      ].map(([lbl, val, cls]) => (
                        <div key={lbl} className="flex justify-between gap-3">
                          <span className="text-gray-400">{lbl}</span>
                          <span className={cls}>{val}</span>
                        </div>
                      ))}
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
                  <span className="text-gray-400">{t('apiStatusRest')}</span>
                  <span className={status.sources.rest === 'online' ? 'text-green-400' : status.sources.rest === 'degraded' ? 'text-orange-400' : 'text-red-400'}>
                    {status.sources.rest ?? '—'}
                  </span>
                </div>
                {lastChecked && (
                  <div className="bg-tarkov-bg rounded px-3 py-2 border border-tarkov-border text-gray-500">
                    {t('apiStatusCheckedAt')} {fmtTime(lastChecked.toISOString(), t)}
                  </div>
                )}
                <div className="bg-tarkov-bg rounded px-3 py-2 border border-tarkov-border flex items-center gap-2 text-gray-500">
                  <span>{t('apiStatusNextSync') || 'Next sync'}</span>
                  <SyncCountdown nextSyncIso={nextSyncIso} fallbackIso={lastSyncIso} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

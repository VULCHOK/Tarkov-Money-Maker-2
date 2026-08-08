/**
 * Shared item utility functions.
 * Extracted from App.js to avoid defining helpers inside a React component.
 */

export const ALL_TRADERS_LIST = ['prapor','therapist','fence','skier','peacekeeper','mechanic','ragman','jaeger','ref'];

export function getItemName(item, lang = 'en') {
  try {
    const names = typeof item.names === 'string' ? JSON.parse(item.names) : (item.names || {});
    return names[lang] || names['en'] || item.normalized_name || item.id || '';
  } catch {
    return item.normalized_name || item.id || '';
  }
}

export function getItemShortName(item, lang = 'en') {
  try {
    const shorts = typeof item.short_names === 'string' ? JSON.parse(item.short_names) : (item.short_names || {});
    return shorts[lang] || shorts['en'] || '';
  } catch {
    return '';
  }
}

export function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function itemMatchesTag(item, tag, lang) {
  const q = normalize(tag);
  if (!q) return true;
  const name      = getItemName(item, lang);
  const shortName = getItemShortName(item, lang);
  return [name, shortName].some((f) => normalize(f).includes(q));
}

/**
 * Safe localStorage wrapper — silently fails in sandboxed iframes.
 */
export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, String(value)); } catch { /* sandboxed */ }
  },
};

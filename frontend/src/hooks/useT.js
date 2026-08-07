import { useMemo } from 'react';
import en from '../i18n/en';
import fr from '../i18n/fr';
import de from '../i18n/de';
import ru from '../i18n/ru';
import pl from '../i18n/pl';
import es from '../i18n/es';

const DICTS = { en, fr, de, ru, pl, es };

/**
 * Lightweight i18n hook.
 * Usage: const t = useT(lang);  then t('key')
 * Falls back to EN if the key is missing in the current language dict.
 *
 * Pour ajouter une langue :
 *   1. Créer frontend/src/i18n/{code}.js
 *   2. L'importer ici
 *   3. L'ajouter dans DICTS
 *   4. L'ajouter dans LANGS (App.js)
 *   5. L'ajouter dans LANG_CODES (tarkov_api.py)
 */
export function useT(lang) {
  return useMemo(() => {
    const dict = DICTS[lang] ?? DICTS.en;
    return (key) => dict[key] ?? DICTS.en[key] ?? key;
  }, [lang]);
}

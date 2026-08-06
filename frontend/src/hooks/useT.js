import { useMemo } from 'react';
import en from '../i18n/en';
import fr from '../i18n/fr';

const DICTS = { en, fr };

/**
 * Lightweight i18n hook.
 * Usage: const t = useT(lang);  then t('key')
 * Falls back to EN if the key is missing in the current language dict.
 */
export function useT(lang) {
  return useMemo(() => {
    const dict = DICTS[lang] ?? DICTS.en;
    return (key) => dict[key] ?? DICTS.en[key] ?? key;
  }, [lang]);
}

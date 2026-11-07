import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { en, type Dictionary } from './en';
import { ar } from './ar';
import { setContentLang } from '../lib/types';
import { setFormatLocale } from '../lib/format';

export type Lang = 'en' | 'ar';

const DICTIONARIES: Record<Lang, Dictionary> = { en, ar };
const STORAGE_KEY = 'foodbridge.lang';

type Vars = Record<string, string | number>;

function lookup(dict: unknown, path: string[]): string | undefined {
  let node: unknown = dict;
  for (const part of path) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

interface LanguageApi {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
  plural: (key: string, count: number, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageApi | null>(null);

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  // ?lang=ar / ?lang=en lets shared links open in the intended language.
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'ar' || fromUrl === 'en') {
    window.localStorage.setItem(STORAGE_KEY, fromUrl);
    return fromUrl;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'ar' ? 'ar' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.classList.toggle('is-rtl', lang === 'ar');
    window.localStorage.setItem(STORAGE_KEY, lang);
    setContentLang(lang);
    setFormatLocale(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const path = key.split('.');
      const value =
        lookup(DICTIONARIES[lang], path) ??
        lookup(DICTIONARIES.en, path) ??
        key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const plural = useCallback(
    (key: string, count: number, vars?: Vars) => {
      const suffix = count === 1 ? '_one' : '_other';
      return t(`${key}${suffix}`, { count, ...vars });
    },
    [t],
  );

  const value = useMemo<LanguageApi>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isRtl: lang === 'ar',
      setLang,
      t,
      plural,
    }),
    [lang, setLang, t, plural],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageApi {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}

/** Convenience hook for components that only need the translator. */
export function useT() {
  return useLang().t;
}

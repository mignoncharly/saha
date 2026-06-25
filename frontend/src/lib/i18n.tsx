"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  localeTag,
  normalizeLocale,
  translate,
  type Locale,
  type Translate,
  type TranslationValues,
} from "@/lib/i18n-config";

export { DEFAULT_LOCALE, LOCALES, localeTag, normalizeLocale, translate };
export type { Locale, Translate, TranslationValues };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${LOCALE_COOKIE_KEY}=`))
      ?.split("=")[1];
    setLocaleState(normalizeLocale(cookie || stored || navigator.language));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback(
    (key: string, values?: TranslationValues) => translate(locale, key, values),
    [locale]
  );

  const formatDate = useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(localeTag(locale), options).format(new Date(value)),
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(localeTag(locale), options).format(value),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatDate, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

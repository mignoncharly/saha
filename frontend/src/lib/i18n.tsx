"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Locale = "fr" | "en";

export const LOCALES: Locale[] = ["fr", "en"];
const STORAGE_KEY = "stl-locale";
const DEFAULT_LOCALE: Locale = "fr";

// Dictionaries. Only the chrome (header / footer / nav / notifications) is
// translated for now — page bodies are a follow-up. Add new keys here and
// reference them with t("section.key").
const dictionaries: Record<Locale, Record<string, string>> = {
  fr: {
    "nav.home": "Accueil",
    "nav.services": "Services",
    "nav.prices": "Tarifs",
    "nav.calendar": "Calendrier",
    "nav.pickup": "Ramassage",
    "nav.tracking": "Suivi",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "account.login": "Connexion",
    "account.myAccount": "Mon compte",
    "account.logout": "Déconnexion",
    "notif.enable": "Activer les notifications",
    "notif.enabled": "Notifications activées",
    "notif.unsupported": "Les notifications nécessitent une connexion sécurisée (HTTPS).",
    "notif.denied": "Notifications bloquées dans votre navigateur.",
    "notif.success": "Notifications activées avec succès.",
    "notif.error": "Impossible d'activer les notifications.",
    "footer.tagline": "Un colis, un sourire…",
    "footer.intro": "Transport vers le Cameroun depuis l'Europe.",
    "footer.usefulLinks": "Liens utiles",
    "footer.tracking": "Suivi de demande",
    "footer.privacy": "Confidentialité",
    "footer.contact": "Contact",
    "footer.whatsapp": "WhatsApp",
    "footer.via": "via WhatsApp",
    "footer.email": "Email",
    "footer.rights": "Tous droits réservés.",
    "lang.label": "Langue",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.prices": "Pricing",
    "nav.calendar": "Calendar",
    "nav.pickup": "Pickup",
    "nav.tracking": "Tracking",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "account.login": "Log in",
    "account.myAccount": "My account",
    "account.logout": "Log out",
    "notif.enable": "Enable notifications",
    "notif.enabled": "Notifications enabled",
    "notif.unsupported": "Notifications require a secure (HTTPS) connection.",
    "notif.denied": "Notifications are blocked in your browser.",
    "notif.success": "Notifications enabled successfully.",
    "notif.error": "Could not enable notifications.",
    "footer.tagline": "A parcel, a smile…",
    "footer.intro": "Shipping to Cameroon from Europe.",
    "footer.usefulLinks": "Useful links",
    "footer.tracking": "Track a request",
    "footer.privacy": "Privacy",
    "footer.contact": "Contact",
    "footer.whatsapp": "WhatsApp",
    "footer.via": "via WhatsApp",
    "footer.email": "Email",
    "footer.rights": "All rights reserved.",
    "lang.label": "Language",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key,
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

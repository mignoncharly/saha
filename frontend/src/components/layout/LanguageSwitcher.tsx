"use client";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { LOCALES, useTranslation, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const router = useRouter();

  const changeLocale = (code: Locale) => {
    setLocale(code);
    router.refresh();
  };

  return (
    <div
      className="inline-flex items-center gap-1 text-sm"
      role="group"
      aria-label={t("lang.label")}
    >
      <Globe className="h-4 w-4 text-gray-500" aria-hidden="true" />
      {LOCALES.map((code: Locale) => (
        <button
          key={code}
          type="button"
          onClick={() => changeLocale(code)}
          aria-pressed={locale === code}
          className={`px-1.5 py-0.5 rounded font-medium uppercase transition-colors ${
            locale === code
              ? "text-brand-blue font-bold"
              : "text-gray-500 hover:text-brand-blue"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE_KEY,
  localeTag,
  normalizeLocale,
  translate,
  type TranslationValues,
} from "@/lib/i18n-config";

export function getServerTranslation() {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE_KEY)?.value);
  return {
    locale,
    localeTag: localeTag(locale),
    t: (key: string, values?: TranslationValues) => translate(locale, key, values),
  };
}

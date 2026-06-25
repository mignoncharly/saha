import { WHATSAPP_NUMBER } from "./constants";
import type { Translate } from "./i18n-config";

/** wa.me requires the number in international format with digits only. */
function sanitizedNumber(): string {
  return WHATSAPP_NUMBER.replace(/[^\d]/g, "");
}

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${sanitizedNumber()}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildWhatsAppPrefill(reference: string, pickup: string, destination: string, t: Translate): string {
  const parts = [
    t("Bonjour STL, je viens de faire une demande de transport."),
    reference ? t("Référence: {reference}.", { reference }) : "",
    pickup ? t("Ville de ramassage: {pickup}.", { pickup }) : "",
    destination ? t("Destination: {destination}.", { destination }) : "",
  ].filter(Boolean);
  return whatsappLink(parts.join(" "));
}

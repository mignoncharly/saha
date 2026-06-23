import { WHATSAPP_NUMBER } from "./constants";

/** wa.me requires the number in international format with digits only. */
function sanitizedNumber(): string {
  return WHATSAPP_NUMBER.replace(/[^\d]/g, "");
}

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${sanitizedNumber()}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildWhatsAppPrefill(reference: string, pickup: string, destination: string): string {
  const parts = [
    "Bonjour STL, je viens de faire une demande de transport.",
    reference ? `Référence: ${reference}.` : "",
    pickup ? `Ville de ramassage: ${pickup}.` : "",
    destination ? `Destination: ${destination}.` : "",
  ].filter(Boolean);
  return whatsappLink(parts.join(" "));
}

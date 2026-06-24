export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+4917684440384";

/**
 * Static company facts used across marketing chrome (footer, contact).
 * These are the service areas STL covers, not backend-managed records.
 */
export const PICKUP_CITIES = [
  "Frankfurt",
  "Mainz",
  "Darmstadt",
  "Friedberg",
  "Mannheim",
  "Germersheim",
  "Kaiserslautern",
  "Strasbourg",
  "Offenburg",
  "Nancy",
  "Metz",
  "Thionville",
  "Saarland",
  "Forbach",
  "Luxembourg",
  "Stuttgart",
  "Pforzheim",
  "Heidelberg",
  "Karlsruhe",
  "Ludwigshafen",
] as const;

export const DELIVERY_CITIES = ["Douala", "Yaoundé", "Bafoussam"] as const;
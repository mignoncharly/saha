import { NextResponse } from "next/server";
import { getServerTranslation } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export function GET() {
  const { locale, t } = getServerTranslation();
  return NextResponse.json(
    {
      name: "SAHA Transport & Logistics",
      short_name: "STL",
      description: t("Transport de colis, fûts, véhicules et marchandises d'Europe vers le Cameroun."),
      lang: locale,
      dir: "ltr",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0A2540",
      theme_color: "#0A2540",
      categories: ["business", "travel", "productivity"],
      icons: [
        { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}

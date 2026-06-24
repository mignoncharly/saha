"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, MapPin, Mail, Truck } from "lucide-react";
import { PICKUP_CITIES, DELIVERY_CITIES } from "@/lib/constants";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const usefulLinks = [
    { href: "/services", label: t("nav.services") },
    { href: "/tarifs", label: t("nav.prices") },
    { href: "/calendrier", label: t("nav.calendar") },
    { href: "/demande", label: t("cta.request") },
    { href: "/suivi", label: t("footer.tracking") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/privacy", label: t("footer.privacy") },
  ];

  return (
    <footer className="bg-brand-navy text-navy-100">
      <div className="container-page grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Package className="h-5 w-5 text-brand-gold" />
            </span>
            SAHA Transport &amp; Logistics
          </div>
          <p className="mt-3 font-display text-brand-gold">{t("footer.tagline")}</p>
          <p className="mt-2 max-w-xs text-sm text-navy-200">{t("footer.intro")}</p>
          <div className="mt-5">
            <WhatsAppCTA className="!px-4 !py-2.5" />
          </div>
        </div>

        {/* Useful links */}
        <nav className="lg:col-span-2" aria-label={t("footer.usefulLinks")}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{t("footer.usefulLinks")}</h2>
          <ul className="space-y-2.5 text-sm">
            {usefulLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-navy-200 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Pickup zones */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
            <MapPin className="h-4 w-4 text-brand-gold" /> {t("footer.pickupZones")}
          </h2>
          <p className="text-sm leading-relaxed text-navy-200">{PICKUP_CITIES.join(" · ")}</p>
        </div>

        {/* Destinations + contact */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
            <Truck className="h-4 w-4 text-brand-gold" /> {t("footer.destinations")}
          </h2>
          <ul className="space-y-2 text-sm text-navy-200">
            {DELIVERY_CITIES.map((city) => (
              <li key={city} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" /> {city}
              </li>
            ))}
          </ul>
          <a
            href="mailto:info@gestionatech.de"
            className="mt-5 inline-flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4 text-brand-gold" /> info@gestionatech.de
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 pt-5 pb-24 text-xs text-navy-300 sm:flex-row lg:pb-5">
          <p>
            &copy; {new Date().getFullYear()} SAHA Transport &amp; Logistics. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-white">
              {t("footer.privacy")}
            </Link>
            <Link href="/admin/login" className="transition-colors hover:text-white">
              {t("footer.adminLogin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

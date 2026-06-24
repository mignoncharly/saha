"use client";
import Link from "next/link";
import { whatsappLink } from "@/lib/whatsapp";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-white font-bold text-lg mb-3">SAHA Transport & Logistics</h4>
          <p className="text-sm">{t("footer.tagline")}</p>
          <p className="text-sm mt-2">{t("footer.intro")}</p>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">{t("footer.usefulLinks")}</h5>
          <ul className="space-y-2 text-sm">
            <li><Link href="/services" className="hover:text-white">{t("nav.services")}</Link></li>
            <li><Link href="/tarifs" className="hover:text-white">{t("nav.prices")}</Link></li>
            <li><Link href="/calendrier" className="hover:text-white">{t("nav.calendar")}</Link></li>
            <li><Link href="/suivi" className="hover:text-white">{t("footer.tracking")}</Link></li>
            <li><Link href="/privacy" className="hover:text-white">{t("footer.privacy")}</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">{t("footer.contact")}</h5>
          <p className="text-sm">{t("footer.whatsapp")} : <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{t("footer.via")}</a></p>
          <p className="text-sm mt-2">{t("footer.email")} : contact@sahatransport.com</p>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs">
        &copy; {new Date().getFullYear()} SAHA Transport & Logistics. {t("footer.rights")} | <Link href="/privacy" className="underline">{t("footer.privacy")}</Link> | <Link href="/admin/login" className="underline hover:text-white">{t("footer.adminLogin")}</Link>
      </div>
    </footer>
  );
}

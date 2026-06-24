"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { useTranslation } from "@/lib/i18n";

export default function MobileBottomCTA() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Hidden on admin (own shell) and on the request form itself (avoid covering
  // the submit button with a duplicate CTA).
  if (pathname.startsWith("/admin") || pathname === "/demande") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white shadow-soft-lg lg:hidden">
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 bg-green-50 py-3 font-semibold text-green-700"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp
      </a>
      <Link
        href="/demande"
        className="flex flex-1 items-center justify-center gap-2 bg-brand-red py-3 font-semibold text-white"
      >
        <Truck className="h-5 w-5" />
        {t("nav.pickup")}
      </Link>
    </div>
  );
}

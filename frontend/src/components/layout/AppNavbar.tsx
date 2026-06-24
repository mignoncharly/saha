"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Package } from "lucide-react";
import NavLink from "@/components/layout/NavLink";
import UserDropdown from "@/components/layout/UserDropdown";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { mainNav } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n";

export default function AppNavbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Admin routes have their own shell (sidebar/topbar) — no public navbar there.
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-brand-blue">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white">
            <Package className="h-5 w-5 text-brand-gold" />
          </span>
          <span>STL</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navigation principale">
          {mainNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link href="/demande" className="btn-primary !px-4 !py-2">
            {t("cta.request")}
          </Link>
          <UserDropdown />
          <LanguageSwitcher />
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <WhatsAppCTA className="!px-3 !py-2" iconOnly />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        </div>
      </header>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

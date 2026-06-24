"use client";
import Link from "next/link";
import { Menu, X, Package, User, LogOut } from "lucide-react";
import { useState } from "react";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/services", labelKey: "nav.services" },
  { href: "/tarifs", labelKey: "nav.prices" },
  { href: "/calendrier", labelKey: "nav.calendar" },
  { href: "/demande", labelKey: "nav.pickup" },
  { href: "/suivi", labelKey: "nav.tracking" },
  { href: "/faq", labelKey: "nav.faq" },
  { href: "/contact", labelKey: "nav.contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold text-brand-blue">
          <Package className="h-8 w-8 text-brand-gold" />
          <span>STL</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">
              {t(link.labelKey)}
            </Link>
          ))}
          <Link
            href={user ? "/compte" : "/compte/connexion"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors"
          >
            <User className="h-4 w-4" />
            {user ? t("account.myAccount") : t("account.login")}
          </Link>
          <div className="ml-1">
            <NotificationPermissionButton />
          </div>
          <LanguageSwitcher />
        </nav>

        <button
          className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-base font-medium text-gray-700 hover:text-brand-blue"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <Link
              href={user ? "/compte" : "/compte/connexion"}
              className="flex items-center gap-2 py-2 text-base font-medium text-gray-700 hover:text-brand-blue"
              onClick={() => setMobileOpen(false)}
            >
              <User className="h-5 w-5" />
              {user ? t("account.myAccount") : t("account.login")}
            </Link>
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 py-2 text-base font-medium text-gray-700 hover:text-brand-blue"
              >
                <LogOut className="h-5 w-5" />
                {t("account.logout")}
              </button>
            )}
            <div className="py-2">
              <NotificationPermissionButton />
            </div>
            <div className="py-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

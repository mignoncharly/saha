"use client";
import Link from "next/link";
import { Menu, X, Package } from "lucide-react";
import { useState } from "react";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/demande", label: "Ramassage" },
  { href: "/suivi", label: "Suivi" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              {link.label}
            </Link>
          ))}
          <div className="ml-2">
            <NotificationPermissionButton />
          </div>
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
                {link.label}
              </Link>
            ))}
            <div className="py-2">
              <NotificationPermissionButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
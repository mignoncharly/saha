"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminNav, isActivePath } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n";

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    router.push("/admin/login");
  };

  return (
    <div className="flex h-full flex-col bg-brand-navy text-navy-100">
      <div className="flex items-center gap-2 px-5 py-5 font-display text-lg font-bold text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <Package className="h-5 w-5 text-brand-gold" />
        </span>
        STL Admin
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label={t("Navigation admin")}>
        {adminNav.map((link) => {
          const Icon = link.icon;
          const active = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-brand-blue text-white" : "text-navy-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-5 w-5" /> {t("Voir le site public")}
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5" /> {t("Déconnexion")}
        </button>
      </div>
    </div>
  );
}

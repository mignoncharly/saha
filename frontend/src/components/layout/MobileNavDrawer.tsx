"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  X,
  User,
  Truck,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
  Download,
} from "lucide-react";
import NavLink from "@/components/layout/NavLink";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { mainNav, resolveRole } from "@/lib/navigation";
import { useAuth, userDisplayName } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { canInstall, promptInstall } = useInstallPrompt();
  const role = resolveRole(user?.role);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/");
  };

  const rowClass = "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100";

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-soft-lg animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <span className="font-display text-lg font-bold text-brand-blue">Menu</span>
          <button onClick={onClose} aria-label="Fermer le menu" className="rounded-md p-2 text-gray-600 hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.href} href={item.href} variant="drawer" onClick={onClose}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
          </div>

          <div className="my-4 border-t border-gray-100" />

          {/* Account section */}
          {!user && (
            <div className="space-y-1">
              <Link href="/compte/connexion" onClick={onClose} className={rowClass}>
                <LogIn className="h-5 w-5" /> {t("account.login")}
              </Link>
              <Link href="/compte/inscription" onClick={onClose} className={rowClass}>
                <UserPlus className="h-5 w-5" /> {t("account.register")}
              </Link>
              <Link href="/suivi" onClick={onClose} className={rowClass}>
                <Truck className="h-5 w-5" /> {t("nav.tracking")}
              </Link>
            </div>
          )}

          {user && role === "customer" && (
            <div className="space-y-1">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {userDisplayName(user, t("account.mySpace"))}
              </p>
              <Link href="/compte" onClick={onClose} className={rowClass}>
                <User className="h-5 w-5" /> {t("account.mySpace")}
              </Link>
              <Link href="/suivi" onClick={onClose} className={rowClass}>
                <Truck className="h-5 w-5" /> {t("account.myRequests")}
              </Link>
              <div className="px-3 py-2">
                <NotificationPermissionButton className="w-full justify-center" />
              </div>
            </div>
          )}

          {user && role === "admin" && (
            <div className="space-y-1">
              <Link href="/admin/dashboard" onClick={onClose} className={rowClass}>
                <LayoutDashboard className="h-5 w-5" /> {t("account.adminDashboard")}
              </Link>
            </div>
          )}

          {canInstall && (
            <button
              type="button"
              onClick={() => {
                promptInstall();
                onClose();
              }}
              className={`${rowClass} w-full`}
            >
              <Download className="h-5 w-5" /> {t("account.install")}
            </button>
          )}

          {user && (
            <button type="button" onClick={handleLogout} className={`${rowClass} w-full`}>
              <LogOut className="h-5 w-5" /> {t("account.logout")}
            </button>
          )}
        </nav>

        <div className="space-y-3 border-t border-gray-100 p-4">
          <Link href="/demande" onClick={onClose} className="btn-primary w-full">
            {t("cta.request")}
          </Link>
          <WhatsAppCTA className="w-full" />
          <div className="flex justify-center pt-1">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}

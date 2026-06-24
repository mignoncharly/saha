"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  User,
  ChevronDown,
  LayoutDashboard,
  Truck,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Download,
} from "lucide-react";
import { useAuth, userDisplayName } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { resolveRole } from "@/lib/navigation";

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { canInstall, promptInstall } = useInstallPrompt();
  const { unread } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const role = resolveRole(user?.role);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    router.push("/");
  };

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-brand-blue"
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
          <User className="h-3.5 w-3.5" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-red ring-2 ring-white" aria-label={`${unread} non lues`} />}
        </span>
        {user && role === "admin" ? (
          <span className="badge bg-brand-gold/15 font-semibold text-brand-gold">Admin</span>
        ) : (
          <span className="max-w-[8rem] truncate">
            {user ? userDisplayName(user, t("account.myAccount")) : t("account.login")}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right animate-fade-in rounded-xl border border-gray-100 bg-white p-2 shadow-soft-lg"
        >
          {!user && (
            <>
              <Link href="/compte/connexion" onClick={close} className={itemClass} role="menuitem">
                <LogIn className="h-4 w-4" /> {t("account.login")}
              </Link>
              <Link href="/compte/inscription" onClick={close} className={itemClass} role="menuitem">
                <UserPlus className="h-4 w-4" /> {t("account.register")}
              </Link>
              <Link href="/suivi" onClick={close} className={itemClass} role="menuitem">
                <Truck className="h-4 w-4" /> {t("nav.tracking")}
              </Link>
            </>
          )}

          {user && role === "customer" && (
            <>
              <div className="px-3 pb-2 pt-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {userDisplayName(user, t("account.mySpace"))}
                </p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <Link href="/compte" onClick={close} className={itemClass} role="menuitem">
                <User className="h-4 w-4" /> {t("account.mySpace")}
              </Link>
              <Link href="/suivi" onClick={close} className={itemClass} role="menuitem">
                <Truck className="h-4 w-4" /> {t("account.myRequests")}
              </Link>
              <Link href="/compte/notifications" onClick={close} className={itemClass} role="menuitem">
                <Bell className="h-4 w-4" /> Notifications
                {unread > 0 && <span className="ml-auto badge bg-brand-red text-white">{unread}</span>}
              </Link>
            </>
          )}

          {user && role === "admin" && (
            <>
              <div className="px-3 pb-2 pt-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="badge bg-brand-gold/15 text-brand-gold">Admin</span>
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <Link href="/admin/dashboard" onClick={close} className={itemClass} role="menuitem">
                <LayoutDashboard className="h-4 w-4" /> {t("account.adminDashboard")}
              </Link>
            </>
          )}

          {canInstall && (
            <button
              type="button"
              onClick={() => {
                promptInstall();
                close();
              }}
              className={itemClass}
              role="menuitem"
            >
              <Download className="h-4 w-4" /> {t("account.install")}
            </button>
          )}

          {user && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button type="button" onClick={handleLogout} className={itemClass} role="menuitem">
                <LogOut className="h-4 w-4" /> {t("account.logout")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

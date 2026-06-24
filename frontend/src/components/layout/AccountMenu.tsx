"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Truck, LogOut } from "lucide-react";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";
import { useTranslation } from "@/lib/i18n";
import { useAuth, userDisplayName } from "@/hooks/useAuth";

export default function AccountMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors"
      >
        <User className="h-4 w-4" />
        <span className="max-w-[10rem] truncate">{user ? userDisplayName(user, t("account.myAccount")) : t("account.login")}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-lg border border-gray-100 bg-white shadow-lg p-2 z-50"
        >
          <Link
            href={user ? "/compte" : "/compte/connexion"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            role="menuitem"
          >
            <User className="h-4 w-4" />
            {user ? t("account.myAccount") : t("account.login")}
          </Link>
          <Link
            href="/suivi"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            role="menuitem"
          >
            <Truck className="h-4 w-4" />
            {t("nav.tracking")}
          </Link>
          <div className="px-1 py-1" role="menuitem">
            <NotificationPermissionButton className="w-full justify-center" />
          </div>
          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              {t("account.logout")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

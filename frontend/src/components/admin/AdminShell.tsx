"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { adminNav, isActivePath } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = adminNav.find((l) => isActivePath(pathname, l.href));
  const title = current ? t(current.labelKey) : t("Administration");

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Menu admin")}>
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] animate-slide-in-right">
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            aria-label={t("Ouvrir le menu")}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="flex-1 truncate text-lg font-bold text-gray-900">{title}</h1>
          {user && (
            <div className="hidden items-center gap-2 text-sm text-gray-600 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold uppercase text-brand-blue">
                A
              </span>
              <span className="badge bg-brand-gold/15 font-semibold text-brand-gold">Admin</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

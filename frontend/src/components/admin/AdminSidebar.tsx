"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, DollarSign, Calendar, Truck, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Demandes", icon: ClipboardList },
  { href: "/admin/prices", label: "Tarifs", icon: DollarSign },
  { href: "/admin/schedules", label: "Ramassages", icon: Calendar },
  { href: "/admin/loading-dates", label: "Chargements", icon: Truck },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      <div className="text-xl font-bold mb-8">STL Admin</div>
      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-brand-blue text-white" : "hover:bg-gray-800 text-gray-300"}`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white mt-auto"
      >
        <LogOut className="h-4 w-4" /> Déconnexion
      </button>
    </aside>
  );
}
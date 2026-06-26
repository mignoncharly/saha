import {
  Home,
  Package,
  Tag,
  CalendarDays,
  Truck,
  HelpCircle,
  Phone,
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Bell,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export type Role = "guest" | "customer" | "admin";

/** Map the backend user role string to a UI role bucket. */
export function resolveRole(role?: string | null): Role {
  if (role === "admin" || role === "staff") return "admin";
  if (role === "customer") return "customer";
  return "guest";
}

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

/**
 * Primary public navigation, shown to everyone in the top bar. Role-specific
 * destinations (Mon espace, Mes demandes, Tableau de bord, Notifications…)
 * live in the user dropdown, not the main bar.
 */
export const mainNav: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/services", labelKey: "nav.services", icon: Package },
  { href: "/tarifs", labelKey: "nav.prices", icon: Tag },
  { href: "/calendrier", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/demande", labelKey: "nav.pickup", icon: Truck },
  { href: "/faq", labelKey: "nav.faq", icon: HelpCircle },
  { href: "/contact", labelKey: "nav.contact", icon: Phone },
];

/** Admin area navigation (used by the admin shell sidebar/topbar). */
export const adminNav: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "admin.dashboard", icon: LayoutDashboard },
  { href: "/admin/requests", labelKey: "admin.requests", icon: ClipboardList },
  { href: "/admin/services", labelKey: "admin.services", icon: Boxes },
  { href: "/admin/prices", labelKey: "admin.prices", icon: DollarSign },
  { href: "/admin/schedules", labelKey: "admin.pickups", icon: CalendarDays },
  { href: "/admin/loading-dates", labelKey: "admin.loadings", icon: Truck },
  { href: "/admin/notifications", labelKey: "admin.notifications", icon: Bell },
];

/** True for a path that is the active route (exact for "/", prefix otherwise). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

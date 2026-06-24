import {
  Home,
  Package,
  Tag,
  CalendarDays,
  Truck,
  HelpCircle,
  Phone,
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

/** True for a path that is the active route (exact for "/", prefix otherwise). */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

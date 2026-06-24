"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isActivePath } from "@/lib/navigation";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  /** "bar" for the desktop top bar, "drawer" for the mobile menu rows. */
  variant?: "bar" | "drawer";
  className?: string;
}

export default function NavLink({ href, children, onClick, variant = "bar", className = "" }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  if (variant === "drawer") {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
          active ? "bg-brand-blue/10 text-brand-blue" : "text-gray-700 hover:bg-gray-100"
        } ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative px-1 py-1.5 text-sm font-medium transition-colors ${
        active ? "text-brand-blue" : "text-gray-700 hover:text-brand-blue"
      } ${className}`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-brand-gold transition-transform ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </Link>
  );
}

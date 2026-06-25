"use client";
import Link from "next/link";
import { ArrowRight, Package, Drum, Car, HelpCircle, Boxes, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// Resolve the API-provided icon key to a component here, on the client, so a
// Server Component parent never passes an icon function across the RSC boundary.
const iconMap: Record<string, LucideIcon> = {
  package: Package,
  barrel: Drum,
  cube: Boxes,
  car: Car,
  "help-circle": HelpCircle,
};

interface Props {
  name: string;
  description: string;
  /** API icon key (e.g. "package", "barrel"); resolved to a lucide icon. */
  icon: string;
  /** Optional CTA to the request form for this service. */
  href?: string;
  ctaLabel?: string;
}

export default function ServiceCard({ name, description, icon, href, ctaLabel }: Props) {
  const { t } = useTranslation();
  const Icon = iconMap[icon] ?? HelpCircle;
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{name}</h3>
      <p className="mt-2 flex-1 text-sm text-gray-600">{description}</p>
      {href && (
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:gap-2.5"
        >
          {ctaLabel || t("Demander ce transport")} <ArrowRight className="h-4 w-4 transition-all" />
        </Link>
      )}
    </div>
  );
}

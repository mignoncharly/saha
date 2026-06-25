"use client";

import { useTranslation } from "@/lib/i18n";

interface StatusMeta {
  label: string;
  className: string;
}

// Mirrors the backend status keys (apps.logistics status choices).
const STATUS_MAP: Record<string, StatusMeta> = {
  new: { label: "Nouveau", className: "bg-blue-50 text-blue-700" },
  contacted: { label: "Contacté", className: "bg-indigo-50 text-indigo-700" },
  confirmed: { label: "Confirmé", className: "bg-emerald-50 text-emerald-700" },
  pickup_scheduled: { label: "Ramassage planifié", className: "bg-amber-50 text-amber-700" },
  received: { label: "Reçu", className: "bg-cyan-50 text-cyan-700" },
  loaded: { label: "Chargé", className: "bg-violet-50 text-violet-700" },
  in_transit: { label: "En route", className: "bg-orange-50 text-orange-700" },
  arrived_cameroon: { label: "Arrivé au Cameroun", className: "bg-teal-50 text-teal-700" },
  delivered: { label: "Livré", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", className: "bg-red-50 text-red-700" },
};

export function statusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}

export default function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const { t } = useTranslation();
  const meta = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`badge ${meta.className} ${className}`}>{t(meta.label)}</span>;
}

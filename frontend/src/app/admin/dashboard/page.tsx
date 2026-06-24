"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import AdminCharts from "@/components/admin/AdminCharts";
import { ClipboardList, Sparkles, CheckCircle, Plus, CalendarPlus, Bell, ArrowRight } from "lucide-react";

const quickLinks = [
  { href: "/admin/requests", label: "Voir les demandes", icon: ClipboardList },
  { href: "/admin/prices", label: "Ajouter un tarif", icon: Plus },
  { href: "/admin/schedules", label: "Ajouter une tournée", icon: CalendarPlus },
  { href: "/admin/notifications", label: "Envoyer une notification", icon: Bell },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get<DashboardStats>("/admin/dashboard/")
      .then(setStats)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Total demandes", value: stats.total_requests, icon: ClipboardList, accent: "bg-blue-100 text-blue-700" },
        { label: "Nouvelles", value: stats.new_requests, icon: Sparkles, accent: "bg-amber-100 text-amber-700" },
        { label: "Confirmées", value: stats.confirmed_requests, icon: CheckCircle, accent: "bg-green-100 text-green-700" },
      ]
    : [];

  return (
    <AdminLayout>
      {loading ? (
        <LoadingState label="Chargement des statistiques…" />
      ) : failed || !stats ? (
        <ErrorState message="Impossible de charger les statistiques." />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white p-4 text-sm font-medium text-gray-800 shadow-card transition-shadow hover:shadow-soft"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-brand-blue" /> {label}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>

          <AdminCharts stats={stats} />
        </div>
      )}
    </AdminLayout>
  );
}

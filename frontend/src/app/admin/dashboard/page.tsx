"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import type { DashboardNotificationFailure, DashboardStats } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import AdminCharts from "@/components/admin/AdminCharts";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CalendarPlus,
  CheckCircle,
  ClipboardList,
  MailWarning,
  Plus,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AdminDashboardPage() {
  const { t, formatDate, formatNumber } = useTranslation();
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
        { label: t("Total demandes"), value: stats.total_requests, icon: ClipboardList, accent: "bg-blue-100 text-blue-700" },
        { label: t("Nouvelles"), value: stats.new_requests, icon: Sparkles, accent: "bg-amber-100 text-amber-700" },
        { label: t("Confirmées"), value: stats.confirmed_requests, icon: CheckCircle, accent: "bg-green-100 text-green-700" },
      ]
    : [];
  const quickLinks = [
    { href: "/admin/requests", label: t("Voir les demandes"), icon: ClipboardList },
    { href: "/admin/prices", label: t("Ajouter un tarif"), icon: Plus },
    { href: "/admin/schedules", label: t("Ajouter une tournée"), icon: CalendarPlus },
    { href: "/admin/notifications", label: t("Envoyer une notification"), icon: Bell },
  ];

  const opsCards = stats
    ? [
        {
          label: t("Échecs push (30j)"),
          value: stats.ops.failed_notifications_30d,
          icon: AlertTriangle,
          accent: "bg-red-100 text-red-700",
        },
        {
          label: t("Journaux en échec (30j)"),
          value: stats.ops.failed_notification_logs_30d,
          icon: MailWarning,
          accent: "bg-amber-100 text-amber-700",
        },
        {
          label: t("Abonnements inactifs"),
          value: stats.ops.inactive_push_subscriptions,
          icon: BellOff,
          accent: "bg-gray-100 text-gray-700",
        },
      ]
    : [];

  const targetLabel = (log: DashboardNotificationFailure) => {
    if (log.target_type === "region") return log.target_region ? `${t("Région")} - ${log.target_region}` : t("Région");
    if (log.target_type === "request_status") return t("Mise à jour de statut");
    return t("Tous les abonnés");
  };

  return (
    <AdminLayout>
      {loading ? (
        <LoadingState label={t("Chargement des statistiques…")} />
      ) : failed || !stats ? (
        <ErrorState message={t("Impossible de charger les statistiques.")} />
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
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("Actions rapides")}</h2>
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

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t("Surveillance opérations")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {opsCards.map(({ label, value, icon: Icon, accent }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-card">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="text-xl font-semibold text-gray-900">{formatNumber(value)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">{t("Échecs récents de notifications")}</h3>
                <Link href="/admin/notifications" className="text-sm font-medium text-brand-blue hover:underline">
                  {t("Notifications")}
                </Link>
              </div>
              {stats.ops.recent_failed_notifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">{t("Notification")}</th>
                        <th className="px-4 py-2 text-left font-semibold">{t("Cible")}</th>
                        <th className="px-4 py-2 text-left font-semibold">{t("Échecs")}</th>
                        <th className="px-4 py-2 text-left font-semibold">{t("Envoyées")}</th>
                        <th className="px-4 py-2 text-left font-semibold">{t("Date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ops.recent_failed_notifications.map((log) => (
                        <tr key={log.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">{log.title}</td>
                          <td className="px-4 py-3 text-gray-600">{targetLabel(log)}</td>
                          <td className="px-4 py-3 font-semibold text-red-700">{formatNumber(log.failed_count)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatNumber(log.sent_count)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(log.created_at, { dateStyle: "medium", timeStyle: "short" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-6 text-sm text-gray-500">{t("Aucun échec récent de notification.")}</p>
              )}
            </div>
          </section>

          <AdminCharts stats={stats} />
        </div>
      )}
    </AdminLayout>
  );
}

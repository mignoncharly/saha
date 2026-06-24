"use client";
import { useAuth, userDisplayName } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Truck, Package, Bell, CalendarDays, ArrowRight, MailWarning, LogOut, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { TransportRequestListItem } from "@/types/request";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";

const quickActions = [
  { href: "/demande", label: "Demander un ramassage", icon: Truck, accent: "bg-brand-red/10 text-brand-red" },
  { href: "/suivi", label: "Mes demandes", icon: Package, accent: "bg-brand-blue/10 text-brand-blue" },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays, accent: "bg-brand-gold/10 text-brand-gold" },
];

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<TransportRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/compte/connexion");
      return;
    }
    setLoading(true);
    api
      .get<TransportRequestListItem[]>("/transport-requests/my-requests/")
      .then(setRequests)
      .catch(() => setError("Impossible de charger vos demandes."))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification/", {});
      toast.success("Email de vérification renvoyé.");
    } catch {
      toast.error("Impossible de renvoyer l'email pour le moment.");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (authLoading || !user) return <LoadingState fullPage />;

  const recent = requests.slice(0, 5);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-blue to-navy-900 text-white">
        <div className="container-page flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-blue-100">Bienvenue,</p>
            <h1 className="font-display text-3xl font-bold capitalize">{userDisplayName(user, "Mon espace")}</h1>
            <p className="mt-1 text-sm text-blue-100">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/demande" className="btn-primary !px-5 !py-2.5">
              <Plus className="h-4 w-4" /> Nouvelle demande
            </Link>
            <button onClick={handleLogout} className="btn !border !border-white/30 !bg-transparent !text-white hover:!bg-white/10">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </section>

      <div className="container-page space-y-10 py-10">
        {/* Email verification banner */}
        {user.email_verified === false && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Vérifiez votre adresse email</p>
                <p className="text-sm text-amber-800">Confirmez votre email pour sécuriser votre compte.</p>
              </div>
            </div>
            <button onClick={resendVerification} disabled={resending} className="btn-secondary shrink-0">
              {resending ? "Envoi…" : "Renvoyer l'email"}
            </button>
          </div>
        )}

        {/* Quick actions */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Actions rapides</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {quickActions.map(({ href, label, icon: Icon, accent }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft"
              >
                <span className="flex items-center gap-3 font-semibold text-gray-900">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </span>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* Recent requests */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Mes demandes récentes</h2>
            {requests.length > 0 && (
              <Link href="/suivi" className="text-sm font-semibold text-brand-blue hover:underline">
                Tout voir
              </Link>
            )}
          </div>

          {loading ? (
            <LoadingState label="Chargement de vos demandes…" />
          ) : error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Package className="h-7 w-7" />}
              title="Aucune demande pour le moment"
              description="Faites votre première demande de ramassage et suivez-la ici."
              action={<Link href="/demande" className="btn-primary">Demander un ramassage</Link>}
            />
          ) : (
            <div className="space-y-3">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/suivi?ref=${r.reference_code}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-semibold text-gray-900">{r.reference_code}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {r.pickup_city}
                    {r.destination_name ? ` → ${r.destination_name}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Notifications</h2>
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                <Bell className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Alertes de ramassage</p>
                <p className="text-sm text-gray-600">
                  Activez les notifications push et gérez vos préférences et votre historique.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <NotificationPermissionButton />
              <Link href="/compte/notifications" className="btn-secondary">
                Gérer
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

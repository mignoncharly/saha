"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft, MapPin, CalendarDays, Package, Truck } from "lucide-react";
import { api } from "@/lib/api";
import type { TransportRequest, TransportRequestListItem } from "@/types/request";
import StatusTimeline from "@/components/public/StatusTimeline";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge, { statusLabel } from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { resolveRole } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n";

function SuiviInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t, formatDate } = useTranslation();
  const role = resolveRole(user?.role);
  const initialRef = searchParams.get("ref") || "";

  const [ref, setRef] = useState(initialRef);
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer "my requests"
  const [myRequests, setMyRequests] = useState<TransportRequestListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Admins manage requests in the admin area.
  useEffect(() => {
    if (!authLoading && role === "admin") router.replace("/admin/requests");
  }, [authLoading, role, router]);

  const doSearch = useCallback(async (reference: string) => {
    const trimmed = reference.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<TransportRequest>(`/transport-requests/${trimmed}/`);
      setRequest(data);
    } catch {
      setError(t("Demande introuvable. Vérifiez le numéro de référence."));
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (initialRef) doSearch(initialRef);
  }, [initialRef, doSearch]);

  // Load the customer's own requests when logged in and not viewing a single ref.
  useEffect(() => {
    if (!authLoading && role === "customer" && !initialRef) {
      setListLoading(true);
      api
        .get<TransportRequestListItem[]>("/transport-requests/my-requests/")
        .then(setMyRequests)
        .catch(() => setMyRequests([]))
        .finally(() => setListLoading(false));
    }
  }, [authLoading, role, initialRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(ref);
  };

  const backToList = () => {
    setRequest(null);
    setError(null);
    setRef("");
    router.push("/suivi");
  };

  if (role === "admin") return <LoadingState fullPage label={t("Redirection…")} />;

  const statuses = ["all", ...Array.from(new Set(myRequests.map((r) => r.status)))];
  const filtered = statusFilter === "all" ? myRequests : myRequests.filter((r) => r.status === statusFilter);

  // ---- Single-request detail view (guest lookup or customer drill-in) ----
  const showDetail = !!request || (!!initialRef && (loading || !!error));

  return (
    <>
      <PageHeader
        hero
        icon={<Truck className="h-8 w-8" />}
        title={t("Suivi de demande")}
        subtitle={
          role === "customer"
            ? t("Retrouvez vos demandes et suivez leur avancement.")
            : t("Entrez votre numéro de référence pour suivre l'état de votre envoi.")
        }
      />

      <div className="container-page max-w-3xl py-12">
        {showDetail ? (
          <div>
            <button onClick={backToList} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline">
              <ArrowLeft className="h-4 w-4" /> {role === "customer" ? t("Mes demandes") : t("Nouvelle recherche")}
            </button>

            {loading && <LoadingState label={t("Recherche en cours…")} />}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

            {request && (
              <div className="card space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-xl font-bold text-gray-900">{request.reference_code}</h2>
                    {request.customer?.full_name && (
                      <p className="text-sm text-gray-500">{t("Client : {name}", { name: request.customer.full_name })}</p>
                    )}
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-brand-light p-4">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold text-gray-700">
                      <MapPin className="h-4 w-4 text-brand-gold" /> {t("Ramassage")}
                    </p>
                    <p className="text-gray-600">{request.pickup_city}</p>
                    <p className="text-gray-500">{request.pickup_address}</p>
                    {request.preferred_pickup_date && (
                      <p className="mt-1 flex items-center gap-1.5 text-gray-500">
                        <CalendarDays className="h-4 w-4" /> {request.preferred_pickup_date}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-brand-light p-4">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold text-gray-700">
                      <Truck className="h-4 w-4 text-brand-gold" /> {t("Destination")}
                    </p>
                    <p className="text-gray-600">{request.destination_city?.name || "—"}</p>
                    {request.service_type?.name && (
                      <p className="mt-1 flex items-center gap-1.5 text-gray-500">
                        <Package className="h-4 w-4" /> {request.service_type.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">{t("État d'avancement")}</h3>
                  <StatusTimeline currentStatus={request.status} />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <WhatsAppCTA reference={request.reference_code} pickup={request.pickup_city} destination={request.destination_city?.name} />
                </div>
              </div>
            )}
          </div>
        ) : role === "customer" ? (
          // ---- Customer: list of own requests ----
          <div>
            {listLoading ? (
              <LoadingState label={t("Chargement de vos demandes…")} />
            ) : myRequests.length === 0 ? (
              <EmptyState
                icon={<Package className="h-7 w-7" />}
                title={t("Aucune demande pour le moment")}
                description={t("Faites votre première demande de ramassage et suivez-la ici.")}
                action={<Link href="/demande" className="btn-primary">{t("cta.request")}</Link>}
              />
            ) : (
              <>
                {statuses.length > 2 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          statusFilter === s ? "bg-brand-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s === "all" ? t("Toutes") : t(statusLabel(s))}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {filtered.map((r) => (
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
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(r.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // ---- Guest: track by reference ----
          <div>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder={t("Ex: STL-2026-000123")}
                aria-label={t("Numéro de référence")}
                className="input flex-1"
              />
              <button type="submit" className="btn-primary !px-6" disabled={loading} aria-label={t("Rechercher")}>
                {loading ? <LoadingSpinner className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-400">
              {t("Le suivi public affiche une seule demande à la fois via son numéro de référence.")}
            </p>
            {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
          </div>
        )}
      </div>
    </>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<LoadingState fullPage />}>
      <SuiviInner />
    </Suspense>
  );
}

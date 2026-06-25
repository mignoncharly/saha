"use client";
import { useState, useEffect, useCallback } from "react";
import { api, downloadFile } from "@/lib/api";
import type { TransportRequestListItem } from "@/types/request";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, CheckSquare, Square, Inbox } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Filters {
  status: string[];
  pickup_city: string;
  service_type: string;
  date_from: string;
  date_to: string;
  search: string;
}

interface Props {
  filters: Filters;
}

const BULK_OPTIONS = [
  { value: "contacted", label: "Marquer comme contacté" },
  { value: "confirmed", label: "Confirmer" },
  { value: "pickup_scheduled", label: "Ramassage planifié" },
  { value: "received", label: "Marquer reçu" },
  { value: "loaded", label: "Marquer chargé" },
  { value: "in_transit", label: "En route" },
  { value: "arrived_cameroon", label: "Arrivé au Cameroun" },
  { value: "delivered", label: "Livré" },
  { value: "cancelled", label: "Annuler" },
];

export default function AdminRequestTable({ filters }: Props) {
  const { t, formatDate } = useTranslation();
  const [requests, setRequests] = useState<TransportRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const pageSize = 15;

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status.length > 0) filters.status.forEach((s) => params.append("status", s));
    if (filters.pickup_city) params.set("pickup_city", filters.pickup_city);
    if (filters.service_type) params.set("service_type", filters.service_type);
    if (filters.date_from) params.set("created_at_gte", filters.date_from);
    if (filters.date_to) params.set("created_at_lte", filters.date_to);
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    setLoading(true);
    api
      .get<any>(`/admin/requests/?${params.toString()}`)
      .then((res) => {
        setRequests(res.results || res);
        setTotalCount(res.count || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    fetchRequests();
    setSelectedIds(new Set());
  }, [fetchRequests]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExportCSV = async () => {
    const params = new URLSearchParams();
    if (filters.status.length > 0) filters.status.forEach((s) => params.append("status", s));
    if (filters.search) params.set("search", filters.search);
    try {
      await downloadFile(`/admin/requests/export/csv/?${params.toString()}`, "demandes.csv");
    } catch {
      toast.error(t("Erreur lors de l'export CSV."));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map((r) => r.id)));
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      await api.post("/admin/requests/bulk/", { ids: Array.from(selectedIds), status: bulkStatus });
      toast.success(t("{count} demande(s) mise(s) à jour.", { count: selectedIds.size }));
      setSelectedIds(new Set());
      setBulkStatus("");
      fetchRequests();
    } catch {
      toast.error(t("Erreur lors de la mise à jour groupée."));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{t("Demandes ({count})", { count: totalCount })}</h2>
        <button onClick={handleExportCSV} className="btn-secondary !px-3 !py-2 text-sm">
          <Download className="h-4 w-4" /> {t("Export CSV")}
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3">
          <span className="text-sm font-medium">{t("{count} sélectionnée(s)", { count: selectedIds.size })}</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input !w-auto !py-1.5 text-sm">
            <option value="">{t("Action groupée…")}</option>
            {BULK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.label)}</option>
            ))}
          </select>
          <button onClick={handleBulkStatusUpdate} className="btn-primary !px-3 !py-1.5 text-sm" disabled={!bulkStatus}>
            {t("Appliquer")}
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState label={t("Chargement de vos demandes…")} />
      ) : requests.length === 0 ? (
        <EmptyState icon={<Inbox className="h-7 w-7" />} title={t("Aucune demande trouvée")} description={t("Aucune demande ne correspond aux filtres sélectionnés.")} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <button onClick={selectAll} aria-label={t("Tout sélectionner")} className="text-gray-500 hover:text-gray-700">
                      {selectedIds.size === requests.length ? <CheckSquare className="h-4 w-4 text-brand-blue" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Réf.")}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Client")}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Ramassage")}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Destination")}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Statut")}</th>
                  <th className="px-4 py-3 text-left font-semibold">{t("Date")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelect(req.id)} aria-label={t("Sélectionner")} className="text-gray-500 hover:text-gray-700">
                        {selectedIds.has(req.id) ? <CheckSquare className="h-4 w-4 text-brand-blue" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono">{req.reference_code}</td>
                    <td className="px-4 py-3">{req.customer_name}</td>
                    <td className="px-4 py-3">{req.pickup_city}</td>
                    <td className="px-4 py-3">{req.destination_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${req.id}`} className="font-medium text-brand-blue hover:underline">{t("Détails")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => toggleSelect(req.id)} className="mt-0.5 text-gray-500" aria-label={t("Sélectionner")}>
                    {selectedIds.has(req.id) ? <CheckSquare className="h-5 w-5 text-brand-blue" /> : <Square className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-gray-900">{req.reference_code}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{req.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {req.pickup_city}
                      {req.destination_name ? ` → ${req.destination_name}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                      <Link href={`/admin/requests/${req.id}`} className="text-sm font-medium text-brand-blue hover:underline">{t("Détails")}</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !px-3 !py-2 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> {t("Précédent")}
              </button>
              <span className="text-sm text-gray-500">{t("Page {page} / {total}", { page, total: totalPages })}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary !px-3 !py-2 disabled:opacity-50">
                {t("Suivant")} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

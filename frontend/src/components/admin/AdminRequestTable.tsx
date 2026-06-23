"use client";
import { useState, useEffect, useCallback } from "react";
import { api, downloadFile } from "@/lib/api";
import type { TransportRequestListItem } from "@/types/request";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, CheckSquare, Square } from "lucide-react";

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

export default function AdminRequestTable({ filters }: Props) {
  const [requests, setRequests] = useState<TransportRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const pageSize = 15;

  const fetchRequests = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status.length > 0) filters.status.forEach(s => params.append("status", s));
    if (filters.pickup_city) params.set("pickup_city", filters.pickup_city);
    if (filters.service_type) params.set("service_type", filters.service_type);
    if (filters.date_from) params.set("created_at_gte", filters.date_from);
    if (filters.date_to) params.set("created_at_lte", filters.date_to);
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    setLoading(true);
    api.get<any>(`/admin/requests/?${params.toString()}`).then((res) => {
      setRequests(res.results || res);
      setTotalCount(res.count || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    fetchRequests();
    setSelectedIds(new Set()); // reset selection on filter change
  }, [fetchRequests]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExportCSV = async () => {
    const params = new URLSearchParams();
    if (filters.status.length > 0) filters.status.forEach(s => params.append("status", s));
    if (filters.search) params.set("search", filters.search);
    try {
      await downloadFile(`/admin/requests/export/csv/?${params.toString()}`, "demandes.csv");
    } catch {
      alert("Erreur lors de l'export CSV.");
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map(r => r.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      await api.post("/admin/requests/bulk/", {
        ids: Array.from(selectedIds),
        status: bulkStatus,
      });
      setSelectedIds(new Set());
      setBulkStatus("");
      fetchRequests();
    } catch (e) {
      alert("Erreur lors de la mise à jour groupée");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Demandes ({totalCount})</h2>
        <button onClick={handleExportCSV} className="btn-secondary inline-flex items-center gap-2 text-sm py-2">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-3 mb-4 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIds.size} sélectionnée(s)</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="border rounded py-1 px-2 text-sm"
          >
            <option value="">Action groupée...</option>
            <option value="contacted">Marquer comme contacté</option>
            <option value="confirmed">Confirmer</option>
            <option value="pickup_scheduled">Ramassage planifié</option>
            <option value="received">Marquer reçu</option>
            <option value="loaded">Marquer chargé</option>
            <option value="in_transit">En route</option>
            <option value="arrived_cameroon">Arrivé au Cameroun</option>
            <option value="delivered">Livré</option>
            <option value="cancelled">Annuler</option>
          </select>
          <button onClick={handleBulkStatusUpdate} className="btn-primary text-sm py-1 px-3" disabled={!bulkStatus}>Appliquer</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner className="h-8 w-8" /></div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <button onClick={selectAll} className="text-gray-500 hover:text-gray-700">
                      {selectedIds.size === requests.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Réf.</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Ramassage</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelect(req.id)} className="text-gray-500 hover:text-gray-700">
                        {selectedIds.has(req.id) ? <CheckSquare className="h-4 w-4 text-brand-blue" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono">{req.reference_code}</td>
                    <td className="px-4 py-3">{req.customer_name}</td>
                    <td className="px-4 py-3">{req.pickup_city}</td>
                    <td className="px-4 py-3">{req.destination_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${req.status === 'new' ? 'bg-blue-100 text-blue-700' : req.status === 'confirmed' ? 'bg-green-100 text-green-700' : req.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(req.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${req.id}`} className="text-brand-blue underline text-sm">Détails</Link>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-6 text-gray-500">Aucune demande trouvée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-3 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-2 px-3 disabled:opacity-50"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
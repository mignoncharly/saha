"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import StatusTimeline from "@/components/public/StatusTimeline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { TransportRequest } from "@/types/request";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { Search } from "lucide-react";

function SuiviInner() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const [ref, setRef] = useState(initialRef);
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (reference: string) => {
    const trimmed = reference.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<TransportRequest>(`/transport-requests/${trimmed}/`);
      setRequest(data);
    } catch {
      setError("Demande introuvable. Vérifiez le numéro de référence.");
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when arriving with a ?ref= query param (e.g. from confirmation/account).
  useEffect(() => {
    if (initialRef) {
      doSearch(initialRef);
    }
  }, [initialRef, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(ref);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Suivi de demande</h1>
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
          placeholder="Ex: STL-2026-000123"
          className="flex-1 rounded-lg border border-gray-300 p-3 text-sm"
        />
        <button type="submit" className="btn-primary px-6" disabled={loading}>
          {loading ? <LoadingSpinner className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

      {request && (
        <div className="card space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">{request.reference_code}</h2>
              <p className="text-sm text-gray-500">Client : {request.customer?.full_name}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-brand-gold/10 text-brand-gold">
              {request.status}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Ramassage :</p>
              <p>{request.pickup_city} – {request.pickup_address}</p>
              {request.preferred_pickup_date && <p>Date souhaitée : {request.preferred_pickup_date}</p>}
            </div>
            <div>
              <p className="font-medium">Destination :</p>
              <p>{request.destination_city?.name}</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">État d&apos;avancement</h3>
            <StatusTimeline currentStatus={request.status} />
          </div>
          <div className="pt-4 border-t">
            <WhatsAppCTA
              reference={request.reference_code}
              pickup={request.pickup_city}
              destination={request.destination_city?.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Chargement...</div>}>
      <SuiviInner />
    </Suspense>
  );
}

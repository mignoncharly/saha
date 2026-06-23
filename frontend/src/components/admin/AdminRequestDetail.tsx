"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { TransportRequest } from "@/types/request";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle, XCircle, Truck, Phone, MessageCircle, Upload } from "lucide-react";
import StatusTimeline from "@/components/public/StatusTimeline";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  id: number;
}

export default function AdminRequestDetail({ id }: Props) {
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get<TransportRequest>(`/admin/requests/${id}/`).then((data) => {
      setRequest(data);
      setInternalNotes(data.internal_notes || "");
    }).catch(err => setError("Erreur de chargement")).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const updated = await api.patch<TransportRequest>(`/admin/requests/${id}/status/`, { status: newStatus, internal_notes: internalNotes });
      setRequest(updated);
      setInternalNotes(updated.internal_notes || "");
    } catch (err: any) {
      alert("Erreur lors du changement de statut");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner className="h-10 w-10" /></div>;
  if (error || !request) return <div className="text-red-500">{error}</div>;

  const statusLabelMap: Record<string, string> = {
    new: "Nouveau", contacted: "Contacté", confirmed: "Confirmé", pickup_scheduled: "Ramassage planifié",
    received: "Reçu", loaded: "Chargé", in_transit: "En route", arrived_cameroon: "Arrivé au Cameroun",
    delivered: "Livré", cancelled: "Annulé",
  };

  const nextActions = getNextActions(request.status);

  function getNextActions(status: string): { label: string; status: string }[] {
    const transitions: Record<string, string[]> = {
      new: ["contacted", "cancelled"],
      contacted: ["confirmed", "cancelled"],
      confirmed: ["pickup_scheduled", "cancelled"],
      pickup_scheduled: ["received", "cancelled"],
      received: ["loaded", "cancelled"],
      loaded: ["in_transit", "cancelled"],
      in_transit: ["arrived_cameroon", "cancelled"],
      arrived_cameroon: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    return (transitions[status] || []).map(s => ({ label: statusLabelMap[s], status: s }));
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/requests" className="text-brand-blue underline mb-4 inline-block">&larr; Retour aux demandes</Link>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{request.reference_code}</h1>
            <p className="text-gray-600">Client : {request.customer?.full_name} | {request.customer?.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-brand-gold/10 text-brand-gold">{statusLabelMap[request.status] || request.status}</span>
          </div>
        </div>

        {/* Customer detail */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-semibold mb-2">Contact client</h2>
            <p>Nom : {request.customer?.full_name}</p>
            <p>Tél : <a href={`tel:${request.customer?.phone}`} className="text-brand-blue">{request.customer?.phone}</a></p>
            <p>Email : {request.customer?.email || '-'}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Expédition</h2>
            <p>Type : {request.service_type?.name || '-'}</p>
            <p>Quantité : {request.quantity}</p>
            <p>Dimensions : {request.dimensions || '-'}</p>
            <p>Poids estimé : {request.estimated_weight || '-'} kg</p>
            <p>Description : {request.description || '-'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-semibold mb-2">Ramassage</h2>
            <p>Ville : {request.pickup_city}</p>
            <p>Adresse : {request.pickup_address}</p>
            <p>Date souhaitée : {request.preferred_pickup_date || '-'}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Destination</h2>
            <p>{request.destination_city?.name}</p>
          </div>
        </div>

        {request.photos.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2">Photos</h2>
            <div className="flex gap-2 flex-wrap">
              {request.photos.map((photo) => (
                <a key={photo.id} href={photo.image} target="_blank" rel="noopener noreferrer">
                  <img src={photo.image} alt="Marchandise" className="w-24 h-24 object-cover rounded" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Suivi</h2>
            <StatusTimeline currentStatus={request.status} />
          </div>
          <div>
            <h2 className="font-semibold mb-2">Actions</h2>
            <div className="space-y-3">
              <WhatsAppCTA
                reference={request.reference_code}
                pickup={request.pickup_city}
                destination={request.destination_city?.name || ""}
                className="w-full justify-center"
              />
              <div className="flex flex-wrap gap-2">
                {nextActions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusChange(action.status)}
                    disabled={statusLoading}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Notes internes</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
              <button
                onClick={async () => {
                  try {
                    await api.patch(`/admin/requests/${id}/`, { internal_notes: internalNotes });
                    alert("Notes sauvegardées");
                  } catch { alert("Erreur sauvegarde"); }
                }}
                className="btn-secondary text-sm mt-2 py-1 px-3"
              >
                Sauvegarder notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
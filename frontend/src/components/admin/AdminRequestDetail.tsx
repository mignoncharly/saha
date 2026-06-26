"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, User, Package, MapPin, Truck, Phone, Mail, Save } from "lucide-react";
import { api } from "@/lib/api";
import type { TransportRequest } from "@/types/request";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import StatusBadge, { statusLabel } from "@/components/ui/StatusBadge";
import StatusTimeline from "@/components/public/StatusTimeline";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { useTranslation } from "@/lib/i18n";

interface Props {
  id: number;
}

const TRANSITIONS: Record<string, string[]> = {
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{children}</span>
    </div>
  );
}

interface CommentRow {
  id: number;
  author_email: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export default function AdminRequestDetail({ id }: Props) {
  const { t, formatDate } = useTranslation();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);

  const loadComments = () =>
    api.get<CommentRow[]>(`/admin/requests/${id}/comments/`).then(setComments).catch(() => {});

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(`/admin/requests/${id}/comments/`, { body: newComment, is_internal: commentInternal });
      setNewComment("");
      setCommentInternal(false);
      loadComments();
    } catch {
      toast.error(t("Erreur lors de l'envoi."));
    }
  };

  useEffect(() => {
    api
      .get<TransportRequest>(`/admin/requests/${id}/`)
      .then((data) => {
        setRequest(data);
        setInternalNotes(data.internal_notes || "");
        setEstimatedPrice(data.estimated_price || "");
        setFinalPrice(data.final_price || "");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    loadComments();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const updated = await api.patch<TransportRequest>(`/admin/requests/${id}/status/`, {
        status: newStatus,
        internal_notes: internalNotes,
      });
      setRequest(updated);
      setInternalNotes(updated.internal_notes || "");
      toast.success(t("Statut mis à jour : {status}", { status: t(statusLabel(newStatus)) }));
    } catch {
      toast.error(t("Erreur lors du changement de statut."));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch<TransportRequest>(`/admin/requests/${id}/`, {
        internal_notes: internalNotes,
        estimated_price: estimatedPrice === "" ? null : estimatedPrice,
        final_price: finalPrice === "" ? null : finalPrice,
      });
      setRequest(updated);
      toast.success(t("Modifications enregistrées."));
    } catch {
      toast.error(t("Erreur lors de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState fullPage label={t("Chargement de la demande…")} />;
  if (error || !request) return <ErrorState message={t("Impossible de charger cette demande.")} />;

  const transitions = TRANSITIONS[request.status] || [];
  const advanceActions = transitions.filter((s) => s !== "cancelled");
  const canCancel = transitions.includes("cancelled");

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/requests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t("Retour aux demandes")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-gray-900">{request.reference_code}</h1>
          <p className="text-sm text-gray-500">{t("Créée le {date}", { date: formatDate(request.created_at) })}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><User className="h-5 w-5 text-brand-blue" /> {t("Client")}</h2>
            <InfoRow label={t("Nom")}>{request.customer?.full_name || "—"}</InfoRow>
            <InfoRow label={t("Téléphone")}>
              <a href={`tel:${request.customer?.phone}`} className="inline-flex items-center gap-1 text-brand-blue">
                <Phone className="h-3.5 w-3.5" /> {request.customer?.phone || "—"}
              </a>
            </InfoRow>
            <InfoRow label={t("Email")}>
              {request.customer?.email ? (
                <a href={`mailto:${request.customer.email}`} className="inline-flex items-center gap-1 text-brand-blue">
                  <Mail className="h-3.5 w-3.5" /> {request.customer.email}
                </a>
              ) : "—"}
            </InfoRow>
          </div>

          <div className="card">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><Package className="h-5 w-5 text-brand-blue" /> {t("Marchandise")}</h2>
            <InfoRow label={t("Type")}>{request.service_type?.name || "—"}</InfoRow>
            <InfoRow label={t("Quantité")}>{request.quantity}</InfoRow>
            <InfoRow label={t("Dimensions")}>{request.dimensions || "—"}</InfoRow>
            <InfoRow label={t("Poids estimé")}>{request.estimated_weight ? `${request.estimated_weight} kg` : "—"}</InfoRow>
            {request.description && <InfoRow label={t("Description")}>{request.description}</InfoRow>}
            {request.customer_notes && <InfoRow label={t("Note client")}>{request.customer_notes}</InfoRow>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><MapPin className="h-5 w-5 text-brand-blue" /> {t("Ramassage")}</h2>
              <InfoRow label={t("Ville")}>{request.pickup_city}</InfoRow>
              <InfoRow label={t("Adresse")}>{request.pickup_address}</InfoRow>
              <InfoRow label={t("Date souhaitée")}>{request.preferred_pickup_date || "—"}</InfoRow>
            </div>
            <div className="card">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900"><Truck className="h-5 w-5 text-brand-blue" /> {t("Destination")}</h2>
              <InfoRow label={t("Ville")}>{request.destination_city?.name || "—"}</InfoRow>
            </div>
          </div>

          {request.photos.length > 0 && (
            <div className="card">
              <h2 className="mb-3 font-semibold text-gray-900">{t("Photos")}</h2>
              <div className="flex flex-wrap gap-3">
                {request.photos.map((photo) => (
                  <a key={photo.id} href={photo.image} target="_blank" rel="noopener noreferrer" className="group">
                    <img src={photo.image} alt={t("Marchandise")} className="h-24 w-24 rounded-lg object-cover ring-1 ring-gray-200 transition group-hover:ring-brand-blue" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 font-semibold text-gray-900">{t("Suivi")}</h2>
            <StatusTimeline currentStatus={request.status} />
          </div>

          <div className="card">
            <h2 className="mb-3 font-semibold text-gray-900">{t("Commentaires")}</h2>
            <div className="space-y-2">
              {comments.length === 0 && <p className="text-sm text-gray-400">{t("Aucun commentaire")}</p>}
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg p-2 text-sm ${c.is_internal ? "bg-amber-50" : "bg-gray-50"}`}>
                  <p className="text-gray-700">{c.body}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {c.author_email || t("Système")} · {formatDate(c.created_at)}{c.is_internal ? ` · ${t("Interne")}` : ""}
                  </p>
                </div>
              ))}
            </div>
            <textarea rows={2} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t("Ajouter un commentaire…")} className="input mt-3" />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} className="h-4 w-4" />
              {t("Interne (non visible par le client)")}
            </label>
            <button onClick={postComment} className="btn-secondary mt-2 w-full">{t("Envoyer")}</button>
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-3 font-semibold text-gray-900">{t("Faire avancer le statut")}</h2>
            {advanceActions.length === 0 ? (
              <p className="text-sm text-gray-500">{t("Aucune action disponible pour ce statut.")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {advanceActions.map((s) => (
                  <button key={s} onClick={() => handleStatusChange(s)} disabled={statusLoading} className="btn-primary !px-3 !py-2 text-sm">
                    {t(statusLabel(s))}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <WhatsAppCTA reference={request.reference_code} pickup={request.pickup_city} destination={request.destination_city?.name || ""} className="w-full" />
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-semibold text-gray-900">{t("Prix & notes internes")}</h2>
            <label className="label" htmlFor="est-price">{t("Prix estimé (EUR)")}</label>
            <input id="est-price" type="number" step="0.01" value={estimatedPrice} onChange={(e) => setEstimatedPrice(e.target.value)} className="input mb-3" />
            <label className="label" htmlFor="final-price">{t("Prix final (EUR)")}</label>
            <input id="final-price" type="number" step="0.01" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} className="input mb-3" />
            <label className="label" htmlFor="notes">{t("Notes internes")}</label>
            <textarea id="notes" rows={4} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="input" />
            <button onClick={handleSave} disabled={saving} className="btn-secondary mt-3 w-full">
              <Save className="h-4 w-4" /> {saving ? t("Enregistrement…") : t("Enregistrer")}
            </button>
          </div>

          {canCancel && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="font-semibold text-red-800">{t("Zone de danger")}</h2>
              <p className="mt-1 text-sm text-red-700">{t("Annuler cette demande la marquera comme annulée.")}</p>
              <button onClick={() => handleStatusChange("cancelled")} disabled={statusLoading} className="btn-danger mt-3 w-full">
                {t("Annuler la demande")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

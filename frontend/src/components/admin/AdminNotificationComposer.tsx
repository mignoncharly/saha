"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";
import { api, parseApiError } from "@/lib/api";
import FormField from "@/components/ui/FormField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminNotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetRegion, setTargetRegion] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !body) return toast.error("Titre et message sont requis.");
    setSending(true);
    try {
      await api.post("/admin/broadcast/", {
        title,
        body,
        target_type: targetType,
        target_region: targetType === "region" ? targetRegion : "",
      });
      toast.success("Notification envoyée.");
      setTitle("");
      setBody("");
      setTargetRegion("");
    } catch (err) {
      toast.error(parseApiError(err, "Erreur lors de l'envoi."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Envoyer une notification push</h2>

      <div className="card space-y-4">
        <FormField label="Titre" htmlFor="notif-title" required>
          <input id="notif-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Nouveau ramassage disponible" />
        </FormField>
        <FormField label="Message" htmlFor="notif-body" required>
          <textarea id="notif-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="input" placeholder="Ramassage à Francfort le 04.07.2026" />
        </FormField>
        <FormField label="Cible" htmlFor="notif-target">
          <select id="notif-target" value={targetType} onChange={(e) => setTargetType(e.target.value)} className="input">
            <option value="all">Tous les abonnés</option>
            <option value="region">Par région</option>
          </select>
        </FormField>
        {targetType === "region" && (
          <FormField label="Région" htmlFor="notif-region">
            <input id="notif-region" value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} placeholder="ex: Frankfurt" className="input" />
          </FormField>
        )}
        <button onClick={handleSend} disabled={sending} className="btn-primary w-full">
          {sending ? <LoadingSpinner className="h-5 w-5" /> : <><Send className="h-4 w-4" /> Envoyer la notification</>}
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-4 text-sm text-gray-600">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
        <p>La notification est envoyée aux utilisateurs ayant activé les notifications push sur leur appareil.</p>
      </div>
    </div>
  );
}

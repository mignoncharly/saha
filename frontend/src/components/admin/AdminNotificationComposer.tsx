"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Bell } from "lucide-react";

export default function AdminNotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetRegion, setTargetRegion] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!title || !body) return;
    setSending(true);
    try {
      await api.post("/admin/broadcast/", {
        title,
        body,
        target_type: targetType,
        target_region: targetType === "region" ? targetRegion : "",
      });
      setMessage("Notification envoyée !");
      setTitle("");
      setBody("");
      setTargetRegion("");
    } catch {
      setMessage("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Envoyer une notification push</h2>
      <div className="card space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium">Titre</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded p-2" placeholder="Nouveau ramassage disponible" />
        </div>
        <div>
          <label className="block text-sm font-medium">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} className="w-full border rounded p-2" placeholder="Ramassage à Francfort le 04.07.2026" />
        </div>
        <div>
          <label className="block text-sm font-medium">Cible</label>
          <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full border rounded p-2">
            <option value="all">Tous les abonnés</option>
            <option value="region">Par région</option>
          </select>
        </div>
        {targetType === "region" && (
          <div>
            <label className="block text-sm font-medium">Région</label>
            <input value={targetRegion} onChange={e => setTargetRegion(e.target.value)} placeholder="ex: Frankfurt" className="w-full border rounded p-2" />
          </div>
        )}
        <button onClick={handleSend} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
          <Bell className="h-4 w-4" /> {sending ? "Envoi..." : "Envoyer la notification"}
        </button>
        {message && <p className="text-sm text-center text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
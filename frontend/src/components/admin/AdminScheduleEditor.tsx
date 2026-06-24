"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { PickupSchedule } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Edit2, Trash2, Check, X, CalendarDays } from "lucide-react";

const EMPTY: Partial<PickupSchedule> = { region_name: "", cities: "", start_date: "", end_date: "", notes: "" };

export default function AdminScheduleEditor() {
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PickupSchedule>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<PickupSchedule>>(EMPTY);

  useEffect(() => {
    api.get<PickupSchedule[]>("/admin/pickup-schedules/").then(setSchedules).catch(() => toast.error("Erreur de chargement.")).finally(() => setLoading(false));
  }, []);

  const refresh = () => api.get<PickupSchedule[]>("/admin/pickup-schedules/").then(setSchedules);

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.patch(`/admin/pickup-schedules/${editingId}/`, editForm);
      setEditingId(null);
      refresh();
      toast.success("Tournée mise à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Supprimer cette tournée ?")) return;
    try {
      await api.delete(`/admin/pickup-schedules/${id}/`);
      refresh();
      toast.success("Tournée supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const addItem = async () => {
    if (!newForm.region_name || !newForm.start_date) return toast.error("Région et date de début requises.");
    try {
      await api.post("/admin/pickup-schedules/", newForm);
      setAdding(false);
      setNewForm(EMPTY);
      refresh();
      toast.success("Tournée ajoutée.");
    } catch {
      toast.error("Erreur lors de l'ajout.");
    }
  };

  if (loading) return <LoadingState label="Chargement des tournées…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Tournées de ramassage</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">Nouvelle tournée</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input placeholder="Région" value={newForm.region_name} onChange={(e) => setNewForm({ ...newForm, region_name: e.target.value })} className="input" />
            <input placeholder="Villes (séparées par ,)" value={newForm.cities} onChange={(e) => setNewForm({ ...newForm, cities: e.target.value })} className="input" />
            <input type="date" value={newForm.start_date} onChange={(e) => setNewForm({ ...newForm, start_date: e.target.value })} className="input" />
            <input type="date" value={newForm.end_date || ""} onChange={(e) => setNewForm({ ...newForm, end_date: e.target.value })} className="input" />
            <input placeholder="Notes" value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} className="input sm:col-span-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary !px-3 !py-2 text-sm"><Check className="h-4 w-4" /> Valider</button>
            <button onClick={() => { setAdding(false); setNewForm(EMPTY); }} className="btn-ghost !px-3 !py-2 text-sm"><X className="h-4 w-4" /> Annuler</button>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="Aucune tournée" description="Ajoutez votre première tournée de ramassage." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Région</th>
                <th className="px-4 py-3 text-left font-semibold">Villes</th>
                <th className="px-4 py-3 text-left font-semibold">Début</th>
                <th className="px-4 py-3 text-left font-semibold">Fin</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  {editingId === s.id ? (
                    <>
                      <td className="px-4 py-2"><input value={editForm.region_name} onChange={(e) => setEditForm({ ...editForm, region_name: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.cities} onChange={(e) => setEditForm({ ...editForm, cities: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="date" value={editForm.end_date || ""} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} aria-label="Valider" className="text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label="Annuler" className="text-gray-500"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{s.region_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.cities}</td>
                      <td className="px-4 py-3">{s.start_date}</td>
                      <td className="px-4 py-3">{s.end_date || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{s.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(s.id); setEditForm({ ...s }); }} aria-label="Modifier" className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteItem(s.id)} aria-label="Supprimer" className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

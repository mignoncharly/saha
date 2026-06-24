"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { LoadingDate } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Edit2, Trash2, Check, X, Truck } from "lucide-react";

const EMPTY: Partial<LoadingDate> = { date: "", title: "", description: "" };

export default function AdminLoadingDateEditor() {
  const [items, setItems] = useState<LoadingDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoadingDate>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<LoadingDate>>(EMPTY);

  useEffect(() => {
    api.get<LoadingDate[]>("/admin/loading-dates/").then(setItems).catch(() => toast.error("Erreur de chargement.")).finally(() => setLoading(false));
  }, []);

  const refresh = () => api.get<LoadingDate[]>("/admin/loading-dates/").then(setItems);

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.patch(`/admin/loading-dates/${editingId}/`, editForm);
      setEditingId(null);
      refresh();
      toast.success("Date mise à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Supprimer cette date ?")) return;
    try {
      await api.delete(`/admin/loading-dates/${id}/`);
      refresh();
      toast.success("Date supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const addItem = async () => {
    if (!newForm.date) return toast.error("La date est requise.");
    try {
      await api.post("/admin/loading-dates/", newForm);
      setAdding(false);
      setNewForm(EMPTY);
      refresh();
      toast.success("Date ajoutée.");
    } catch {
      toast.error("Erreur lors de l'ajout.");
    }
  };

  if (loading) return <LoadingState label="Chargement des dates…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Dates de chargement</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">Nouvelle date de chargement</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} className="input" />
            <input placeholder="Titre" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} className="input" />
            <input placeholder="Description" value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} className="input" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary !px-3 !py-2 text-sm"><Check className="h-4 w-4" /> Valider</button>
            <button onClick={() => { setAdding(false); setNewForm(EMPTY); }} className="btn-ghost !px-3 !py-2 text-sm"><X className="h-4 w-4" /> Annuler</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Aucune date de chargement" description="Ajoutez la prochaine date de chargement." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Titre</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} aria-label="Valider" className="text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label="Annuler" className="text-gray-500"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{item.date}</td>
                      <td className="px-4 py-3">{item.title}</td>
                      <td className="px-4 py-3 text-gray-500">{item.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(item.id); setEditForm({ ...item }); }} aria-label="Modifier" className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteItem(item.id)} aria-label="Supprimer" className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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

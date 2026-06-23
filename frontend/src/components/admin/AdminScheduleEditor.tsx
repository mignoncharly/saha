"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { PickupSchedule } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function AdminScheduleEditor() {
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PickupSchedule>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<PickupSchedule>>({ region_name: "", cities: "", start_date: "", end_date: "", notes: "" });

  useEffect(() => {
    api.get<PickupSchedule[]>("/admin/pickup-schedules/").then(setSchedules).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    api.get<PickupSchedule[]>("/admin/pickup-schedules/").then(setSchedules);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.patch(`/admin/pickup-schedules/${editingId}/`, editForm);
      setEditingId(null);
      refresh();
    } catch { alert("Erreur"); }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Supprimer ?")) return;
    try {
      await api.delete(`/admin/pickup-schedules/${id}/`);
      refresh();
    } catch { alert("Erreur"); }
  };

  const addItem = async () => {
    if (!newForm.region_name || !newForm.start_date) return;
    try {
      await api.post("/admin/pickup-schedules/", newForm);
      setAdding(false);
      setNewForm({ region_name: "", cities: "", start_date: "", end_date: "", notes: "" });
      refresh();
    } catch { alert("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-10"><LoadingSpinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tournées de ramassage</h2>
        <button onClick={() => setAdding(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {adding && (
        <div className="card mb-4 p-4 space-y-2">
          <h3 className="font-semibold">Nouvelle tournée</h3>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Région" value={newForm.region_name} onChange={e => setNewForm({...newForm, region_name: e.target.value})} className="border rounded p-1 text-sm" />
            <input placeholder="Villes (séparées par ,)" value={newForm.cities} onChange={e => setNewForm({...newForm, cities: e.target.value})} className="border rounded p-1 text-sm" />
            <input type="date" value={newForm.start_date} onChange={e => setNewForm({...newForm, start_date: e.target.value})} className="border rounded p-1 text-sm" />
            <input type="date" value={newForm.end_date || ""} onChange={e => setNewForm({...newForm, end_date: e.target.value})} className="border rounded p-1 text-sm" />
            <input placeholder="Notes" value={newForm.notes} onChange={e => setNewForm({...newForm, notes: e.target.value})} className="border rounded p-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary text-sm py-1 px-3"><Check className="h-4 w-4" /></button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-sm py-1 px-3"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Région</th>
              <th className="px-4 py-2 text-left">Villes</th>
              <th className="px-4 py-2 text-left">Début</th>
              <th className="px-4 py-2 text-left">Fin</th>
              <th className="px-4 py-2 text-left">Notes</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id} className="border-t">
                {editingId === s.id ? (
                  <>
                    <td className="px-4 py-2"><input value={editForm.region_name} onChange={e => setEditForm({...editForm, region_name: e.target.value})} className="border rounded p-1 w-full" /></td>
                    <td className="px-4 py-2"><input value={editForm.cities} onChange={e => setEditForm({...editForm, cities: e.target.value})} className="border rounded p-1" /></td>
                    <td className="px-4 py-2"><input type="date" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} className="border rounded p-1" /></td>
                    <td className="px-4 py-2"><input type="date" value={editForm.end_date || ""} onChange={e => setEditForm({...editForm, end_date: e.target.value})} className="border rounded p-1" /></td>
                    <td className="px-4 py-2"><input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="border rounded p-1" /></td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={saveEdit} className="text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600"><X className="h-4 w-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{s.region_name}</td>
                    <td className="px-4 py-2 text-xs">{s.cities}</td>
                    <td className="px-4 py-2">{s.start_date}</td>
                    <td className="px-4 py-2">{s.end_date || '-'}</td>
                    <td className="px-4 py-2 text-xs">{s.notes}</td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={() => { setEditingId(s.id); setEditForm({...s}) }} className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => deleteItem(s.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { LoadingDate } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function AdminLoadingDateEditor() {
  const [items, setItems] = useState<LoadingDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoadingDate>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<LoadingDate>>({ date: "", title: "", description: "" });

  useEffect(() => {
    api.get<LoadingDate[]>("/admin/loading-dates/").then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refresh = () => api.get<LoadingDate[]>("/admin/loading-dates/").then(setItems);

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.patch(`/admin/loading-dates/${editingId}/`, editForm);
      setEditingId(null);
      refresh();
    } catch { alert("Erreur"); }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Supprimer ?")) return;
    try {
      await api.delete(`/admin/loading-dates/${id}/`);
      refresh();
    } catch { alert("Erreur"); }
  };

  const addItem = async () => {
    if (!newForm.date) return;
    try {
      await api.post("/admin/loading-dates/", newForm);
      setAdding(false);
      setNewForm({ date: "", title: "", description: "" });
      refresh();
    } catch { alert("Erreur"); }
  };

  if (loading) return <div className="flex justify-center py-10"><LoadingSpinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dates de chargement</h2>
        <button onClick={() => setAdding(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {adding && (
        <div className="card mb-4 p-4 space-y-2">
          <input type="date" value={newForm.date} onChange={e => setNewForm({...newForm, date: e.target.value})} className="border rounded p-1" />
          <input placeholder="Titre" value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})} className="border rounded p-1 w-full" />
          <input placeholder="Description" value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})} className="border rounded p-1 w-full" />
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
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Titre</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t">
                {editingId === item.id ? (
                  <>
                    <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="border rounded p-1" /></td>
                    <td className="px-4 py-2"><input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="border rounded p-1 w-full" /></td>
                    <td className="px-4 py-2"><input value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="border rounded p-1 w-full" /></td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={saveEdit} className="text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600"><X className="h-4 w-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{item.date}</td>
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2 text-xs">{item.description}</td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={() => { setEditingId(item.id); setEditForm({...item}) }} className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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
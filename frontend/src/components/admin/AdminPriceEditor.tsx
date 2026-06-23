"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { PriceRule, ServiceType } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function AdminPriceEditor() {
  const [prices, setPrices] = useState<PriceRule[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PriceRule>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<PriceRule>>({ label: "", price_amount: "0", currency: "EUR", unit: "", service_type: undefined });

  useEffect(() => {
    Promise.all([
      api.get<PriceRule[]>("/admin/prices/"),
      api.get<ServiceType[]>("/admin/services/")
    ]).then(([p, s]) => {
      setPrices(p);
      setServices(s);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refreshPrices = () => {
    api.get<PriceRule[]>("/admin/prices/").then(setPrices).catch(console.error);
  };

  const handleEdit = (price: PriceRule) => {
    setEditingId(price.id);
    setEditForm({ ...price });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.label) return;
    try {
      await api.patch(`/admin/prices/${editingId}/`, editForm);
      setEditingId(null);
      refreshPrices();
    } catch { alert("Erreur sauvegarde"); }
  };

  const deletePrice = async (id: number) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    try {
      await api.delete(`/admin/prices/${id}/`);
      refreshPrices();
    } catch { alert("Erreur suppression"); }
  };

  const addPrice = async () => {
    if (!newForm.label || !newForm.price_amount || !newForm.service_type) return;
    try {
      await api.post("/admin/prices/", {
        ...newForm,
        service_type: newForm.service_type,
      });
      setAdding(false);
      setNewForm({ label: "", price_amount: "0", currency: "EUR", unit: "", service_type: undefined });
      refreshPrices();
    } catch { alert("Erreur ajout"); }
  };

  if (loading) return <div className="flex justify-center py-10"><LoadingSpinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gestion des tarifs</h2>
        <button onClick={() => setAdding(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2">
          <Plus className="h-4 w-4" /> Ajouter un tarif
        </button>
      </div>

      {adding && (
        <div className="card mb-4 p-4 space-y-3">
          <h3 className="font-semibold">Nouveau tarif</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input placeholder="Libellé" value={newForm.label} onChange={e => setNewForm({...newForm, label: e.target.value})} className="border rounded p-1 text-sm" />
            <input placeholder="Prix" type="number" step="0.01" value={newForm.price_amount} onChange={e => setNewForm({...newForm, price_amount: e.target.value})} className="border rounded p-1 text-sm" />
            <input placeholder="Unité" value={newForm.unit} onChange={e => setNewForm({...newForm, unit: e.target.value})} className="border rounded p-1 text-sm" />
            <select value={newForm.service_type || ""} onChange={e => setNewForm({...newForm, service_type: Number(e.target.value)})} className="border rounded p-1 text-sm">
              <option value="">Service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addPrice} className="btn-primary text-sm py-1 px-3"><Check className="h-4 w-4" /> Valider</button>
            <button onClick={() => setAdding(false)} className="btn-secondary text-sm py-1 px-3"><X className="h-4 w-4" /> Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Service</th>
              <th className="px-4 py-2 text-left">Libellé</th>
              <th className="px-4 py-2 text-left">Prix</th>
              <th className="px-4 py-2 text-left">Unité</th>
              <th className="px-4 py-2 text-left">Actif</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {prices.map(price => (
              <tr key={price.id} className="border-t">
                {editingId === price.id ? (
                  <>
                    <td className="px-4 py-2">
                      <select value={editForm.service_type || price.service_type} onChange={e => setEditForm({...editForm, service_type: Number(e.target.value)})} className="border rounded p-1 w-full text-sm">
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><input value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})} className="border rounded p-1 w-full" /></td>
                    <td className="px-4 py-2"><input type="number" step="0.01" value={editForm.price_amount} onChange={e => setEditForm({...editForm, price_amount: e.target.value})} className="border rounded p-1 w-20" /></td>
                    <td className="px-4 py-2"><input value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} className="border rounded p-1 w-20" /></td>
                    <td className="px-4 py-2"><input type="checkbox" checked={editForm.active !== false} onChange={e => setEditForm({...editForm, active: e.target.checked})} /></td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={saveEdit} className="text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600"><X className="h-4 w-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{price.service_name}</td>
                    <td className="px-4 py-2">{price.label}</td>
                    <td className="px-4 py-2 font-mono">{parseFloat(price.price_amount).toFixed(2)} €</td>
                    <td className="px-4 py-2">{price.unit}</td>
                    <td className="px-4 py-2">{price.active !== false ? "✅" : "❌"}</td>
                    <td className="px-4 py-2 flex gap-1">
                      <button onClick={() => handleEdit(price)} className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => deletePrice(price.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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
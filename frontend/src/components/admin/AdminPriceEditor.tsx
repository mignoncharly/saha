"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { PriceRule, ServiceType } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";

const EMPTY_NEW: Partial<PriceRule> = { label: "", price_amount: "0", currency: "EUR", unit: "", service_type: undefined };

export default function AdminPriceEditor() {
  const [prices, setPrices] = useState<PriceRule[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PriceRule>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<PriceRule>>(EMPTY_NEW);

  useEffect(() => {
    Promise.all([api.get<PriceRule[]>("/admin/prices/"), api.get<ServiceType[]>("/admin/services/")])
      .then(([p, s]) => {
        setPrices(p);
        setServices(s);
      })
      .catch(() => toast.error("Erreur de chargement des tarifs."))
      .finally(() => setLoading(false));
  }, []);

  const refreshPrices = () => api.get<PriceRule[]>("/admin/prices/").then(setPrices).catch(console.error);

  const handleEdit = (price: PriceRule) => {
    setEditingId(price.id);
    setEditForm({ ...price });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.label) return toast.error("Le libellé est requis.");
    try {
      await api.patch(`/admin/prices/${editingId}/`, editForm);
      setEditingId(null);
      refreshPrices();
      toast.success("Tarif mis à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  const deletePrice = async (id: number) => {
    if (!confirm("Supprimer ce tarif ?")) return;
    try {
      await api.delete(`/admin/prices/${id}/`);
      refreshPrices();
      toast.success("Tarif supprimé.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const addPrice = async () => {
    if (!newForm.label || !newForm.price_amount || !newForm.service_type)
      return toast.error("Libellé, prix et service sont requis.");
    try {
      await api.post("/admin/prices/", { ...newForm, service_type: newForm.service_type });
      setAdding(false);
      setNewForm(EMPTY_NEW);
      refreshPrices();
      toast.success("Tarif ajouté.");
    } catch {
      toast.error("Erreur lors de l'ajout.");
    }
  };

  if (loading) return <LoadingState label="Chargement des tarifs…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Gestion des tarifs</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> Ajouter un tarif
          </button>
        )}
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">Nouveau tarif</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder="Libellé" value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} className="input" />
            <input placeholder="Prix" type="number" step="0.01" value={newForm.price_amount} onChange={(e) => setNewForm({ ...newForm, price_amount: e.target.value })} className="input" />
            <input placeholder="Unité (ex: m³)" value={newForm.unit} onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })} className="input" />
            <select value={newForm.service_type || ""} onChange={(e) => setNewForm({ ...newForm, service_type: Number(e.target.value) })} className="input">
              <option value="">Service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addPrice} className="btn-primary !px-3 !py-2 text-sm"><Check className="h-4 w-4" /> Valider</button>
            <button onClick={() => { setAdding(false); setNewForm(EMPTY_NEW); }} className="btn-ghost !px-3 !py-2 text-sm"><X className="h-4 w-4" /> Annuler</button>
          </div>
        </div>
      )}

      {prices.length === 0 ? (
        <EmptyState icon={<Tag className="h-7 w-7" />} title="Aucun tarif" description="Ajoutez votre premier tarif indicatif." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Service</th>
                <th className="px-4 py-3 text-left font-semibold">Libellé</th>
                <th className="px-4 py-3 text-left font-semibold">Prix</th>
                <th className="px-4 py-3 text-left font-semibold">Unité</th>
                <th className="px-4 py-3 text-left font-semibold">Actif</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.id} className="border-t border-gray-100">
                  {editingId === price.id ? (
                    <>
                      <td className="px-4 py-2">
                        <select value={editForm.service_type || price.service_type} onChange={(e) => setEditForm({ ...editForm, service_type: Number(e.target.value) })} className="input !py-1.5">
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="number" step="0.01" value={editForm.price_amount} onChange={(e) => setEditForm({ ...editForm, price_amount: e.target.value })} className="input !w-24 !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="input !w-20 !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="checkbox" checked={editForm.active !== false} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="h-4 w-4" /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} aria-label="Valider" className="text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label="Annuler" className="text-gray-500"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">{price.service_name}</td>
                      <td className="px-4 py-3">{price.label}</td>
                      <td className="px-4 py-3 font-mono">{parseFloat(price.price_amount).toFixed(2)} €</td>
                      <td className="px-4 py-3">{price.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${price.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {price.active !== false ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(price)} aria-label="Modifier" className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deletePrice(price.id)} aria-label="Supprimer" className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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

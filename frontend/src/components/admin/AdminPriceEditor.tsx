"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { PriceRule, ServiceType } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const EMPTY_NEW: Partial<PriceRule> = { label: "", price_amount: "0", currency: "EUR", unit: "", service_type: undefined, active: true, valid_from: null, valid_until: null };

export default function AdminPriceEditor() {
  const { t } = useTranslation();
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
      .catch(() => toast.error(t("Erreur de chargement des tarifs.")))
      .finally(() => setLoading(false));
  }, [t]);

  const refreshPrices = () => api.get<PriceRule[]>("/admin/prices/").then(setPrices).catch(console.error);

  const handleEdit = (price: PriceRule) => {
    setEditingId(price.id);
    setEditForm({ ...price });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.label) return toast.error(t("Le libellé est requis."));
    try {
      await api.patch(`/admin/prices/${editingId}/`, editForm);
      setEditingId(null);
      refreshPrices();
      toast.success(t("Tarif mis à jour."));
    } catch {
      toast.error(t("Erreur lors de la sauvegarde."));
    }
  };

  const deletePrice = async (id: number) => {
    if (!confirm(t("Supprimer ce tarif ?"))) return;
    try {
      await api.delete(`/admin/prices/${id}/`);
      refreshPrices();
      toast.success(t("Tarif supprimé."));
    } catch {
      toast.error(t("Erreur lors de la suppression."));
    }
  };

  const addPrice = async () => {
    if (!newForm.label || !newForm.price_amount || !newForm.service_type)
      return toast.error(t("Libellé, prix et service sont requis."));
    try {
      await api.post("/admin/prices/", { ...newForm, service_type: newForm.service_type });
      setAdding(false);
      setNewForm(EMPTY_NEW);
      refreshPrices();
      toast.success(t("Tarif ajouté."));
    } catch {
      toast.error(t("Erreur lors de l'ajout."));
    }
  };

  if (loading) return <LoadingState label={t("Chargement des tarifs…")} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{t("Gestion des tarifs")}</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> {t("Ajouter un tarif")}
          </button>
        )}
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">{t("Nouveau tarif")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder={t("Libellé")} value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} className="input" />
            <input placeholder={t("Prix")} type="number" step="0.01" value={newForm.price_amount} onChange={(e) => setNewForm({ ...newForm, price_amount: e.target.value })} className="input" />
            <input placeholder={t("Unité (ex: m³)")} value={newForm.unit} onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })} className="input" />
            <select value={newForm.service_type || ""} onChange={(e) => setNewForm({ ...newForm, service_type: Number(e.target.value) })} className="input">
              <option value="">{t("Service…")}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col text-xs font-medium text-gray-600">
              {t("Valide à partir du")}
              <input type="date" value={newForm.valid_from ?? ""} onChange={(e) => setNewForm({ ...newForm, valid_from: e.target.value || null })} className="input !py-1.5" />
            </label>
            <label className="flex flex-col text-xs font-medium text-gray-600">
              {t("Valide jusqu'au")}
              <input type="date" value={newForm.valid_until ?? ""} onChange={(e) => setNewForm({ ...newForm, valid_until: e.target.value || null })} className="input !py-1.5" />
            </label>
            <label className="flex items-center gap-2 self-end pb-1.5 text-sm text-gray-700">
              <input type="checkbox" checked={newForm.active !== false} onChange={(e) => setNewForm({ ...newForm, active: e.target.checked })} className="h-4 w-4" />
              {t("Actif")}
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={addPrice} className="btn-primary !px-3 !py-2 text-sm"><Check className="h-4 w-4" /> {t("Valider")}</button>
            <button onClick={() => { setAdding(false); setNewForm(EMPTY_NEW); }} className="btn-ghost !px-3 !py-2 text-sm"><X className="h-4 w-4" /> {t("Annuler")}</button>
          </div>
        </div>
      )}

      {prices.length === 0 ? (
        <EmptyState icon={<Tag className="h-7 w-7" />} title={t("Aucun tarif")} description={t("Ajoutez votre premier tarif indicatif.")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("Services")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Libellé")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Prix")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Unité")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Actif")}</th>
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
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-1.5 text-xs text-gray-700">
                            <input type="checkbox" checked={editForm.active !== false} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="h-4 w-4" />
                            {t("Actif")}
                          </label>
                          <input type="date" aria-label={t("Valide à partir du")} value={editForm.valid_from ?? ""} onChange={(e) => setEditForm({ ...editForm, valid_from: e.target.value || null })} className="input !py-1 !text-xs" />
                          <input type="date" aria-label={t("Valide jusqu'au")} value={editForm.valid_until ?? ""} onChange={(e) => setEditForm({ ...editForm, valid_until: e.target.value || null })} className="input !py-1 !text-xs" />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} aria-label={t("Valider")} className="text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label={t("Annuler")} className="text-gray-500"><X className="h-4 w-4" /></button>
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
                          {price.active !== false ? t("Actif") : t("Inactif")}
                        </span>
                        {(price.valid_from || price.valid_until) && (
                          <p className="mt-1 text-xs text-gray-400">
                            {price.valid_from || "…"} → {price.valid_until || "…"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(price)} aria-label={t("Modifier")} className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deletePrice(price.id)} aria-label={t("Supprimer")} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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

"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Edit2, Trash2, Check, X, Boxes } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const EMPTY: Partial<ServiceType> = { name: "", description: "", icon: "", active: true, sort_order: 0 };

export default function AdminServiceEditor() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceType>>({});
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<ServiceType>>(EMPTY);

  useEffect(() => {
    api.get<ServiceType[]>("/admin/services/").then(setItems).catch(() => toast.error(t("Erreur de chargement."))).finally(() => setLoading(false));
  }, [t]);

  const refresh = () => api.get<ServiceType[]>("/admin/services/").then(setItems);

  const saveEdit = async () => {
    if (!editingId || !editForm.name) return toast.error(t("Nom du service requis."));
    try {
      await api.patch(`/admin/services/${editingId}/`, { ...editForm, sort_order: Number(editForm.sort_order) || 0 });
      setEditingId(null);
      refresh();
      toast.success(t("Service mis à jour."));
    } catch {
      toast.error(t("Erreur lors de la sauvegarde."));
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm(t("Supprimer ce service ?"))) return;
    try {
      await api.delete(`/admin/services/${id}/`);
      refresh();
      toast.success(t("Service supprimé."));
    } catch {
      toast.error(t("Erreur lors de la suppression."));
    }
  };

  const addItem = async () => {
    if (!newForm.name) return toast.error(t("Nom du service requis."));
    try {
      await api.post("/admin/services/", { ...newForm, sort_order: Number(newForm.sort_order) || 0 });
      setAdding(false);
      setNewForm(EMPTY);
      refresh();
      toast.success(t("Service ajouté."));
    } catch {
      toast.error(t("Erreur lors de l'ajout."));
    }
  };

  if (loading) return <LoadingState label={t("Chargement des services…")} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{t("Gestion des services")}</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn-primary !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> {t("Ajouter")}
          </button>
        )}
      </div>

      {adding && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-900">{t("Nouveau service")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder={t("Nom")} value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="input" />
            <input placeholder={t("Description")} value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} className="input" />
            <input placeholder={t("Identifiant d'icône (ex: package)")} value={newForm.icon} onChange={(e) => setNewForm({ ...newForm, icon: e.target.value })} className="input" />
            <input type="number" placeholder={t("Ordre")} value={newForm.sort_order ?? 0} onChange={(e) => setNewForm({ ...newForm, sort_order: Number(e.target.value) })} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={newForm.active !== false} onChange={(e) => setNewForm({ ...newForm, active: e.target.checked })} className="h-4 w-4" />
            {t("Actif")}
          </label>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary !px-3 !py-2 text-sm"><Check className="h-4 w-4" /> {t("Valider")}</button>
            <button onClick={() => { setAdding(false); setNewForm(EMPTY); }} className="btn-ghost !px-3 !py-2 text-sm"><X className="h-4 w-4" /> {t("Annuler")}</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={<Boxes className="h-7 w-7" />} title={t("Aucun service")} description={t("Ajoutez votre premier service.")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("Nom")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Description")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Icône")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Ordre")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Actif")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input !py-1.5" /></td>
                      <td className="px-4 py-2"><input value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} className="input !w-28 !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="number" value={editForm.sort_order ?? 0} onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })} className="input !w-20 !py-1.5" /></td>
                      <td className="px-4 py-2"><input type="checkbox" checked={editForm.active !== false} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="h-4 w-4" aria-label={t("Actif")} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} aria-label={t("Valider")} className="text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} aria-label={t("Annuler")} className="text-gray-500"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.description}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{item.icon || "—"}</td>
                      <td className="px-4 py-3">{item.sort_order ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${item.active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {item.active !== false ? t("Actif") : t("Inactif")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(item.id); setEditForm({ ...item }); }} aria-label={t("Modifier")} className="text-brand-blue"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteItem(item.id)} aria-label={t("Supprimer")} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
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

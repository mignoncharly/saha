"use client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminScheduleEditor from "@/components/admin/AdminScheduleEditor";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api, downloadFile, parseApiError } from "@/lib/api";
import { AlertTriangle, Check, Download, Upload, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type ImportPreviewRow = {
  row: number;
  region_name: string;
  cities: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  active: boolean;
};

type ImportPreviewError = {
  row: number;
  messages: string[];
  data: ImportPreviewRow;
};

type ImportPreviewResponse = {
  to_create: ImportPreviewRow[];
  to_update: ImportPreviewRow[];
  errors: ImportPreviewError[];
};

type ImportApplyResponse = ImportPreviewResponse & {
  created: number;
  updated: number;
};

export default function AdminSchedulesPage() {
  const { t } = useTranslation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  // Bumping this key remounts the editor, which re-fetches its data — a
  // targeted refresh instead of a full-page reload after a CSV import.
  const [reloadKey, setReloadKey] = useState(0);

  const previewRows = useMemo(
    () => [
      ...(preview?.to_create || []).map((row) => ({ ...row, action: t("Créer") })),
      ...(preview?.to_update || []).map((row) => ({ ...row, action: t("Mettre à jour") })),
    ],
    [preview, t]
  );

  const resetImport = () => {
    setImportFile(null);
    setPreview(null);
  };

  const handleExport = async () => {
    try {
      await downloadFile("/admin/pickup-schedules/export/csv/", "tournees_ramassage.csv");
    } catch {
      toast.error(t("Erreur lors de l'export CSV."));
    }
  };

  const handleFileSelected = async (file: File | null) => {
    setImportFile(file);
    setPreview(null);
    if (!file) return;

    setPreviewing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.postFormData<ImportPreviewResponse>("/admin/pickup-schedules/import/?dry_run=1", formData);
      setPreview(res);
      if (res.errors.length > 0) {
        toast.error(t("Le fichier contient {count} erreur(s).", { count: res.errors.length }));
      }
    } catch (err) {
      toast.error(parseApiError(err, t("Erreur lors de la prévisualisation.")));
      setImportFile(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleApplyImport = async () => {
    if (!importFile || !preview || preview.errors.length > 0 || previewRows.length === 0) return;
    setApplying(true);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await api.postFormData<ImportApplyResponse>("/admin/pickup-schedules/import/", formData);
      toast.success(t("Import réussi : {created} créé(s), {updated} mis à jour.", { created: res.created, updated: res.updated }));
      resetImport();
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(parseApiError(err, t("Erreur lors de l'import.")));
    } finally {
      setApplying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleExport} className="btn-secondary !px-3 !py-2 text-sm">
            <Download className="h-4 w-4" /> {t("Exporter CSV")}
          </button>
          <label className={`btn-secondary !px-3 !py-2 text-sm ${previewing || applying ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            <Upload className="h-4 w-4" /> {previewing ? t("Prévisualisation…") : importFile ? importFile.name : t("Importer CSV")}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={previewing || applying}
              onChange={(e) => {
                void handleFileSelected(e.target.files?.[0] || null);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {preview && (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t("Aperçu de l'import CSV")}</h2>
                <p className="mt-1 text-sm text-gray-600">{t("Vérifiez les changements avant de les appliquer.")}</p>
              </div>
              <button onClick={resetImport} disabled={applying} className="btn-ghost !px-3 !py-2 text-sm">
                <X className="h-4 w-4" /> {t("Annuler")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-green-700">{t("À créer")}</p>
                <p className="text-xl font-semibold text-green-900">{preview.to_create.length}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{t("À mettre à jour")}</p>
                <p className="text-xl font-semibold text-blue-900">{preview.to_update.length}</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700">{t("Erreurs")}</p>
                <p className="text-xl font-semibold text-red-900">{preview.errors.length}</p>
              </div>
            </div>

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">{t("Ligne")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Action")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Région")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Villes")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Début")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Fin")}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t("Actif")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={`${row.action}-${row.row}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-900">{row.row}</td>
                        <td className="px-3 py-2 text-gray-700">{row.action}</td>
                        <td className="px-3 py-2 text-gray-700">{row.region_name}</td>
                        <td className="px-3 py-2 text-gray-600">{row.cities}</td>
                        <td className="px-3 py-2 text-gray-700">{row.start_date}</td>
                        <td className="px-3 py-2 text-gray-700">{row.end_date || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{row.active ? t("Oui") : t("Non")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">{t("Aucune ligne valide à importer.")}</p>
            )}

            {preview.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-900">
                  <AlertTriangle className="h-4 w-4" /> {t("Erreurs à corriger")}
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-red-900">
                      <tr>
                        <th className="px-2 py-1 text-left font-semibold">{t("Ligne")}</th>
                        <th className="px-2 py-1 text-left font-semibold">{t("Message")}</th>
                        <th className="px-2 py-1 text-left font-semibold">{t("Région")}</th>
                        <th className="px-2 py-1 text-left font-semibold">{t("Début")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.errors.map((error) => (
                        <tr key={error.row} className="border-t border-red-200">
                          <td className="px-2 py-1 font-medium text-red-950">{error.row}</td>
                          <td className="px-2 py-1 text-red-900">{error.messages.join(" ")}</td>
                          <td className="px-2 py-1 text-red-900">{error.data.region_name || "—"}</td>
                          <td className="px-2 py-1 text-red-900">{error.data.start_date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={resetImport} disabled={applying} className="btn-ghost !px-3 !py-2 text-sm">
                <X className="h-4 w-4" /> {t("Annuler")}
              </button>
              <button
                onClick={handleApplyImport}
                disabled={applying || previewing || preview.errors.length > 0 || previewRows.length === 0}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                <Check className="h-4 w-4" /> {applying ? t("Import…") : t("Appliquer l'import")}
              </button>
            </div>
          </div>
        )}

        <AdminScheduleEditor key={reloadKey} />
      </div>
    </AdminLayout>
  );
}

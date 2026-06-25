"use client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminScheduleEditor from "@/components/admin/AdminScheduleEditor";
import { useState } from "react";
import { toast } from "sonner";
import { api, downloadFile } from "@/lib/api";
import { Download, Upload } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AdminSchedulesPage() {
  const { t } = useTranslation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      await downloadFile("/admin/pickup-schedules/export/csv/", "tournees_ramassage.csv");
    } catch {
      toast.error(t("Erreur lors de l'export CSV."));
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await api.postFormData<any>("/admin/pickup-schedules/import/", formData);
      toast.success(t("Import réussi : {created} créé(s), {updated} mis à jour.", { created: res.created, updated: res.updated }));
      setImportFile(null);
      window.location.reload();
    } catch {
      toast.error(t("Erreur lors de l'import."));
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleExport} className="btn-secondary !px-3 !py-2 text-sm">
            <Download className="h-4 w-4" /> {t("Exporter CSV")}
          </button>
          <label className="btn-secondary !px-3 !py-2 cursor-pointer text-sm">
            <Upload className="h-4 w-4" /> {importFile ? importFile.name : t("Importer CSV")}
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
          </label>
          {importFile && (
            <button onClick={handleImport} disabled={importing} className="btn-primary !px-4 !py-2 text-sm">
              {importing ? t("Import…") : t("Lancer l'import")}
            </button>
          )}
        </div>
        <AdminScheduleEditor />
      </div>
    </AdminLayout>
  );
}

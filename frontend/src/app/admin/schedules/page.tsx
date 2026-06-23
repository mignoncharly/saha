"use client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminScheduleEditor from "@/components/admin/AdminScheduleEditor";
import { useState } from "react";
import { api, downloadFile } from "@/lib/api";
import { Download, Upload } from "lucide-react";

export default function AdminSchedulesPage() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      await downloadFile("/admin/pickup-schedules/export/csv/", "tournees_ramassage.csv");
    } catch {
      setImportResult("Erreur lors de l'export CSV.");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      const res = await api.postFormData<any>("/admin/pickup-schedules/import/", formData);
      setImportResult(`Import réussi : ${res.created} créé(s), ${res.updated} mis à jour.`);
      setImportFile(null);
      // Refresh the editor? We'll trigger a page reload.
      window.location.reload();
    } catch (e: any) {
      setImportResult("Erreur lors de l'import.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tournées de ramassage</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary inline-flex items-center gap-2 text-sm py-2">
            <Download className="h-4 w-4" /> Exporter CSV
          </button>
          <label className="btn-secondary inline-flex items-center gap-2 text-sm py-2 cursor-pointer">
            <Upload className="h-4 w-4" /> Importer CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </label>
          {importFile && (
            <button onClick={handleImport} className="btn-primary text-sm py-2 px-4">
              Lancer l'import
            </button>
          )}
        </div>
      </div>
      {importResult && <p className="mb-4 text-sm text-gray-600">{importResult}</p>}
      <AdminScheduleEditor />
    </AdminLayout>
  );
}
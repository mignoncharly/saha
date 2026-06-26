"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import { useTranslation } from "@/lib/i18n";

interface AuditRow {
  id: number;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ENTITY_TYPES = ["TransportRequest", "PriceRule", "ServiceType", "PickupSchedule", "LoadingDate"];

export default function AdminAuditLog() {
  const { t, formatDate } = useTranslation();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = entityType ? `?entity_type=${entityType}` : "";
    api
      .get<{ results: AuditRow[] }>(`/admin/audit/${qs}`)
      .then((d) => setRows(d.results))
      .catch(() => toast.error(t("Erreur de chargement.")))
      .finally(() => setLoading(false));
  }, [entityType, t]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">{t("Journal d'audit")}</h2>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="input !w-auto !py-2">
          <option value="">{t("Toutes les entités")}</option>
          {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingState label={t("Chargement…")} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-7 w-7" />} title={t("Aucune entrée")} description={t("Les actions des administrateurs apparaîtront ici.")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("Date")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Acteur")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Action")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Entité")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("Détails")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">{r.actor_email || t("Système")}</td>
                  <td className="px-4 py-3">{r.action}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.entity_type}#{r.entity_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{JSON.stringify(r.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

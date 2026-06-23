import { api } from "@/lib/api";
import type { PickupSchedule, LoadingDate } from "@/types/api";
import PickupScheduleCard from "@/components/public/PickupScheduleCard";
import { CalendarCheck } from "lucide-react";

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  let schedules: PickupSchedule[] = [];
  let loadingDates: LoadingDate[] = [];
  try {
    schedules = await api.get<PickupSchedule[]>("/pickup-schedules/");
    loadingDates = await api.get<LoadingDate[]>("/loading-dates/");
  } catch (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Calendrier de ramassage</h1>
        <p className="text-red-500">Impossible de charger les données.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Calendrier de ramassage</h1>
      <p className="text-gray-500 mb-10">Prochaines tournées de collecte en Europe.</p>

      {loadingDates.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-gold" /> Prochain chargement
          </h2>
          {loadingDates.map((ld) => (
            <div key={ld.id} className="card bg-brand-blue text-white p-4 mb-3">
              <p className="text-lg font-semibold">
                {new Date(ld.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {ld.title && <p className="text-sm opacity-80">{ld.title}</p>}
              {ld.description && <p className="text-sm opacity-80">{ld.description}</p>}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Tournées de ramassage</h2>
      {schedules.length === 0 && <p className="text-gray-500">Aucune tournée programmée pour le moment.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {schedules.map((s) => (
          <PickupScheduleCard key={s.id} schedule={s} />
        ))}
      </div>
    </div>
  );
}
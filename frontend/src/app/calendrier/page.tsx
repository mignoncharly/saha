import Link from "next/link";
import { api } from "@/lib/api";
import type { PickupSchedule, LoadingDate } from "@/types/api";
import { CalendarDays, CalendarCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PickupScheduleCard from "@/components/public/PickupScheduleCard";
import CalendarNotifyCTA from "@/components/public/CalendarNotifyCTA";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { getServerTranslation } from "@/lib/i18n-server";

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

function formatLong(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CalendrierPage() {
  const { t, locale, localeTag } = getServerTranslation();
  let schedules: PickupSchedule[] = [];
  let loadingDates: LoadingDate[] = [];
  let failed = false;
  try {
    [schedules, loadingDates] = await Promise.all([
      api.get<PickupSchedule[]>("/pickup-schedules/", { headers: { "Accept-Language": locale } }),
      api.get<LoadingDate[]>("/loading-dates/", { headers: { "Accept-Language": locale } }),
    ]);
  } catch {
    failed = true;
  }

  return (
    <>
      <PageHeader
        hero
        icon={<CalendarDays className="h-8 w-8" />}
        title={t("Calendrier de ramassage")}
        subtitle={t("Planifiez votre envoi selon nos prochaines tournées de collecte en Europe.")}
        actions={
          <Link href="/demande" className="btn-primary !px-6 !py-3">
            {t("Je veux être contacté")}
          </Link>
        }
      />

      <div className="container-page space-y-12 py-14">
        {failed ? (
          <ErrorState message={t("Impossible de charger le calendrier pour le moment.")} action={<WhatsAppCTA />} />
        ) : (
          <>
            {loadingDates.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <CalendarCheck className="h-6 w-6 text-brand-gold" /> {t("Prochain chargement")}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {loadingDates.map((ld) => (
                    <div key={ld.id} className="rounded-2xl bg-gradient-to-br from-brand-blue to-navy-900 p-6 text-white">
                      <p className="text-lg font-bold">{formatLong(ld.date, localeTag)}</p>
                      {ld.title && <p className="mt-1 text-sm text-blue-100">{ld.title}</p>}
                      {ld.description && <p className="mt-1 text-sm text-blue-100">{ld.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900">{t("Tournées de ramassage")}</h2>
              {schedules.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-7 w-7" />}
                  title={t("Aucune tournée programmée")}
                  description={t("Aucune date de ramassage n'est publiée pour le moment. Faites une demande et nous vous contacterons.")}
                  action={
                    <Link href="/demande" className="btn-primary">
                      {t("Faire une demande")}
                    </Link>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {schedules.map((s) => (
                    <PickupScheduleCard key={s.id} schedule={s} />
                  ))}
                </div>
              )}
            </section>

            <CalendarNotifyCTA />
          </>
        )}
      </div>
    </>
  );
}

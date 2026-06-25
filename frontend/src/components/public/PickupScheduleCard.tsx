"use client";
import { CalendarDays, MapPin } from "lucide-react";
import type { PickupSchedule } from "@/types/api";
import { useTranslation } from "@/lib/i18n";

interface Props {
  schedule: PickupSchedule;
}

export default function PickupScheduleCard({ schedule }: Props) {
  const { formatDate } = useTranslation();
  const formatted = (date: string) => formatDate(date, { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
          <MapPin className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{schedule.region_name}</h3>
          {schedule.cities && <p className="text-sm text-gray-500">{schedule.cities}</p>}
        </div>
      </div>
      <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-blue/5 px-3 py-1.5 text-sm font-semibold text-brand-blue">
        <CalendarDays className="h-4 w-4" />
        {formatted(schedule.start_date)}
        {schedule.end_date && schedule.end_date !== schedule.start_date && (
          <> – {formatted(schedule.end_date)}</>
        )}
      </div>
      {schedule.notes && <p className="mt-3 text-xs text-gray-400">{schedule.notes}</p>}
    </div>
  );
}

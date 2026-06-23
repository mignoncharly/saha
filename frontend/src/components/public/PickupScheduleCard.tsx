import { CalendarDays, MapPin } from "lucide-react";
import type { PickupSchedule } from "@/types/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  schedule: PickupSchedule;
}

export default function PickupScheduleCard({ schedule }: Props) {
  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-2">
        <MapPin className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-base">{schedule.region_name}</h3>
          {schedule.cities && <p className="text-sm text-gray-500">{schedule.cities}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-brand-blue mt-3">
        <CalendarDays className="h-4 w-4" />
        {formatDate(schedule.start_date)}
        {schedule.end_date && schedule.end_date !== schedule.start_date && (
          <> – {formatDate(schedule.end_date)}</>
        )}
      </div>
      {schedule.notes && <p className="text-xs text-gray-400 mt-2">{schedule.notes}</p>}
    </div>
  );
}
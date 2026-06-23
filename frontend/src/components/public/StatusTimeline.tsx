import { Check, Clock, Circle } from "lucide-react";

const statusSteps = [
  { key: "new", label: "Nouveau", icon: Clock },
  { key: "contacted", label: "Contacté", icon: Check },
  { key: "confirmed", label: "Confirmé", icon: Check },
  { key: "pickup_scheduled", label: "Ramassage planifié", icon: Clock },
  { key: "received", label: "Reçu", icon: Check },
  { key: "loaded", label: "Chargé", icon: Check },
  { key: "in_transit", label: "En route", icon: Clock },
  { key: "arrived_cameroon", label: "Arrivé au Cameroun", icon: Check },
  { key: "delivered", label: "Livré", icon: Check },
  { key: "cancelled", label: "Annulé", icon: Circle },
];

interface Props {
  currentStatus: string;
}

export default function StatusTimeline({ currentStatus }: Props) {
  const currentIndex = statusSteps.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="space-y-4">
      {statusSteps.map((step, idx) => {
        const isActive = idx <= currentIndex && !isCancelled;
        const isCurrent = step.key === currentStatus;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive ? "bg-brand-blue text-white" : "bg-gray-200 text-gray-500"
              } ${isCurrent ? "ring-2 ring-brand-gold" : ""}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="pt-1">
              <span className={`text-sm font-medium ${isActive ? "text-brand-blue" : "text-gray-500"}`}>
                {step.label}
              </span>
              {isCurrent && <p className="text-xs text-brand-gold mt-0.5">État actuel</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
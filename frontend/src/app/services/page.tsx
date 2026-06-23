import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";
import { Package, Drum, Car, HelpCircle, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  barrel: Drum,
  cube: HelpCircle,
  car: Car,
  "help-circle": HelpCircle,
};

export default async function ServicesPage() {
  let services: ServiceType[] = [];
  try {
    services = await api.get<ServiceType[]>("/services/");
  } catch (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Services</h1>
        <p className="text-red-500">Impossible de charger les services.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Nos services</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => {
          const Icon = iconMap[s.icon] || HelpCircle;
          return (
            <div key={s.id} className="card text-center">
              <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold mb-4">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold mb-2">{s.name}</h2>
              <p className="text-gray-600">{s.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
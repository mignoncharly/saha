import Link from "next/link";
import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";
import { Package, Drum, Car, HelpCircle, Boxes, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ServiceCard from "@/components/public/ServiceCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  barrel: Drum,
  cube: Boxes,
  car: Car,
  "help-circle": HelpCircle,
};

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  let services: ServiceType[] = [];
  let failed = false;
  try {
    services = await api.get<ServiceType[]>("/services/");
  } catch {
    failed = true;
  }

  return (
    <>
      <PageHeader
        hero
        icon={<Package className="h-8 w-8" />}
        title="Nos services de transport"
        subtitle="Du colis au véhicule chargé, SAHA Transport & Logistics achemine vos biens d'Europe vers le Cameroun."
        actions={
          <Link href="/demande" className="btn-primary !px-6 !py-3">
            Demander un ramassage
          </Link>
        }
      />

      <div className="container-page py-14">
        {failed ? (
          <ErrorState message="Impossible de charger les services pour le moment." action={<WhatsAppCTA />} />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Package className="h-7 w-7" />}
            title="Aucun service disponible"
            description="Nos services seront bientôt affichés ici. Contactez-nous pour toute demande."
            action={<WhatsAppCTA />}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  name={s.name}
                  description={s.description}
                  icon={iconMap[s.icon] || HelpCircle}
                  href="/demande"
                />
              ))}
            </div>

            <div className="mt-10 flex items-start gap-3 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5 text-sm text-gray-700">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
              <p>
                Le prix final est confirmé par STL après réception de votre demande et vérification des
                informations (volume, poids, destination).
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

import HeroSection from "@/components/public/HeroSection";
import ServiceCard from "@/components/public/ServiceCard";
import Link from "next/link";
import { Package, Drum, Car, HelpCircle, ArrowRight, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import type { ServiceType } from "@/types/api";

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  barrel: Drum,
  cube: HelpCircle,
  car: Car,
  "help-circle": HelpCircle,
};

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  let services: ServiceType[] = [];
  try {
    services = await api.get<ServiceType[]>("/services/");
  } catch (error) {
    // fallback to empty, render nothing
  }

  return (
    <>
      <HeroSection />
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Nos services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              name={s.name}
              description={s.description}
              icon={iconMap[s.icon] || HelpCircle}
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/services" className="btn-secondary inline-flex items-center gap-2">
            Voir tous les services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-brand-light py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à envoyer vos biens ?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Demandez un ramassage en quelques clics et suivez votre envoi jusqu&apos;à destination.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/demande" className="btn-primary text-lg px-8 py-4">
              Demander un ramassage
            </Link>
            <Link href="/suivi" className="btn-secondary text-lg px-8 py-4">
              Suivre une demande
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
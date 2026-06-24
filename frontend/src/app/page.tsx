import Link from "next/link";
import {
  Package,
  Drum,
  Car,
  HelpCircle,
  Boxes,
  Truck,
  MapPin,
  BellRing,
  ArrowRight,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ServiceType, PriceRule, PickupSchedule, LoadingDate } from "@/types/api";
import HeroSection from "@/components/public/HeroSection";
import ServiceCard from "@/components/public/ServiceCard";
import PriceCard from "@/components/public/PriceCard";
import PickupScheduleCard from "@/components/public/PickupScheduleCard";
import HowItWorks from "@/components/public/HowItWorks";
import FAQAccordion from "@/components/public/FAQAccordion";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import Section, { SectionHeading } from "@/components/ui/Section";
import EmptyState from "@/components/ui/EmptyState";
import { faqItems } from "@/lib/faq";

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  barrel: Drum,
  cube: Boxes,
  car: Car,
  "help-circle": HelpCircle,
};

const trustItems = [
  { icon: MapPin, title: "Ramassage en Europe", text: "Allemagne, France, Luxembourg et plus." },
  { icon: Truck, title: "Livraison au Cameroun", text: "Douala, Yaoundé et Bafoussam." },
  { icon: Boxes, title: "Colis, fûts, m³, véhicules", text: "Tous types de biens et marchandises." },
  { icon: BellRing, title: "Suivi & notifications", text: "Informé à chaque étape de l'envoi." },
];

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

async function safeGet<T>(endpoint: string): Promise<T[]> {
  try {
    return await api.get<T[]>(endpoint);
  } catch {
    return [];
  }
}

export default async function Home() {
  const [services, prices, schedules, loadingDates] = await Promise.all([
    safeGet<ServiceType>("/services/"),
    safeGet<PriceRule>("/prices/"),
    safeGet<PickupSchedule>("/pickup-schedules/"),
    safeGet<LoadingDate>("/loading-dates/"),
  ]);

  const nextLoading = loadingDates[0];

  return (
    <>
      <HeroSection />

      {/* Trust badges */}
      <Section className="!py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Services preview */}
      {services.length > 0 && (
        <Section muted>
          <SectionHeading eyebrow="Nos services" title="Ce que nous transportons" description="Du colis au véhicule chargé, nous acheminons vos biens en toute sécurité." />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((s) => (
              <ServiceCard key={s.id} name={s.name} description={s.description} icon={iconMap[s.icon] || HelpCircle} href="/demande" />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/services" className="btn-secondary">
              Voir tous les services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      )}

      {/* How it works */}
      <Section>
        <SectionHeading eyebrow="Comment ça marche" title="Un envoi simple, en 5 étapes" description="De la demande à la livraison, nous vous accompagnons à chaque étape." />
        <HowItWorks />
      </Section>

      {/* Pickup schedule preview */}
      <Section muted>
        <SectionHeading eyebrow="Calendrier" title="Prochaines tournées de ramassage" description="Planifiez votre envoi selon nos prochaines collectes en Europe." />
        {nextLoading && (
          <div className="mb-8 flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br from-brand-blue to-navy-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-8 w-8 text-brand-gold" />
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-100">Prochain chargement</p>
                <p className="text-lg font-bold">
                  {new Date(nextLoading.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                {nextLoading.title && <p className="text-sm text-blue-100">{nextLoading.title}</p>}
              </div>
            </div>
            <Link href="/demande" className="btn-secondary !border-white !bg-white !text-brand-blue">
              Réserver ma place
            </Link>
          </div>
        )}
        {schedules.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schedules.slice(0, 3).map((s) => (
              <PickupScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        ) : (
          !nextLoading && (
            <EmptyState
              icon={<CalendarCheck className="h-7 w-7" />}
              title="Aucune tournée programmée"
              description="Aucune date de ramassage n'est publiée pour le moment. Contactez-nous pour planifier votre envoi."
              action={<WhatsAppCTA />}
            />
          )
        )}
        {(schedules.length > 0 || nextLoading) && (
          <div className="mt-10 text-center">
            <Link href="/calendrier" className="btn-secondary">
              Voir le calendrier complet <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Section>

      {/* Pricing preview */}
      {prices.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Tarifs" title="Des prix transparents" description="Les prix affichés sont indicatifs. Le prix final est confirmé après vérification de votre demande." />
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {prices.slice(0, 6).map((p) => (
              <PriceCard key={p.id} price={p} />
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/tarifs" className="btn-primary">
              Obtenir une estimation
            </Link>
            <WhatsAppCTA />
          </div>
        </Section>
      )}

      {/* FAQ preview */}
      <Section muted>
        <SectionHeading eyebrow="FAQ" title="Questions fréquentes" />
        <div className="mx-auto max-w-3xl">
          <FAQAccordion items={faqItems.slice(0, 4)} />
          <div className="mt-8 text-center">
            <Link href="/faq" className="btn-secondary">
              Toutes les questions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-brand-blue to-navy-900 text-white">
        <div className="container-page py-16 text-center">
          <h2 className="font-display text-3xl font-bold">Prêt à envoyer vos biens ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Demandez un ramassage en quelques clics et suivez votre envoi jusqu&apos;à destination.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/demande" className="btn-primary !px-7 !py-3.5 text-base">
              Demander un ramassage
            </Link>
            <Link href="/suivi" className="btn !px-7 !py-3.5 border border-white/40 bg-transparent text-base text-white hover:bg-white/10">
              Suivre une demande
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

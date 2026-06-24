import Link from "next/link";
import { api } from "@/lib/api";
import type { PriceRule } from "@/types/api";
import { Tag, Info } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import PriceCard from "@/components/public/PriceCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

export default async function TarifsPage() {
  let prices: PriceRule[] = [];
  let failed = false;
  try {
    prices = await api.get<PriceRule[]>("/prices/");
  } catch {
    failed = true;
  }

  // Group by service name, preserving first-seen order.
  const grouped: Record<string, PriceRule[]> = {};
  for (const p of prices) {
    const name = p.service_name || "Autre";
    (grouped[name] ||= []).push(p);
  }

  return (
    <>
      <PageHeader
        hero
        icon={<Tag className="h-8 w-8" />}
        title="Tarifs indicatifs"
        subtitle="Une idée claire des prix avant de nous contacter. Le prix final est confirmé après vérification de votre demande."
        actions={
          <Link href="/demande" className="btn-primary !px-6 !py-3">
            Obtenir une estimation
          </Link>
        }
      />

      <div className="container-page py-14">
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5 text-sm text-gray-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
          <p>
            Les prix affichés sont indicatifs. Le prix final est confirmé après vérification des
            informations (volume, poids, destination).
          </p>
        </div>

        {failed ? (
          <ErrorState message="Impossible de charger les tarifs pour le moment." action={<WhatsAppCTA />} />
        ) : prices.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-7 w-7" />}
            title="Aucun tarif publié"
            description="Contactez-nous pour obtenir un devis personnalisé pour votre envoi."
            action={<WhatsAppCTA />}
          />
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([serviceName, items]) => (
              <div key={serviceName}>
                <h2 className="mb-4 text-xl font-bold text-brand-blue">{serviceName}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map((item) => (
                    <PriceCard key={item.id} price={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/demande" className="btn-primary">
            Obtenir une estimation
          </Link>
          <WhatsAppCTA />
        </div>
      </div>
    </>
  );
}

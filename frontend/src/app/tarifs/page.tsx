import { api } from "@/lib/api";
import type { PriceRule } from "@/types/api";
import PriceCard from "@/components/public/PriceCard";

// Render at request time so public data is always live and never baked at build time.
export const dynamic = "force-dynamic";

export default async function TarifsPage() {
  let prices: PriceRule[] = [];
  try {
    prices = await api.get<PriceRule[]>("/prices/");
  } catch (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Tarifs</h1>
        <p className="text-red-500">Impossible de charger les tarifs.</p>
      </div>
    );
  }

  // Group by service_name
  const grouped: Record<string, PriceRule[]> = {};
  prices.forEach((p) => {
    const name = p.service_name || "Autre";
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(p);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Tarifs indicatifs</h1>
      <p className="text-gray-500 mb-10">Les prix sont donnés à titre d&apos;exemple et peuvent varier. Contactez-nous pour un devis personnalisé.</p>
      {Object.entries(grouped).map(([serviceName, items]) => (
        <div key={serviceName} className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-brand-blue">{serviceName}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <PriceCard key={item.id} price={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
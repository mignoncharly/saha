import { Euro } from "lucide-react";
import type { PriceRule } from "@/types/api";

interface Props {
  price: PriceRule;
}

export default function PriceCard({ price }: Props) {
  const amount = parseFloat(price.price_amount);
  const formatted = Number.isFinite(amount) ? amount.toFixed(2) : price.price_amount;
  const isEuro = !price.currency || price.currency.toUpperCase() === "EUR";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-gray-900">{price.label}</h3>
        {price.unit && <p className="text-sm text-gray-500">par {price.unit}</p>}
        {price.description && <p className="mt-1 text-sm text-gray-400">{price.description}</p>}
      </div>
      <div className="flex shrink-0 items-baseline gap-1 text-xl font-bold text-brand-blue">
        {isEuro ? <Euro className="h-5 w-5 self-center" /> : null}
        {formatted}
        {!isEuro && <span className="text-sm font-semibold">{price.currency}</span>}
      </div>
    </div>
  );
}

import { Euro } from "lucide-react";
import type { PriceRule } from "@/types/api";

interface Props {
  price: PriceRule;
}

export default function PriceCard({ price }: Props) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-lg">{price.label}</h3>
        {price.unit && <p className="text-sm text-gray-500">par {price.unit}</p>}
        {price.description && <p className="text-sm text-gray-400 mt-1">{price.description}</p>}
      </div>
      <div className="flex items-center gap-1 text-xl font-bold text-brand-blue">
        <Euro className="h-5 w-5" />
        {parseFloat(price.price_amount).toFixed(2)}
      </div>
    </div>
  );
}
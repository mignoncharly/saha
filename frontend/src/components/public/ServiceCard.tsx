import { LucideIcon } from "lucide-react";
interface Props {
  name: string;
  description: string;
  icon: LucideIcon;
}
export default function ServiceCard({ name, description, icon: Icon }: Props) {
  return (
    <div className="card text-center hover:border-brand-gold transition-colors">
      <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-bold text-lg mb-2">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
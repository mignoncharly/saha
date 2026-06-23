import { MessageCircle } from "lucide-react";
import { buildWhatsAppPrefill, whatsappLink } from "@/lib/whatsapp";

interface Props {
  reference?: string;
  pickup?: string;
  destination?: string;
  className?: string;
}

export default function WhatsAppCTA({ reference, pickup, destination, className }: Props) {
  const url = reference
    ? buildWhatsAppPrefill(reference, pickup || "", destination || "")
    : whatsappLink();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-white font-semibold shadow hover:bg-green-600 transition-colors ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      Contacter sur WhatsApp
    </a>
  );
}
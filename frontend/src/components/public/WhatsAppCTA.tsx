"use client";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppPrefill, whatsappLink } from "@/lib/whatsapp";
import { useTranslation } from "@/lib/i18n";

interface Props {
  reference?: string;
  pickup?: string;
  destination?: string;
  className?: string;
  /** Render only the WhatsApp icon (compact, e.g. mobile navbar). */
  iconOnly?: boolean;
}

export default function WhatsAppCTA({ reference, pickup, destination, className = "", iconOnly = false }: Props) {
  const { t } = useTranslation();
  const url = reference
    ? buildWhatsAppPrefill(reference, pickup || "", destination || "", t)
    : whatsappLink();
  const label = t("cta.whatsapp");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`btn-whatsapp ${className}`}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      {!iconOnly && label}
    </a>
  );
}

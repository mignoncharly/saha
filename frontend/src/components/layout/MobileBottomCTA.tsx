"use client";
import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export default function MobileBottomCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden z-50">
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-medium"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp
      </a>
      <Link
        href="/demande"
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-red text-white font-medium"
      >
        <Phone className="h-5 w-5" />
        Ramassage
      </Link>
    </div>
  );
}
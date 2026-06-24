import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-brand-blue to-blue-900 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
          Transport de colis, fûts, véhicules et marchandises vers le Cameroun
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          SAHA Transport & Logistics organise vos ramassages en Europe et vos livraisons à Douala, Yaoundé et Bafoussam.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/demande" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
            Demander un ramassage <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2 border-white bg-transparent text-white hover:bg-white/10"
          >
            <MessageCircle className="h-5 w-5" /> Contacter sur WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
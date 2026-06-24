import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, Bell } from "lucide-react";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";

const badges = [
  { icon: ShieldCheck, label: "Transport fiable & suivi" },
  { icon: MapPin, label: "Ramassage partout en Europe" },
  { icon: Bell, label: "Notifications de chargement" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-navy-800 to-navy-900 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(249,168,37,0.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(255,255,255,0.15), transparent 35%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative py-16 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-brand-gold ring-1 ring-white/15">
            🇪🇺 Europe → Cameroun 🇨🇲
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Transport de colis, fûts, véhicules et marchandises vers le Cameroun
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            SAHA Transport &amp; Logistics organise vos ramassages en Europe et vos livraisons à Douala,
            Yaoundé et Bafoussam.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/demande" className="btn-primary !px-7 !py-3.5 text-base">
              Demander un ramassage <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/tarifs"
              className="btn !px-7 !py-3.5 border border-white/40 bg-transparent text-base text-white hover:bg-white/10"
            >
              Voir les tarifs
            </Link>
            <WhatsAppCTA className="!px-7 !py-3.5 text-base" />
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {badges.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-blue-100">
                <Icon className="h-5 w-5 text-brand-gold" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

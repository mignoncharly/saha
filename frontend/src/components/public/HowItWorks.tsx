"use client";
import { ClipboardList, PhoneCall, PackageCheck, Ship, BellRing } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const steps = [
  { icon: ClipboardList, title: "Vous faites une demande", text: "Décrivez vos biens et votre adresse de ramassage en quelques minutes." },
  { icon: PhoneCall, title: "STL vous contacte", text: "Notre équipe confirme les détails, le volume et le prix final." },
  { icon: PackageCheck, title: "Le ramassage est organisé", text: "Nous récupérons vos colis, fûts ou véhicules en Europe." },
  { icon: Ship, title: "Vos biens sont acheminés", text: "Transport sécurisé jusqu'à Douala, Yaoundé ou Bafoussam." },
  { icon: BellRing, title: "Vous êtes informé", text: "Suivez le statut et recevez des notifications à chaque étape." },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  return (
    <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Icon className="h-6 w-6" />
            </span>
            <span className="font-display text-3xl font-bold text-gray-100">{i + 1}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{t(title)}</h3>
          <p className="mt-1.5 text-sm text-gray-600">{t(text)}</p>
        </li>
      ))}
    </ol>
  );
}

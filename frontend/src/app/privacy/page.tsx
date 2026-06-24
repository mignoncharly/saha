import { ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  {
    title: "Collecte des données",
    body: "Nous collectons les informations que vous fournissez via le formulaire de demande de ramassage : nom, téléphone, email, adresse de ramassage, détails de la marchandise, et éventuellement des photos.",
  },
  {
    title: "Utilisation des données",
    body: "Ces données sont utilisées exclusivement pour organiser le transport de vos biens, vous contacter concernant votre demande, et vous informer de l'avancement. Elles ne sont jamais vendues ni partagées à des tiers non liés au service.",
  },
  {
    title: "Stockage et sécurité",
    body: "Vos données sont stockées sur des serveurs sécurisés en Europe. Nous appliquons des mesures de sécurité pour prévenir tout accès non autorisé.",
  },
  {
    title: "Vos droits",
    body: "Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant à contact@sahatransport.com. Les photos et informations personnelles sont supprimées sous 30 jours après finalisation de l'envoi.",
  },
  {
    title: "Cookies",
    body: "Ce site n'utilise pas de cookies de tracking.",
  },
  {
    title: "Modifications",
    body: "Cette politique peut être mise à jour ; la dernière version est toujours disponible sur cette page.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        hero
        icon={<ShieldCheck className="h-8 w-8" />}
        title="Politique de confidentialité"
        subtitle="SAHA Transport & Logistics s'engage à protéger vos données personnelles."
      />

      <div className="container-page max-w-3xl py-12">
        <p className="mb-8 text-gray-600">
          Cette politique explique quelles informations nous collectons et comment elles sont utilisées.
        </p>
        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.title} className="card">
              <h2 className="mb-2 text-lg font-bold text-gray-900">{s.title}</h2>
              <p className="text-gray-600">{s.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-400">Dernière mise à jour : juin 2026</p>
      </div>
    </>
  );
}

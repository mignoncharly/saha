"use client";
import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import FAQAccordion from "@/components/public/FAQAccordion";
import EmptyState from "@/components/ui/EmptyState";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import { getFaqItems } from "@/lib/faq";
import { useTranslation } from "@/lib/i18n";

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  const faqItems = getFaqItems(t);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? faqItems.filter((i) => i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q))
    : faqItems;

  return (
    <>
      <PageHeader
        hero
        icon={<HelpCircle className="h-8 w-8" />}
        title={t("Foire aux questions")}
        subtitle={t("Tout ce qu'il faut savoir sur le ramassage, les destinations, les prix et le suivi.")}
      />

      <div className="container-page max-w-3xl py-12">
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Rechercher une question…")}
            aria-label={t("Rechercher dans la FAQ")}
            className="input pl-11"
          />
        </div>

        {filtered.length > 0 ? (
          <FAQAccordion items={filtered} />
        ) : (
          <EmptyState
            icon={<HelpCircle className="h-7 w-7" />}
            title={t("Aucun résultat")}
            description={t("Aucune question ne correspond à votre recherche. Contactez-nous, nous vous répondrons directement.")}
            action={<WhatsAppCTA />}
          />
        )}

        <div className="mt-10 rounded-2xl bg-brand-light p-6 text-center">
          <p className="text-gray-700">{t("Vous ne trouvez pas votre réponse ?")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">{t("Nous contacter")}</Link>
            <WhatsAppCTA />
          </div>
        </div>
      </div>
    </>
  );
}

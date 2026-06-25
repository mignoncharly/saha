import Link from "next/link";
import { Compass } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { getServerTranslation } from "@/lib/i18n-server";

export default function NotFound() {
  const { t } = getServerTranslation();
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title={t("Page introuvable")}
        description={t("La page que vous recherchez n'existe pas ou a été déplacée.")}
        action={
          <Link href="/" className="btn-primary">
            {t("Retour à l'accueil")}
          </Link>
        }
        className="w-full max-w-lg"
      />
    </div>
  );
}

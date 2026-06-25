"use client";
import { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";
import { useTranslation } from "@/lib/i18n";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <ErrorState
        title={t("Une erreur est survenue")}
        message={t("Quelque chose s'est mal passé de notre côté. Veuillez réessayer.")}
        action={
          <button onClick={reset} className="btn-primary">
            {t("Réessayer")}
          </button>
        }
        className="w-full max-w-lg"
      />
    </div>
  );
}

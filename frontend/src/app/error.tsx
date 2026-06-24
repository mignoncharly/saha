"use client";
import { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <ErrorState
        title="Une erreur est survenue"
        message="Quelque chose s'est mal passé de notre côté. Veuillez réessayer."
        action={
          <button onClick={reset} className="btn-primary">
            Réessayer
          </button>
        }
        className="w-full max-w-lg"
      />
    </div>
  );
}

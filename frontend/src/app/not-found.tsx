import Link from "next/link";
import { Compass } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="Page introuvable"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        action={
          <Link href="/" className="btn-primary">
            Retour à l&apos;accueil
          </Link>
        }
        className="w-full max-w-lg"
      />
    </div>
  );
}

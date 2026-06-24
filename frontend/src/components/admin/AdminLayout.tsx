"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminShell from "./AdminShell";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { resolveRole } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const role = resolveRole(user?.role);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingState fullPage label="Vérification de l'accès…" />;
  }
  if (!user) return null;

  // Logged in but not an admin/staff member: deny access cleanly.
  if (role !== "admin") {
    return (
      <div className="container-page py-20">
        <ErrorState
          title="Accès refusé"
          message="Votre compte n'a pas les autorisations nécessaires pour accéder à l'espace administrateur."
          action={
            <Link href="/" className="btn-primary">
              Retour à l&apos;accueil
            </Link>
          }
        />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

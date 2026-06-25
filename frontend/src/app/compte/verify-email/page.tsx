"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import AuthCard from "@/components/auth/AuthCard";
import LoadingState from "@/components/ui/LoadingState";
import { useTranslation } from "@/lib/i18n";

type Status = "loading" | "success" | "error";

function VerifyEmailInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/auth/verify-email/?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <AuthCard title={t("Vérification en cours")} subtitle={t("Nous vérifions votre adresse email…")}>
        <LoadingState label={t("Veuillez patienter…")} />
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard
        icon={<CheckCircle className="h-6 w-6" />}
        title={t("Email vérifié !")}
        subtitle={t("Votre adresse email a bien été confirmée.")}
        footer={
          <Link href="/compte/connexion" className="font-semibold text-brand-blue hover:underline">
            {t("Se connecter")}
          </Link>
        }
      >
        <p className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
          {t("Vous pouvez maintenant profiter pleinement de votre espace STL.")}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={<XCircle className="h-6 w-6" />}
      title={t("Échec de la vérification")}
      subtitle={t("Le lien est invalide ou a expiré.")}
      footer={
        <Link href="/compte" className="font-semibold text-brand-blue hover:underline">
          {t("Aller à mon espace")}
        </Link>
      }
    >
      <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
        {t("Connectez-vous à votre espace pour renvoyer un email de vérification.")}
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState fullPage />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, CheckCircle } from "lucide-react";
import { api, parseApiError } from "@/lib/api";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/ui/FormField";
import PasswordInput from "@/components/ui/PasswordInput";
import LoadingState from "@/components/ui/LoadingState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !token) return setError(t("Lien invalide."));
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", { uid, token, new_password: newPassword });
      setSuccess(true);
      toast.success(t("Mot de passe réinitialisé."));
      setTimeout(() => router.push("/compte/connexion"), 2500);
    } catch (err) {
      // Surface server-side validator messages (e.g. password too short/common)
      // instead of a single generic line; Django localises them via Accept-Language.
      setError(parseApiError(err, t("Erreur lors de la réinitialisation. Le lien est peut-être expiré.")));
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <AuthCard
        title={t("Lien invalide")}
        subtitle={t("Ce lien de réinitialisation est invalide ou a expiré.")}
        footer={
          <Link href="/compte/mot-de-passe-oublie" className="font-semibold text-brand-blue hover:underline">
            {t("Demander un nouveau lien")}
          </Link>
        }
      >
        <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
          {t("Veuillez relancer la procédure de réinitialisation.")}
        </p>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard icon={<CheckCircle className="h-6 w-6" />} title={t("Mot de passe réinitialisé")} subtitle={t("Redirection vers la connexion…")}>
        <p className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
          {t("Votre mot de passe a été mis à jour avec succès.")}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard icon={<KeyRound className="h-6 w-6" />} title={t("Nouveau mot de passe")} subtitle={t("Choisissez un nouveau mot de passe pour votre compte.")}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <FormField label={t("Nouveau mot de passe")} htmlFor="new_password" required hint={t("Au moins 8 caractères.")}>
          <PasswordInput id="new_password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </FormField>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <LoadingSpinner className="h-5 w-5" /> : t("Réinitialiser")}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState fullPage />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

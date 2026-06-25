"use client";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { parseApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/ui/FormField";
import PasswordInput from "@/components/ui/PasswordInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      toast.success(t("Compte créé ! Un email de vérification vous a été envoyé."));
      router.push("/compte");
    } catch (err) {
      const message = parseApiError(err, t("Erreur lors de l'inscription."));
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      icon={<UserPlus className="h-6 w-6" />}
      title={t("Créer un compte")}
      subtitle={t("Suivez vos demandes et recevez des notifications de ramassage.")}
      footer={
        <>
          {t("Déjà un compte ?")}{" "}
          <Link href="/compte/connexion" className="font-semibold text-brand-blue hover:underline">
            {t("Se connecter")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <FormField label={t("Nom complet")} htmlFor="full_name" required>
          <input id="full_name" value={form.full_name} onChange={update("full_name")} required className="input" />
        </FormField>
        <FormField label={t("Email")} htmlFor="email" required>
          <input id="email" type="email" value={form.email} onChange={update("email")} required className="input" />
        </FormField>
        <FormField label={t("Mot de passe")} htmlFor="password" required hint={t("Au moins 8 caractères.")}>
          <PasswordInput id="password" value={form.password} onChange={update("password")} required minLength={8} />
        </FormField>
        <FormField label={t("Téléphone")} htmlFor="phone">
          <input id="phone" value={form.phone} onChange={update("phone")} className="input" />
        </FormField>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <LoadingSpinner className="h-5 w-5" /> : t("S'inscrire")}
        </button>
      </form>
    </AuthCard>
  );
}

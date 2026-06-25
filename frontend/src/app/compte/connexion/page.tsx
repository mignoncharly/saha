"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { parseApiError } from "@/lib/api";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/ui/FormField";
import PasswordInput from "@/components/ui/PasswordInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t("Connexion réussie."));
      router.push("/compte");
    } catch (err) {
      const message = parseApiError(err, t("Identifiants invalides."));
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={<LogIn className="h-6 w-6" />}
      title={t("Connexion")}
      subtitle={t("Accédez à votre espace pour suivre vos demandes.")}
      footer={
        <>
          {t("Pas encore de compte ?")}{" "}
          <Link href="/compte/inscription" className="font-semibold text-brand-blue hover:underline">
            {t("S'inscrire")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <FormField label={t("Email")} htmlFor="email" required>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </FormField>
        <FormField label={t("Mot de passe")} htmlFor="password" required>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormField>
        <div className="text-right">
          <Link href="/compte/mot-de-passe-oublie" className="text-sm text-brand-blue hover:underline">
            {t("Mot de passe oublié ?")}
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <LoadingSpinner className="h-5 w-5" /> : t("Se connecter")}
        </button>
      </form>
    </AuthCard>
  );
}

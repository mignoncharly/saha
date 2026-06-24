"use client";
import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/ui/FormField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email });
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={sent ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
      title="Mot de passe oublié"
      subtitle={sent ? undefined : "Entrez votre email pour recevoir un lien de réinitialisation."}
      footer={
        <Link href="/compte/connexion" className="font-semibold text-brand-blue hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
          Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <FormField label="Email" htmlFor="email" required>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
          </FormField>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <LoadingSpinner className="h-5 w-5" /> : "Envoyer le lien"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

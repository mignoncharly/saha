"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { parseApiError } from "@/lib/api";
import { resolveRole } from "@/lib/navigation";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/ui/FormField";
import PasswordInput from "@/components/ui/PasswordInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      // Only admin/staff may enter the admin area.
      if (resolveRole(user.role) !== "admin") {
        logout();
        setError("Ce compte n'a pas accès à l'espace administrateur.");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err) {
      setError(parseApiError(err, "Identifiants invalides."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={<ShieldCheck className="h-6 w-6" />}
      title="Espace administrateur"
      subtitle="Connexion réservée à l'équipe STL."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <FormField label="Email" htmlFor="admin-email" required>
          <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </FormField>
        <FormField label="Mot de passe" htmlFor="admin-password" required>
          <PasswordInput id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormField>
        <button type="submit" disabled={loading} className="btn-navy w-full">
          {loading ? <LoadingSpinner className="h-5 w-5" /> : "Se connecter"}
        </button>
      </form>
    </AuthCard>
  );
}

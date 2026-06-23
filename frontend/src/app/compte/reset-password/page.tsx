"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !token) return setError("Lien invalide.");
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", { uid, token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/compte/connexion"), 3000);
    } catch {
      setError("Erreur lors de la réinitialisation. Le lien est peut-être expiré.");
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center text-red-500">Lien invalide ou expiré.</div>;
  }
  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-green-600">
        Mot de passe réinitialisé. Redirection...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Nouveau mot de passe</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border p-2 rounded"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">Chargement...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

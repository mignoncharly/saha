"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/compte");
    } catch (err) {
      setError("Identifiants invalides.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded">{error}</div>}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border p-2 rounded" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-2 rounded" />
          <button type="submit" className="btn-primary w-full">Se connecter</button>
        </form>
        <p className="mt-4 text-sm text-center">
          Pas de compte ? <Link href="/compte/inscription" className="text-brand-blue underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import { api, parseApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post<{ token: string }>("/auth/register/", form);
      setToken(res.token);
      router.push("/compte");
    } catch (err) {
      setError(parseApiError(err, "Erreur lors de l'inscription."));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded">{error}</div>}
          <input placeholder="Nom complet" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="w-full border p-2 rounded" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full border p-2 rounded" />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required className="w-full border p-2 rounded" />
          <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" />
          <button type="submit" className="btn-primary w-full">S'inscrire</button>
        </form>
      </div>
    </div>
  );
}
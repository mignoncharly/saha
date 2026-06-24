"use client";
import { useAuth, userDisplayName } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TransportRequestListItem } from "@/types/request";
import Link from "next/link";

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<TransportRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/compte/connexion");
      return;
    }
    setLoading(true);
    api
      .get<TransportRequestListItem[]>("/transport-requests/my-requests/")
      .then(setRequests)
      .catch(() => setError("Impossible de charger vos demandes."))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-gray-500">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <button onClick={logout} className="text-sm text-brand-blue underline">
          Se déconnecter
        </button>
      </div>
      <p>Bienvenue, {userDisplayName(user, user.email)}</p>
      <h2 className="text-xl font-semibold mt-8 mb-4">Mes demandes</h2>
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">Aucune demande pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/suivi?ref=${req.reference_code}`}
              className="block card hover:shadow-md"
            >
              <div className="flex justify-between">
                <span className="font-mono">{req.reference_code}</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{req.status}</span>
              </div>
              <p className="text-sm text-gray-600">
                Ramassage: {req.pickup_city}
                {req.destination_name ? ` → ${req.destination_name}` : ""}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(req.created_at).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

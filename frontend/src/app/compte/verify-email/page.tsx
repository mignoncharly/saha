"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api.get(`/auth/verify-email/?token=${token}`).then(() => setStatus("success")).catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {status === "loading" && <p>Vérification de votre email...</p>}
      {status === "success" && <div className="text-green-600"><h1 className="text-2xl font-bold">Email vérifié !</h1><p>Vous pouvez maintenant vous connecter.</p></div>}
      {status === "error" && <div className="text-red-500"><h1 className="text-2xl font-bold">Échec de vérification</h1><p>Le lien est invalide ou expiré.</p></div>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">Chargement...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import QRCode from "@/components/pwa/QRCode";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const pickup = searchParams.get("pickup") || "";
  const destination = searchParams.get("destination") || "";
  const [trackingUrl, setTrackingUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && ref) {
      setTrackingUrl(`${window.location.origin}/suivi?ref=${encodeURIComponent(ref)}`);
    }
  }, [ref]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-4">Demande envoyée !</h1>
      <p className="text-gray-600 mb-6">
        Votre demande a bien été enregistrée. L&apos;équipe STL vous contactera bientôt.
      </p>

      {ref && (
        <div className="bg-brand-light rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">Votre numéro de référence :</p>
          <p className="text-2xl font-bold text-brand-blue font-mono">{ref}</p>
          <p className="text-xs text-gray-400 mt-2">Conservez ce numéro pour suivre votre demande.</p>
          {trackingUrl && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <QRCode value={trackingUrl} />
              <p className="text-xs text-gray-400">Scannez pour suivre votre demande</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 items-center">
        <WhatsAppCTA reference={ref} pickup={pickup} destination={destination} />
        {ref && (
          <Link href={`/suivi?ref=${ref}`} className="text-brand-blue underline font-medium">
            Suivre cette demande
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-500">Chargement...</div>}>
      <ConfirmationInner />
    </Suspense>
  );
}

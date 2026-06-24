"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Copy, Check, MapPin, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";
import WhatsAppCTA from "@/components/public/WhatsAppCTA";
import QRCode from "@/components/pwa/QRCode";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const ref = searchParams.get("ref") || "";
  const pickup = searchParams.get("pickup") || "";
  const destination = searchParams.get("destination") || "";
  const [trackingUrl, setTrackingUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && ref) {
      setTrackingUrl(`${window.location.origin}/suivi?ref=${encodeURIComponent(ref)}`);
    }
  }, [ref]);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      toast.success("Référence copiée");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier la référence");
    }
  };

  return (
    <div className="container-page max-w-xl py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle className="h-9 w-9" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Demande envoyée !</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-600">
          Votre demande a bien été enregistrée. L&apos;équipe STL vous contactera bientôt pour confirmer les
          détails et le prix.
        </p>
      </div>

      {ref && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-card">
          <p className="text-sm text-gray-500">Votre numéro de référence</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold text-brand-blue">{ref}</span>
            <button
              onClick={copyRef}
              aria-label="Copier la référence"
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-blue"
            >
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Conservez ce numéro pour suivre votre demande.</p>

          {(pickup || destination) && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-light px-3 py-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-brand-gold" />
              {pickup || "—"} <ArrowRight className="h-4 w-4 text-gray-400" /> {destination || "—"}
            </div>
          )}

          {trackingUrl && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <QRCode value={trackingUrl} />
              <p className="text-xs text-gray-400">Scannez pour suivre votre demande</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-stretch gap-3">
        <WhatsAppCTA reference={ref} pickup={pickup} destination={destination} className="w-full" />
        {ref && (
          <Link href={`/suivi?ref=${ref}`} className="btn-secondary w-full">
            Voir le suivi <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link href="/" className="btn-ghost w-full">
          <Home className="h-4 w-4" /> Retour à l&apos;accueil
        </Link>
      </div>

      {!user && (
        <div className="mt-8 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 p-5 text-center text-sm text-gray-700">
          <p>
            Créez un compte pour retrouver toutes vos demandes et recevoir des notifications de suivi.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link href="/compte/inscription" className="btn-primary !px-5 !py-2">
              Créer un compte
            </Link>
            <Link href="/compte/connexion" className="btn-ghost !px-5 !py-2">
              Se connecter
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState fullPage />}>
      <ConfirmationInner />
    </Suspense>
  );
}

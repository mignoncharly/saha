"use client";
import Link from "next/link";
import { Bell, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import NotificationPermissionButton from "@/components/pwa/NotificationPermissionButton";

/**
 * On the calendar page: logged-in users can enable push notifications;
 * guests are invited to log in (push subscriptions are tied to an account).
 */
export default function CalendarNotifyCTA() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
          <Bell className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-semibold text-gray-900">Soyez alerté des prochains chargements</h3>
          <p className="text-sm text-gray-600">
            {user
              ? "Activez les notifications pour être informé des dates de ramassage."
              : "Connectez-vous pour recevoir les notifications de ramassage."}
          </p>
        </div>
      </div>
      {user ? (
        <NotificationPermissionButton />
      ) : (
        <Link href="/compte/connexion" className="btn-primary shrink-0">
          <LogIn className="h-4 w-4" /> Se connecter
        </Link>
      )}
    </div>
  );
}

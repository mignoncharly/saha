"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationPermissionButton() {
  const { permission, subscribe, isSubscribed } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await subscribe();
    } catch (err) {
      console.error("Subscribe failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (permission === "denied") return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading || isSubscribed}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-green-100 text-green-700"
          : "bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
      }`}
    >
      {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {isSubscribed ? "Notifications activées" : "Activer les notifications"}
    </button>
  );
}
"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications, PushUnsupportedError } from "@/hooks/usePushNotifications";
import { useTranslation } from "@/lib/i18n";

export default function NotificationPermissionButton({ className = "" }: { className?: string }) {
  const { permission, subscribe, isSubscribed, supported } = usePushNotifications();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await subscribe();
      toast.success(t("notif.success"));
    } catch (err) {
      console.error("Subscribe failed", err);
      if (err instanceof PushUnsupportedError) {
        toast.error(t("notif.unsupported"));
      } else if (err instanceof Error && err.message === "Permission denied") {
        toast.error(t("notif.denied"));
      } else {
        toast.error(t("notif.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Hide only when we know the browser can't do push at all, or the user has
  // already permanently blocked notifications.
  if (!supported || permission === "denied") return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading || isSubscribed}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 ${
        isSubscribed
          ? "bg-green-100 text-green-700"
          : "bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
      } ${className}`}
    >
      {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {isSubscribed ? t("notif.enabled") : t("notif.enable")}
    </button>
  );
}

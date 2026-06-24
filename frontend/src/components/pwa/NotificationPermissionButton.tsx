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
    // Browser permanently blocked notifications: can't re-prompt, so explain.
    if (permission === "denied") {
      toast.error(t("notif.denied"));
      return;
    }
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

  const base = `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 ${className}`;

  // Unsupported browser/context: show a disabled, explanatory state rather
  // than vanishing.
  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title={t("notif.unsupported")}
        className={`${base} bg-gray-100 text-gray-400 cursor-not-allowed`}
      >
        <BellOff className="h-4 w-4" />
        {t("notif.unavailable")}
      </button>
    );
  }

  const blocked = permission === "denied";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || isSubscribed}
      title={blocked ? t("notif.denied") : undefined}
      className={`${base} ${
        isSubscribed
          ? "bg-green-100 text-green-700"
          : blocked
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
      }`}
    >
      {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {isSubscribed ? t("notif.enabled") : blocked ? t("notif.blocked") : t("notif.enable")}
    </button>
  );
}

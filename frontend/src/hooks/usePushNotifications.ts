"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "prompt">("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
      );
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push not supported");
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") throw new Error("Permission denied");

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      setIsSubscribed(true);
      return;
    }

    const { public_key } = await api.get<{ public_key: string }>("/notifications/vapid-public-key/");
    const convertedKey = urlBase64ToUint8Array(public_key);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    const rawKey = subscription.getKey ? subscription.getKey("p256dh") : null;
    const rawAuthSecret = subscription.getKey ? subscription.getKey("auth") : null;
    const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : "";
    const auth = rawAuthSecret ? btoa(String.fromCharCode(...new Uint8Array(rawAuthSecret))) : "";

    await api.post("/notifications/subscribe/", {
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      region: "",
      language: "fr",
    });
    setIsSubscribed(true);
  }, []);

  return { permission, subscribe, isSubscribed };
}
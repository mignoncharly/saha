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

// Thrown when the browser context cannot support push (e.g. served over
// plain HTTP, or an old browser). Lets the UI show a specific message.
export class PushUnsupportedError extends Error {
  constructor() {
    super("Push not supported");
    this.name = "PushUnsupportedError";
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "prompt">("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const isSupported =
      "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
      );
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      throw new PushUnsupportedError();
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") throw new Error("Permission denied");

    // Make sure a service worker exists before waiting on `.ready`, otherwise
    // `.ready` can hang forever and the click appears to do nothing.
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js");
    }
    // Wait until the SW is active, but never hang silently.
    registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration>((_, reject) =>
        setTimeout(() => reject(new Error("Service worker not ready (timeout)")), 8000)
      ),
    ]);
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

  return { permission, subscribe, isSubscribed, supported };
}
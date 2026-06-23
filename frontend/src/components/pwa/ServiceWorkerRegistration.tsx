"use client";
import { useEffect } from "react";
import { registerSW } from "@/lib/pwa";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
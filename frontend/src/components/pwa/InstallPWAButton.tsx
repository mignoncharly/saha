"use client";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallPWAButton() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white shadow-soft-lg transition-colors hover:bg-navy-800 lg:bottom-6"
      aria-label="Installer l'application"
    >
      <Download className="h-5 w-5" />
      <span className="hidden sm:inline">Installer l&apos;app</span>
    </button>
  );
}

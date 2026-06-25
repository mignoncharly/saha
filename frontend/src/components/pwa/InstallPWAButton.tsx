"use client";
import { Download } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTranslation } from "@/lib/i18n";

export default function InstallPWAButton() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const { t } = useTranslation();

  if (!canInstall) return null;

  return (
    <button
      onClick={promptInstall}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white shadow-soft-lg transition-colors hover:bg-navy-800 lg:bottom-6"
      aria-label={t("Installer l'application")}
    >
      <Download className="h-5 w-5" />
      <span className="hidden sm:inline">{t("Installer l'app")}</span>
    </button>
  );
}

"use client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTranslation } from "@/lib/i18n";

interface LoadingStateProps {
  label?: string;
  className?: string;
  /** Fill the viewport height (full-page loading). */
  fullPage?: boolean;
}

export default function LoadingState({ label, className = "", fullPage = false }: LoadingStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-gray-500 ${
        fullPage ? "min-h-[60vh]" : "py-12"
      } ${className}`}
    >
      <LoadingSpinner className="h-8 w-8 text-brand-blue" />
      <span className="text-sm">{label || t("Chargement…")}</span>
    </div>
  );
}

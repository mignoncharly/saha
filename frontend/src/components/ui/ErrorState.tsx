import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title = "Une erreur est survenue",
  message,
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-red-800">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-red-700">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

"use client";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthCard({ title, subtitle, icon, children, footer }: AuthCardProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-brand-light px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold text-brand-blue">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white">
            <Package className="h-5 w-5 text-brand-gold" />
          </span>
          STL
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-soft">
          <div className="mb-6 text-center">
            {icon && (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-brand-blue"
        >
          <ArrowLeft className="h-4 w-4" /> {t("Retour au site")}
        </Link>
      </div>
    </div>
  );
}

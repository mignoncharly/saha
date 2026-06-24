import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  /** When true, render the navy gradient hero variant (public pages). */
  hero?: boolean;
}

export default function PageHeader({ title, subtitle, icon, actions, hero = false }: PageHeaderProps) {
  if (hero) {
    return (
      <section className="bg-gradient-to-br from-brand-blue to-navy-900 text-white">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              {icon && <div className="mb-3 inline-flex text-brand-gold">{icon}</div>}
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-3 text-base text-blue-100 sm:text-lg">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-brand-blue">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

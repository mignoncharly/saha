import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** Subtle alternating background for visual rhythm. */
  muted?: boolean;
  id?: string;
}

export default function Section({ children, className = "", muted = false, id }: SectionProps) {
  return (
    <section id={id} className={`${muted ? "bg-brand-light" : "bg-white"} ${className}`}>
      <div className="container-page py-14 sm:py-20">{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}

export function SectionHeading({ eyebrow, title, description, center = true }: SectionHeadingProps) {
  return (
    <div className={`mb-10 ${center ? "mx-auto max-w-2xl text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-gold">{eyebrow}</p>
      )}
      <h2 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-gray-600">{description}</p>}
    </div>
  );
}

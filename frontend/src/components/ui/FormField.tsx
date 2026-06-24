import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Standard label + control + error wrapper. The control is passed as children
 * so it works with react-hook-form's `register(...)` spread.
 */
export default function FormField({ label, htmlFor, required, error, hint, className = "", children }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

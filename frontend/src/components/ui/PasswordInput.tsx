"use client";
import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Password field with a show/hide toggle. Works with controlled state or RHF register. */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className = "", ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="relative">
      <input ref={ref} type={show ? "text" : "password"} className={`input pr-11 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? t("Masquer le mot de passe") : t("Afficher le mot de passe")}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-brand-blue"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
});

export default PasswordInput;

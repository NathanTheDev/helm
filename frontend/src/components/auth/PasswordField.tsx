"use client";

import { useState } from "react";
import { Input, type InputSize, type InputTone } from "@/components/ui/Input";
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icon";

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  size?: InputSize;
  tone?: InputTone;
};

export function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
  size = "md",
  tone = "paper",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={size}
        tone={tone}
        className="pr-10"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
}

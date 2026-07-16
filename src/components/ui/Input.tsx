"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-muted-foreground block"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-muted/20 border rounded-xl px-4 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            transition-all text-foreground placeholder:text-muted-foreground
            ${icon ? "pl-9" : ""}
            ${error ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : "border-border"}
            ${className}
          `.trim()}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-muted-foreground block"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full bg-muted/20 border rounded-xl px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all text-foreground
          ${error ? "border-destructive" : "border-border"}
          ${className}
        `.trim()}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}

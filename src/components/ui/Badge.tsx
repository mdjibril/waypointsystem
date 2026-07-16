import React from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-red-500/10 text-red-500",
  info: "bg-blue-500/10 text-blue-500",
};

const sizeStyles = {
  sm: "text-[9px] px-1.5 py-0.5 rounded-full",
  md: "text-[10px] px-2 py-0.5 rounded-full",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block font-bold ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

type PillVariant = "default" | "success" | "warning" | "danger";

const pillStyles: Record<PillVariant, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-yellow-500/10 text-yellow-600",
  danger: "bg-red-500/10 text-red-500",
};

export function StatusPill({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${pillStyles[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

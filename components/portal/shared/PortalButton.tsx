"use client";

import React from "react";

interface PortalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function PortalButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon,
  fullWidth = false,
}: PortalButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variantClasses = {
    primary: `
      bg-[#FF3621] text-white font-semibold
      hover:bg-[#FF3621]/90 hover:-translate-y-0.5
      shadow-lg shadow-[#FF3621]/25
      active:translate-y-0
    `,
    secondary: `
      bg-gray-100 text-gray-900 font-medium
      hover:bg-gray-200
      border border-gray-200
    `,
    ghost: `
      bg-transparent text-gray-600 font-medium
      hover:bg-gray-100 hover:text-gray-900
    `,
    danger: `
      bg-red-50 text-red-600 font-medium
      hover:bg-red-100
      border border-red-200
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}



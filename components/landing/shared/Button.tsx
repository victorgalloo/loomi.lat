"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "primaryLarge" | "link";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  showArrow?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "px-6 py-3 text-sm font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-1",
  secondary: "px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:border-[#FF3621] hover:text-[#FF3621] transition-all duration-300",
  primaryLarge: "px-10 py-4 text-lg font-semibold text-white bg-[#FF3621] rounded-full hover:bg-[#FF3621]/90 transition-all duration-300 hover:-translate-y-1",
  link: "text-[#FF3621] font-medium hover:gap-3 transition-all",
};

/**
 * Reusable button component with consistent styling
 */
export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  showArrow = false,
  className,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 group",
    variantStyles[variant],
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const content = (
    <>
      {children}
      {showArrow && (
        <ArrowRight className={cn(
          "w-4 h-4",
          variant === "primaryLarge" && "w-5 h-5",
          "group-hover:translate-x-1 transition-transform"
        )} />
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  );
}



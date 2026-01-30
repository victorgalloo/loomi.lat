"use client";

import React from "react";
import { motion } from "framer-motion";

interface PortalCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function PortalCard({
  children,
  className = "",
  hover = false,
  onClick,
  padding = "md",
}: PortalCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const baseClasses = `
    bg-white rounded-2xl border border-gray-200
    ${paddingClasses[padding]}
    ${hover ? "transition-all duration-300 hover:shadow-lg hover:border-[#FF3621]/30 hover:-translate-y-1 cursor-pointer" : ""}
    ${className}
  `;

  if (onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={baseClasses}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={baseClasses}
    >
      {children}
    </motion.div>
  );
}



"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export default function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`
          ${sizeClasses[size]}
          border-4 border-gray-200 border-t-[#FF3621]
          rounded-full animate-spin
        `}
      />
      {message && (
        <p className="mt-4 text-gray-500 text-sm">{message}</p>
      )}
    </div>
  );
}



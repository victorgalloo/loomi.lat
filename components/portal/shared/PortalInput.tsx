"use client";

import React, { forwardRef } from "react";

interface PortalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const PortalInput = forwardRef<HTMLInputElement, PortalInputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-xl
              bg-gray-50 border border-gray-200
              text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? "pl-12" : ""}
              ${error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

PortalInput.displayName = "PortalInput";

export default PortalInput;



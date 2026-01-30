"use client";

import React from "react";
import PortalButton from "./PortalButton";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <div className="text-gray-400">{icon}</div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <PortalButton onClick={onAction} variant="primary">
          {actionLabel}
        </PortalButton>
      )}
    </div>
  );
}



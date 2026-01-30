"use client";

import React from "react";

type StatusType = 
  | "pendiente_de_propuesta"
  | "revisando_propuesta"
  | "pendiente_de_contrato"
  | "firma_de_contrato"
  | "inicio_de_proyecto";

interface StatusBadgeProps {
  status: StatusType | string;
  size?: "sm" | "md";
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string }> = {
  pendiente_de_propuesta: {
    label: "Pendiente de Propuesta",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  revisando_propuesta: {
    label: "Revisando Propuesta",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  pendiente_de_contrato: {
    label: "Pendiente de Contrato",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  firma_de_contrato: {
    label: "Firma de Contrato",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
  },
  inicio_de_proyecto: {
    label: "Proyecto Activo",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.color} ${config.bg}
        ${sizeClasses[size]}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} mr-2`} />
      {config.label}
    </span>
  );
}



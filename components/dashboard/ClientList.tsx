"use client";

import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";
import { useState } from "react";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface ClientListProps {
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
}

export default function ClientList({ onEdit, onDelete }: ClientListProps) {
  const { clients, loading, error, deleteClient } = useClients();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
      return;
    }

    setDeletingId(client.id);
    const result = await deleteClient(client.id);
    setDeletingId(null);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      onDelete?.(client.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: `var(--accent)` }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-xl border mb-6"
        style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "#ef4444",
          color: "#ef4444",
        }}
      >
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
          No hay clientes registrados aún.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {clients.map((client) => (
        <div
          key={client.id}
          className="p-6 rounded-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: `var(--background)`,
            border: `1px solid var(--border)`,
          }}
          onClick={() => onEdit?.(client)}
        >
          {/* Client Avatar/Initial */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-300"
              style={{
                backgroundColor: `var(--accent)`,
                color: `var(--foreground)`,
              }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(client);
              }}
              disabled={deletingId === client.id}
              className="p-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: deletingId === client.id ? "rgba(239, 68, 68, 0.1)" : "transparent",
                color: "#ef4444",
              }}
              onMouseEnter={(e) => {
                if (deletingId !== client.id) {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (deletingId !== client.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              title="Eliminar cliente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Client Name */}
          <h3 className="text-lg font-bold mb-3 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
            {client.name}
          </h3>

          {/* Client Details */}
          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm truncate transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                  {client.email}
                </span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                  {client.phone}
                </span>
              </div>
            )}
            {client.company_name && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm truncate transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                  {client.company_name}
                </span>
              </div>
            )}
          </div>

          {/* Footer with Creation Date */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: `var(--border)` }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                {new Date(client.created_at).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


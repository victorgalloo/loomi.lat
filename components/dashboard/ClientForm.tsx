"use client";

import { useState, useEffect } from "react";
import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

interface ClientFormProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClientForm({
  client,
  isOpen,
  onClose,
  onSuccess,
}: ClientFormProps) {
  const { createClient, updateClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientInsert>({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company_name: client.company_name || "",
        notes: client.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        notes: "",
      });
    }
    setError(null);
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (client) {
        // Update existing client
        result = await updateClient(client.id, formData);
      } else {
        // Create new client
        result = await createClient(formData);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        onSuccess?.();
        onClose();
        setFormData({
          name: "",
          email: "",
          phone: "",
          company_name: "",
          notes: "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el formulario");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border p-8 max-h-[90vh] overflow-y-auto transition-colors duration-300"
        style={{
          backgroundColor: `var(--background)`,
          borderColor: `var(--border)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors duration-300 hover:opacity-70"
            style={{ color: `var(--muted-foreground)` }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: `var(--foreground)` }}
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              placeholder="Nombre completo"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: `var(--foreground)` }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              placeholder="email@ejemplo.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: `var(--foreground)` }}
            >
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              placeholder="+52 55 1234 5678"
            />
          </div>

          {/* Company Name */}
          <div>
            <label
              htmlFor="company_name"
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: `var(--foreground)` }}
            >
              Empresa
            </label>
            <input
              id="company_name"
              type="text"
              value={formData.company_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              placeholder="Nombre de la empresa"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: `var(--foreground)` }}
            >
              Notas
            </label>
            <textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={loading}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-4 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "#ef4444",
                color: "#ef4444",
              }}
            >
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{
                backgroundColor: `var(--card-bg)`,
                borderColor: `var(--border)`,
                color: `var(--foreground)`,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = `var(--accent)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = `var(--card-bg)`;
                }
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#e5e5e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {client ? "Actualizando..." : "Creando..."}
                </span>
              ) : (
                client ? "Actualizar" : "Crear Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


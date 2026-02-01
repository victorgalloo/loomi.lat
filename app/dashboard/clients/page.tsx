"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useClients } from "@/hooks/useClients";
import { Database } from "@/types/supabase";
import { PortalCard, PortalButton, PortalInput, StatusBadge, LoadingSpinner, EmptyState, PortalModal } from "@/components/portal/shared";
import ClientEditorModal from "@/components/portal/ClientEditorModal";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const { clients, loading, error, deleteClient, fetchClients } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Check URL for edit parameter
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && clients.length > 0) {
      const clientToEdit = clients.find(c => c.id === editId);
      if (clientToEdit) {
        setSelectedClient(clientToEdit);
        setIsEditorOpen(true);
      }
    }
  }, [searchParams, clients]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsEditorOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditorOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    setDeletingId(clientId);
    const result = await deleteClient(clientId);
    setDeletingId(null);
    setDeleteConfirmId(null);
    if (result.error) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleEditorSuccess = () => {
    setIsEditorOpen(false);
    setSelectedClient(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Cargando clientes..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">{clients.length} clientes registrados</p>
        </div>
        <PortalButton
          onClick={handleNewClient}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Nuevo Cliente
        </PortalButton>
      </div>

      {/* Search */}
      <PortalCard padding="md">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] transition-all duration-200"
          />
        </div>
      </PortalCard>

      {/* Error State */}
      {error && (
        <PortalCard>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-600 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        </PortalCard>
      )}

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <PortalCard>
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title={searchTerm ? "No se encontraron resultados" : "No hay clientes aún"}
            description={searchTerm ? "Intenta con otro término de búsqueda" : "Comienza agregando tu primer cliente"}
            actionLabel={searchTerm ? undefined : "Agregar Cliente"}
            onAction={searchTerm ? undefined : handleNewClient}
          />
        </PortalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PortalCard hover onClick={() => handleEditClient(client)}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF3621] to-[#FF6B35] flex items-center justify-center text-white font-bold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        {client.company_name && (
                          <p className="text-sm text-gray-500">{client.company_name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(client.id);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <StatusBadge status={client.process_status || "pendiente_de_propuesta"} size="sm" />
                    <span className="text-xs text-gray-400">
                      {new Date(client.created_at).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </PortalCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Client Editor Modal */}
      <ClientEditorModal
        client={selectedClient}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedClient(null);
        }}
        onSuccess={handleEditorSuccess}
      />

      {/* Delete Confirmation Modal */}
      <PortalModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Eliminar Cliente"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            ¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <PortalButton
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1"
            >
              Cancelar
            </PortalButton>
            <PortalButton
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              loading={deletingId === deleteConfirmId}
              className="flex-1"
            >
              Eliminar
            </PortalButton>
          </div>
        </div>
      </PortalModal>
    </div>
  );
}

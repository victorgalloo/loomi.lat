"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";
import { PortalCard, StatusBadge, LoadingSpinner, FileViewer, PortalButton } from "./shared";
import Image from "next/image";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface ClientDashboardProps {
  client: Client | null;
}

interface Proposal {
  id: string;
  title: string;
  attachment?: { fileUrl: string; fileName: string; filePath: string };
  createdAt?: string;
  isWebProposal?: boolean;
}

interface LegalDocument {
  id: string;
  title: string;
  attachment?: { fileUrl: string; fileName: string; filePath: string };
  createdAt?: string;
}

const statusSteps = [
  { key: "pendiente_de_propuesta", label: "Propuesta", step: 1 },
  { key: "revisando_propuesta", label: "Revisión", step: 2 },
  { key: "pendiente_de_contrato", label: "Contrato", step: 3 },
  { key: "firma_de_contrato", label: "Firma", step: 4 },
  { key: "inicio_de_proyecto", label: "Proyecto", step: 5 },
];

export default function ClientDashboard({ client }: ClientDashboardProps) {
  const router = useRouter();
  const { getSignedUrl, getClient } = useClients();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [viewingFile, setViewingFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(client);

  // Refresh client data when prop changes or on mount
  useEffect(() => {
    if (client) {
      setCurrentClient(client);
      // Also fetch fresh data
      if (client.id) {
        getClient(client.id).then(result => {
          if (result.data) {
            setCurrentClient(result.data);
          }
        });
      }
    }
  }, [client, getClient]);

  // Listen for storage events to refresh when data is updated in another tab/window
  useEffect(() => {
    const handleStorageChange = () => {
      if (client?.id) {
        getClient(client.id).then(result => {
          if (result.data) {
            setCurrentClient(result.data);
          }
        });
      }
    };

    window.addEventListener('focus', handleStorageChange);
    return () => window.removeEventListener('focus', handleStorageChange);
  }, [client?.id, getClient]);

  useEffect(() => {
    if (currentClient?.files && Array.isArray(currentClient.files)) {
      const files = currentClient.files as Array<{
        id?: string;
        fileUrl?: string;
        fileName?: string;
        filePath?: string;
        category?: string;
        title?: string;
        createdAt?: string;
        isWebProposal?: boolean;
      }>;

      const loadedProposals: Proposal[] = [];
      const loadedLegalDocs: LegalDocument[] = [];

      files.forEach((file, index) => {
        if (file.category === "proposals") {
          loadedProposals.push({
            id: file.id || `proposal-${index}`,
            title: file.title || file.fileName || "Propuesta",
            attachment: file.fileUrl ? {
              fileUrl: file.fileUrl,
              fileName: file.fileName || "",
              filePath: file.filePath || "",
            } : undefined,
            createdAt: file.createdAt,
            isWebProposal: file.isWebProposal,
          });
        }
        if (file.category === "legal-documents") {
          loadedLegalDocs.push({
            id: file.id || `legal-${index}`,
            title: file.title || file.fileName || "Documento",
            attachment: file.fileUrl ? {
              fileUrl: file.fileUrl,
              fileName: file.fileName || "",
              filePath: file.filePath || "",
            } : undefined,
            createdAt: file.createdAt,
          });
        }
      });

      setProposals(loadedProposals);
      setLegalDocuments(loadedLegalDocs);
    }
  }, [currentClient]);

  if (!currentClient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">No se encontró información del cliente</p>
          <p className="text-gray-500">Por favor, contacta al administrador</p>
        </div>
      </div>
    );
  }

  const currentStatus = (currentClient as { process_status?: string }).process_status || "pendiente_de_propuesta";
  const currentStepIndex = statusSteps.findIndex(s => s.key === currentStatus);

  const handleViewFile = async (filePath: string, fileName: string) => {
    const result = await getSignedUrl(filePath, 3600);
    if (result.data) {
      setViewingFile({ fileName, fileUrl: result.data });
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    if (proposal.isWebProposal && currentClient) {
      router.push(`/dashboard/clients/${currentClient.id}/proposals/${proposal.id}`);
    } else if (proposal.attachment?.filePath) {
      handleViewFile(proposal.attachment.filePath, proposal.attachment.fileName);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900"
        >
          ¡Hola, {currentClient.name}!
        </motion.h1>
        {currentClient.company_name && (
          <p className="text-gray-500 mt-1">{currentClient.company_name}</p>
        )}
      </div>

      {/* Progress Timeline */}
      <PortalCard padding="lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-8">Estado de tu Proyecto</h2>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          <div
            className="absolute top-6 left-0 h-1 bg-[#FF3621] rounded-full transition-all duration-500"
            style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      font-semibold text-sm z-10
                      ${isCurrent 
                        ? "bg-[#FF3621] text-white ring-4 ring-[#FF3621]/20" 
                        : isCompleted 
                          ? "bg-[#FF3621] text-white" 
                          : "bg-gray-200 text-gray-500"
                      }
                    `}
                  >
                    {isCompleted && !isCurrent ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.step
                    )}
                  </motion.div>
                  <p className={`
                    mt-3 text-sm font-medium text-center
                    ${isCurrent ? "text-[#FF3621]" : isCompleted ? "text-gray-900" : "text-gray-400"}
                  `}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-3">
          <span className="text-gray-500">Estado actual:</span>
          <StatusBadge status={currentStatus} />
        </div>
      </PortalCard>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Proposals */}
        <PortalCard padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Propuestas</h3>
            </div>
            <span className="text-sm text-gray-500">{proposals.length} total</span>
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay propuestas disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  onClick={() => handleViewProposal(proposal)}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {proposal.isWebProposal ? (
                      <div className="w-8 h-8 rounded-lg bg-[#FF3621]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FF3621]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{proposal.title}</p>
                      {proposal.createdAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(proposal.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#FF3621] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </PortalCard>

        {/* Legal Documents */}
        <PortalCard padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Documentos Legales</h3>
            </div>
            <span className="text-sm text-gray-500">{legalDocuments.length} total</span>
          </div>

          {legalDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay documentos disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {legalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => doc.attachment?.filePath && handleViewFile(doc.attachment.filePath, doc.attachment.fileName)}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      {doc.createdAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#FF3621] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </PortalCard>
      </div>

      {/* Contact Card */}
      <PortalCard padding="lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF3621]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#FF3621]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">¿Tienes dudas?</h3>
            <p className="text-gray-500 mt-1">
              Nuestro equipo está disponible para ayudarte con cualquier pregunta sobre tu proyecto.
            </p>
            <a
              href="mailto:hello@anthana.agency"
              className="inline-flex items-center gap-2 mt-4 text-[#FF3621] font-medium hover:underline"
            >
              Contactar equipo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </PortalCard>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          fileName={viewingFile.fileName}
          fileUrl={viewingFile.fileUrl}
        />
      )}
    </div>
  );
}


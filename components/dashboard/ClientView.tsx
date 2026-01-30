"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";
import Image from "next/image";
import { exportHtmlToPdf } from "@/lib/htmlToPdf";
import { PdfExportLoading } from "@/components/ui/pdf-export-loading";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface ClientViewProps {
  client: Client;
}

export default function ClientView({ client }: ClientViewProps) {
  const router = useRouter();
  const { getSignedUrl } = useClients();
  const [openResource, setOpenResource] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfExportMessage, setPdfExportMessage] = useState("");

  // Proposals state
  const [proposals, setProposals] = useState<Array<{
    id: string;
    title: string;
    attachment?: { fileUrl: string; fileName: string; filePath: string };
    createdAt?: string;
    tags?: string[];
    notes?: string;
    isWebProposal?: boolean;
    htmlContent?: string;
    pdfExportable?: boolean;
  }>>([]);

  // Legal Documents state
  const [legalDocuments, setLegalDocuments] = useState<Array<{
    id: string;
    title: string;
    attachment?: { fileUrl: string; fileName: string; filePath: string };
    createdAt?: string;
    tags?: string[];
    notes?: string;
  }>>([]);

  // General Files/Attachments state
  const [generalFiles, setGeneralFiles] = useState<Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
  }>>([]);

  const [viewingProposal, setViewingProposal] = useState<{
    id: string;
    title: string;
    attachment: { fileUrl: string; fileName: string; filePath: string };
  } | null>(null);

  const [viewingLegalDoc, setViewingLegalDoc] = useState<{
    id: string;
    title: string;
    attachment: { fileUrl: string; fileName: string; filePath: string };
  } | null>(null);

  const [viewingGeneralFile, setViewingGeneralFile] = useState<{
    id: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
  } | null>(null);

  // Initialize proposals and legal documents from client files
  useEffect(() => {
    const loadedProposals: Array<{
      id: string;
      title: string;
      attachment?: { fileUrl: string; fileName: string; filePath: string };
      createdAt?: string;
      tags?: string[];
      notes?: string;
      isWebProposal?: boolean;
      htmlContent?: string;
      pdfExportable?: boolean;
    }> = [];

    const loadedLegalDocs: Array<{
      id: string;
      title: string;
      attachment?: { fileUrl: string; fileName: string; filePath: string };
      createdAt?: string;
      tags?: string[];
      notes?: string;
    }> = [];

    const loadedGeneralFiles: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      filePath: string;
    }> = [];

    if (client.files && typeof client.files === 'object' && Array.isArray(client.files)) {
      const files = client.files as Array<{
        fileUrl: string;
        fileName: string;
        filePath?: string;
        category?: string;
        title?: string;
        id?: string;
        createdAt?: string;
        tags?: string[];
        notes?: string;
      }>;

      files.forEach((file, index) => {
        // Load proposals if category is proposals
        if (file.category === 'proposals') {
          loadedProposals.push({
            id: file.id || `proposal-${index}`,
            title: file.title || file.fileName,
            attachment: file.fileUrl ? { fileUrl: file.fileUrl, fileName: file.fileName, filePath: file.filePath || '' } : undefined,
            createdAt: file.createdAt || new Date().toISOString(),
            tags: file.tags || [],
            notes: file.notes || "",
            isWebProposal: (file as any).isWebProposal || false,
            htmlContent: (file as any).htmlContent || undefined,
            pdfExportable: (file as any).pdfExportable === true || (file as any).pdfExportable === "true" || false,
          });
          // Debug: log pdfExportable value
          if ((file as any).isWebProposal) {
            console.log('Web Proposal PDF Exportable:', {
              title: file.title || file.fileName,
              pdfExportable: (file as any).pdfExportable,
              pdfExportableType: typeof (file as any).pdfExportable,
              finalValue: (file as any).pdfExportable === true || (file as any).pdfExportable === "true" || false,
            });
          }
        }

        // Load legal documents if category is legal-documents
        if (file.category === 'legal-documents') {
          loadedLegalDocs.push({
            id: file.id || `legal-doc-${index}`,
            title: file.title || file.fileName,
            attachment: { fileUrl: file.fileUrl, fileName: file.fileName, filePath: file.filePath || '' },
            createdAt: file.createdAt || new Date().toISOString(),
            tags: file.tags || [],
            notes: file.notes || "",
          });
        }

        // Load general files (files without specific category - not proposals or legal-documents)
        if (!file.category || (file.category !== 'proposals' && file.category !== 'legal-documents')) {
          if (file.fileUrl && file.fileName) {
            loadedGeneralFiles.push({
              id: file.id || `file-${index}`,
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              filePath: file.filePath || '',
            });
          }
        }
      });
    }

    setProposals(loadedProposals);
    setLegalDocuments(loadedLegalDocs);
    setGeneralFiles(loadedGeneralFiles);
  }, [client]);

  const processStatus = (client as any).process_status || "pendiente_de_propuesta";

  return (
    <>
      <PdfExportLoading isOpen={exportingPdf} message={pdfExportMessage} />
      <div className="space-y-8">
      {/* Client Name Header */}
      <div
        className="p-8 rounded-2xl transition-colors duration-300"
        style={{
          backgroundColor: `var(--card-bg)`,
        }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
          {client.name}
        </h1>
        {client.company_name && (
          <p className="text-lg font-normal transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
            {client.company_name}
          </p>
        )}
      </div>

      {/* Process Timeline */}
      <div
        className="p-8 rounded-2xl transition-colors duration-300"
        style={{
          backgroundColor: `var(--card-bg)`,
        }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: `var(--accent)` }} />
          <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
            Estado del Proceso
          </h3>
        </div>
        <div className="relative">
          {/* Timeline Line Background */}
          <div className="absolute top-12 left-0 right-0 h-0.5" style={{ backgroundColor: `var(--border)`, opacity: 0.3 }} />
          
          {/* Timeline Steps */}
          <div className="relative flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 sm:gap-4 pb-6">
            {[
              { 
                key: "pendiente_de_propuesta", 
                label: "Pendiente de propuesta", 
                shortLabel: "Propuesta",
                step: 1,
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              },
              { 
                key: "revisando_propuesta", 
                label: "Revisando propuesta", 
                shortLabel: "Revisión",
                step: 2,
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              },
              { 
                key: "pendiente_de_contrato", 
                label: "Pendiente de Contrato", 
                shortLabel: "Contrato",
                step: 3,
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              { 
                key: "firma_de_contrato", 
                label: "Firma de contrato", 
                shortLabel: "Firma",
                step: 4,
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )
              },
              { 
                key: "inicio_de_proyecto", 
                label: "Inicio de proyecto", 
                shortLabel: "Proyecto",
                step: 5,
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
            ].map((status, index) => {
              const statusOrder = [
                "pendiente_de_propuesta",
                "revisando_propuesta",
                "pendiente_de_contrato",
                "firma_de_contrato",
                "inicio_de_proyecto",
              ];
              const currentIndex = statusOrder.indexOf(processStatus);
              const isActive = processStatus === status.key;
              const isCompleted = currentIndex >= index;
              const isPending = currentIndex < index;

              return (
                <React.Fragment key={status.key}>
                  {/* Step Container */}
                  <div className="flex-1 sm:flex-1 flex flex-col items-center min-w-0 w-full sm:w-auto">
                    <div className="group relative flex flex-col items-center w-full transition-all duration-500 ease-out">
                      {/* Connector Line */}
                      {index < 4 && (
                        <div className="absolute top-6 left-[60%] w-[80%] h-0.5 transition-all duration-500 ease-out" style={{ zIndex: 0 }}>
                          <div 
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                              backgroundColor: isCompleted ? "#22c55e" : `var(--border)`,
                              width: isCompleted ? "100%" : "0%",
                              opacity: isCompleted ? 1 : 0.2,
                            }}
                          />
                        </div>
                      )}

                      {/* Step Circle */}
                      <div className={`relative z-10 mb-4 ${isActive ? "mb-6" : "mb-4"}`}>
                        {/* Outer glow ring for active step */}
                        {isActive && (
                          <>
                            <div 
                              className="absolute inset-0 rounded-full animate-ping opacity-30"
                              style={{ 
                                backgroundColor: `var(--accent)`,
                                width: isActive ? "64px" : "48px",
                                height: isActive ? "64px" : "48px",
                                top: "-8px",
                                left: "-8px",
                              }}
                            />
                            <div 
                              className="absolute inset-0 rounded-full"
                              style={{ 
                                backgroundColor: `var(--accent)`,
                                width: "64px",
                                height: "64px",
                                top: "-8px",
                                left: "-8px",
                                opacity: 0.2,
                                filter: "blur(8px)",
                              }}
                            />
                          </>
                        )}
                        <div
                          className={`
                            rounded-full flex items-center justify-center
                            transition-all duration-500 ease-out
                            ${isActive ? "w-16 h-16 scale-110" : "w-12 h-12 scale-100"}
                          `}
                          style={{
                            backgroundColor: isActive 
                              ? `var(--accent)` 
                              : isCompleted 
                                ? "#22c55e" 
                                : `var(--card-bg)`,
                            color: isActive || isCompleted ? "#ffffff" : `var(--muted-foreground)`,
                            border: isActive 
                              ? `3px solid var(--accent)` 
                              : isPending 
                                ? `2px solid var(--border)` 
                                : "none",
                            boxShadow: isActive 
                              ? `0 0 0 4px var(--card-bg), 0 0 0 8px var(--accent), 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(115, 115, 115, 0.6)` 
                              : isCompleted 
                                ? "0 4px 12px rgba(34, 197, 94, 0.3)" 
                                : "none",
                            position: "relative",
                            zIndex: 10,
                          }}
                        >
                          {isCompleted && !isActive ? (
                            <svg className={`${isActive ? "w-8 h-8" : "w-6 h-6"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className={`${isActive ? "w-8 h-8" : "w-6 h-6"} flex items-center justify-center`}>
                              {status.icon}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step Label */}
                      <div className={`w-full text-center ${isActive ? "mt-2" : ""}`}>
                        <div
                          className={`
                            mb-1 transition-all duration-300
                            ${isActive ? "text-lg font-bold" : "text-sm font-semibold"}
                          `}
                          style={{
                            color: isActive 
                              ? `var(--foreground)` 
                              : isCompleted 
                                ? `var(--foreground)` 
                                : `var(--muted-foreground)`,
                            textShadow: isActive ? `0 2px 8px rgba(0, 0, 0, 0.3)` : "none",
                          }}
                        >
                          {status.label}
                        </div>
                        <div
                          className={`transition-colors duration-300 ${isActive ? "text-sm font-semibold" : "text-xs"}`}
                          style={{
                            color: isActive 
                              ? `var(--accent)` 
                              : `var(--muted-foreground)`,
                            opacity: isActive ? 1 : isPending ? 0.5 : 0.8,
                          }}
                        >
                          Paso {status.step}
                        </div>
                        {isActive && (
                          <div
                            className="mt-2 px-3 py-1 rounded-full text-xs font-semibold inline-block"
                            style={{
                              backgroundColor: `var(--accent)`,
                              color: "#ffffff",
                            }}
                          >
                            Activo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div
        className="p-8 rounded-2xl transition-colors duration-300"
        style={{
          backgroundColor: `var(--card-bg)`,
        }}
      >
        <h2 className="text-2xl font-bold mb-6 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
          Recursos
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            {
              image: "/images/proposals.png",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              label: "Proposals",
              count: proposals.length
            },
            {
              image: "/images/legal documents.png",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              label: "Legal Documents",
              count: legalDocuments.length
            },
            ...(generalFiles.length > 0 ? [{
              image: "/images/file.png",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              ),
              label: "Archivos Adjuntos",
              count: generalFiles.length
            }] : []),
          ].map((resource, index) => (
            <div
              key={index}
              className="rounded-lg overflow-hidden transition-all duration-300 hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: `var(--card-bg)`,
              }}
              onClick={() => {
                if (resource.label === "Proposals") {
                  setOpenResource("proposals");
                } else if (resource.label === "Legal Documents") {
                  setOpenResource("legal-documents");
                } else if (resource.label === "Archivos Adjuntos") {
                  setOpenResource("general-files");
                }
              }}
            >
              {/* Image Section */}
              <div className="w-full h-32 relative overflow-hidden" style={{ backgroundColor: `var(--background)` }}>
                {resource.image ? (
                  <Image
                    src={resource.image}
                    alt={resource.label}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `var(--accent)` }}>
                    <div className="opacity-30" style={{ color: `var(--foreground)` }}>
                      {resource.icon}
                    </div>
                  </div>
                )}
              </div>
              {/* Icon + Label Section */}
              <div
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: `var(--card-bg)` }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: `var(--foreground)` }}>
                    {resource.icon}
                  </div>
                  <span className="text-sm font-medium transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    {resource.label}
                  </span>
                </div>
                <span className="text-sm font-medium transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                  {resource.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposals Resource View */}
      {openResource === "proposals" && (
        <div
          className="fixed inset-0 z-[60] flex flex-col transition-colors duration-300"
          style={{ backgroundColor: `var(--background)` }}
        >
          {/* Header with Image */}
          <div className="w-full h-48 relative overflow-hidden flex-shrink-0">
            <Image
              src="/images/proposals.png"
              alt="Proposals"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <button
                onClick={() => setOpenResource(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", color: "#ffffff" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Title */}
            <h1 className="text-5xl font-bold mb-8 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
              Proposals
            </h1>

            {/* Proposals Database */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Proposals
              </h2>

              {/* Proposals Table */}
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: `var(--border)` }}>
                {/* Table Header */}
                <div className="flex items-center border-b" style={{ borderColor: `var(--border)`, backgroundColor: `var(--card-bg)` }}>
                  <div className="flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Aa Title
                  </div>
                  <div className="w-48 px-4 py-3 text-sm font-semibold transition-colors duration-300 flex items-center gap-2" style={{ color: `var(--foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachment
                  </div>
                  <div className="w-32 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Fecha
                  </div>
                  <div className="w-40 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Tags
                  </div>
                </div>

                {/* Table Rows */}
                {proposals.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                      No hay propuestas disponibles
                    </p>
                  </div>
                ) : (
                  proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex items-center border-b transition-colors duration-300 hover:opacity-80 cursor-pointer"
                      style={{ borderColor: `var(--border)`, backgroundColor: `var(--background)` }}
                      onClick={async () => {
                        // If it's a web proposal, redirect to the web proposal page
                        if (proposal.isWebProposal && client?.id) {
                          router.push(`/dashboard/clients/${client.id}/proposals/${proposal.id}`);
                          return;
                        }
                        
                        // Otherwise, open file in modal
                        if (proposal.attachment && proposal.attachment.filePath) {
                          // Get signed URL for private bucket
                          const signedUrlResult = await getSignedUrl(proposal.attachment.filePath, 3600);
                          if (signedUrlResult.data) {
                            setViewingProposal({
                              id: proposal.id,
                              title: proposal.title,
                              attachment: {
                                ...proposal.attachment,
                                fileUrl: signedUrlResult.data,
                              },
                            });
                          } else {
                            console.error('Error getting signed URL:', signedUrlResult.error);
                            alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
                          }
                        }
                      }}
                    >
                      <div className="flex-1 px-4 py-3 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                        {proposal.title}
                      </div>
                      <div className="w-64 px-4 py-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {proposal.isWebProposal ? (
                          <>
                            <span className="flex items-center gap-2 text-sm transition-colors duration-300 font-medium" style={{ color: `var(--accent)` }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              Web Proposal
                            </span>
                            {proposal.pdfExportable && proposal.htmlContent && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setExportingPdf(true);
                                  setPdfExportMessage("Preparando contenido...");
                                  try {
                                    await exportHtmlToPdf(
                                      proposal.htmlContent!, 
                                      proposal.title,
                                      (message) => setPdfExportMessage(message)
                                    );
                                  } catch (error: any) {
                                    alert(error.message || 'Error al exportar el PDF');
                                  } finally {
                                    setExportingPdf(false);
                                    setPdfExportMessage("");
                                  }
                                }}
                                className="px-2 py-1 text-xs rounded transition-colors duration-300 hover:opacity-80 flex items-center gap-1"
                                style={{
                                  backgroundColor: `var(--card-bg)`,
                                  color: `var(--foreground)`,
                                  border: `1px solid var(--border)`,
                                }}
                                title="Exportar como PDF"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                PDF
                              </button>
                            )}
                          </>
                        ) : proposal.attachment ? (
                          <a
                            href={proposal.attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-70"
                            style={{ color: `var(--accent)` }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (proposal.attachment?.filePath) {
                                // Get signed URL for private bucket
                                const signedUrlResult = await getSignedUrl(proposal.attachment.filePath, 3600);
                                if (signedUrlResult.data) {
                                  setViewingProposal({
                                    id: proposal.id,
                                    title: proposal.title,
                                    attachment: {
                                      ...proposal.attachment,
                                      fileUrl: signedUrlResult.data,
                                    },
                                  });
                                } else {
                                  console.error('Error getting signed URL:', signedUrlResult.error);
                                  alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
                                }
                              }
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {proposal.attachment.fileName}
                          </a>
                        ) : (
                          <span className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                            -
                          </span>
                        )}
                      </div>
                      <div className="w-32 px-4 py-3 text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {proposal.createdAt
                          ? new Date(proposal.createdAt).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </div>
                      <div className="w-40 px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {proposal.tags && proposal.tags.length > 0 ? (
                            proposal.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded-full transition-colors duration-300"
                                style={{
                                  backgroundColor: `var(--card-bg)`,
                                  color: `var(--foreground)`,
                                  border: `1px solid var(--border)`,
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                              -
                            </span>
                          )}
                          {proposal.tags && proposal.tags.length > 2 && (
                            <span className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                              +{proposal.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Documents Resource View */}
      {openResource === "legal-documents" && (
        <div
          className="fixed inset-0 z-[60] flex flex-col transition-colors duration-300"
          style={{ backgroundColor: `var(--background)` }}
        >
          {/* Header with Image */}
          <div className="w-full h-48 relative overflow-hidden flex-shrink-0">
            <Image
              src="/images/legal documents.png"
              alt="Legal Documents"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <button
                onClick={() => setOpenResource(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", color: "#ffffff" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Title */}
            <h1 className="text-5xl font-bold mb-8 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
              Legal Documents
            </h1>

            {/* Legal Documents Database */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Legal Documents
              </h2>

              {/* Legal Documents Table */}
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: `var(--border)` }}>
                {/* Table Header */}
                <div className="flex items-center border-b" style={{ borderColor: `var(--border)`, backgroundColor: `var(--card-bg)` }}>
                  <div className="flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Aa Title
                  </div>
                  <div className="w-48 px-4 py-3 text-sm font-semibold transition-colors duration-300 flex items-center gap-2" style={{ color: `var(--foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachment
                  </div>
                  <div className="w-32 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Fecha
                  </div>
                  <div className="w-40 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Tags
                  </div>
                </div>

                {/* Table Rows */}
                {legalDocuments.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                      No hay documentos legales disponibles
                    </p>
                  </div>
                ) : (
                  legalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center border-b transition-colors duration-300 hover:opacity-80 cursor-pointer"
                      style={{ borderColor: `var(--border)`, backgroundColor: `var(--background)` }}
                      onClick={async () => {
                        if (doc.attachment && doc.attachment.filePath) {
                          // Get signed URL for private bucket
                          const signedUrlResult = await getSignedUrl(doc.attachment.filePath, 3600);
                          if (signedUrlResult.data) {
                            setViewingLegalDoc({
                              id: doc.id,
                              title: doc.title,
                              attachment: {
                                ...doc.attachment,
                                fileUrl: signedUrlResult.data,
                              },
                            });
                          } else {
                            console.error('Error getting signed URL:', signedUrlResult.error);
                            alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
                          }
                        }
                      }}
                    >
                      <div className="flex-1 px-4 py-3 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                        {doc.title}
                      </div>
                      <div className="w-48 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {doc.attachment ? (
                          <a
                            href={doc.attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-70"
                            style={{ color: `var(--accent)` }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (doc.attachment?.filePath) {
                                // Get signed URL for private bucket
                                const signedUrlResult = await getSignedUrl(doc.attachment.filePath, 3600);
                                if (signedUrlResult.data) {
                                  setViewingLegalDoc({
                                    id: doc.id,
                                    title: doc.title,
                                    attachment: {
                                      ...doc.attachment,
                                      fileUrl: signedUrlResult.data,
                                    },
                                  });
                                } else {
                                  console.error('Error getting signed URL:', signedUrlResult.error);
                                  alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
                                }
                              }
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {doc.attachment.fileName}
                          </a>
                        ) : (
                          <span className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                            -
                          </span>
                        )}
                      </div>
                      <div className="w-32 px-4 py-3 text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </div>
                      <div className="w-40 px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags && doc.tags.length > 0 ? (
                            doc.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded-full transition-colors duration-300"
                                style={{
                                  backgroundColor: `var(--card-bg)`,
                                  color: `var(--foreground)`,
                                  border: `1px solid var(--border)`,
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                              -
                            </span>
                          )}
                          {doc.tags && doc.tags.length > 2 && (
                            <span className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                              +{doc.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Files Resource View */}
      {openResource === "general-files" && (
        <div
          className="fixed inset-0 z-[60] flex flex-col transition-colors duration-300"
          style={{ backgroundColor: `var(--background)` }}
        >
          {/* Header with Image */}
          <div className="w-full h-48 relative overflow-hidden flex-shrink-0">
            <Image
              src="/images/file.png"
              alt="Archivos Adjuntos"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <button
                onClick={() => setOpenResource(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", color: "#ffffff" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Files Database */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Archivos
              </h2>

              {/* Files Table */}
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: `var(--border)` }}>
                {/* Table Header */}
                <div className="flex items-center border-b" style={{ borderColor: `var(--border)`, backgroundColor: `var(--card-bg)` }}>
                  <div className="flex-1 px-4 py-3 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Nombre del Archivo
                  </div>
                  <div className="w-48 px-4 py-3 text-sm font-semibold transition-colors duration-300 flex items-center gap-2" style={{ color: `var(--foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Acciones
                  </div>
                </div>

                {/* Table Rows */}
                {generalFiles.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                      No hay archivos adjuntos disponibles
                    </p>
                  </div>
                ) : (
                  generalFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center border-b transition-colors duration-300 hover:opacity-80"
                      style={{ borderColor: `var(--border)`, backgroundColor: `var(--background)` }}
                    >
                      <div className="flex-1 px-4 py-3 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                        {file.fileName}
                      </div>
                      <div className="w-48 px-4 py-3">
                        <button
                          className="flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-70 px-3 py-1 rounded"
                          style={{ 
                            color: `var(--accent)`,
                            backgroundColor: `var(--card-bg)`,
                          }}
                          onClick={async () => {
                            if (file.filePath) {
                              // Get signed URL for private bucket
                              const signedUrlResult = await getSignedUrl(file.filePath, 3600);
                              if (signedUrlResult.data) {
                                setViewingGeneralFile({
                                  ...file,
                                  fileUrl: signedUrlResult.data,
                                });
                              } else {
                                console.error('Error getting signed URL:', signedUrlResult.error);
                                alert('Error al abrir el archivo. Por favor, intenta nuevamente.');
                              }
                            } else {
                              // Fallback to fileUrl if filePath is not available
                              setViewingGeneralFile(file);
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver archivo
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal - Proposals */}
      {viewingProposal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => setViewingProposal(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] rounded-2xl transition-colors duration-300 flex flex-col"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-xl font-bold transition-colors duration-300 truncate flex-1 mr-4" style={{ color: `var(--foreground)` }}>
                {viewingProposal.title}
              </h2>
              <div className="flex items-center gap-3">
                {viewingProposal.attachment && viewingProposal.attachment.fileUrl && (
                  <a
                    href={viewingProposal.attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      color: `var(--foreground)`,
                      border: `1px solid var(--border)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </a>
                )}
                <button
                  onClick={() => setViewingProposal(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                  style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden relative">
              {viewingProposal.attachment && viewingProposal.attachment.fileName ? (
                viewingProposal.attachment.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  // Image viewer
                  <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                    <img
                      src={viewingProposal.attachment.fileUrl}
                      alt={viewingProposal.title}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : viewingProposal.attachment.fileName.match(/\.(pdf)$/i) ? (
                  // PDF viewer
                  <div className="w-full h-full overflow-auto p-8">
                    <iframe
                      src={viewingProposal.attachment.fileUrl}
                      className="w-full h-full min-h-[600px] rounded border"
                      style={{ borderColor: `var(--border)` }}
                      title={viewingProposal.title}
                    />
                  </div>
                ) : (
                  // Generic file viewer (fallback)
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {viewingProposal.attachment.fileName}
                      </p>
                      <a
                        href={viewingProposal.attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        style={{
                          backgroundColor: `var(--card-bg)`,
                          color: `var(--foreground)`,
                          border: `1px solid var(--border)`,
                        }}
                      >
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal - Legal Documents */}
      {viewingLegalDoc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => setViewingLegalDoc(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] rounded-2xl transition-colors duration-300 flex flex-col"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-xl font-bold transition-colors duration-300 truncate flex-1 mr-4" style={{ color: `var(--foreground)` }}>
                {viewingLegalDoc.title}
              </h2>
              <div className="flex items-center gap-3">
                {viewingLegalDoc.attachment && viewingLegalDoc.attachment.fileUrl && (
                  <a
                    href={viewingLegalDoc.attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      color: `var(--foreground)`,
                      border: `1px solid var(--border)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </a>
                )}
                <button
                  onClick={() => setViewingLegalDoc(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                  style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden relative">
              {viewingLegalDoc.attachment && viewingLegalDoc.attachment.fileName ? (
                viewingLegalDoc.attachment.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  // Image viewer
                  <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                    <img
                      src={viewingLegalDoc.attachment.fileUrl}
                      alt={viewingLegalDoc.title}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : viewingLegalDoc.attachment.fileName.match(/\.(pdf)$/i) ? (
                  // PDF viewer
                  <div className="w-full h-full overflow-auto p-8">
                    <iframe
                      src={viewingLegalDoc.attachment.fileUrl}
                      className="w-full h-full min-h-[600px] rounded border"
                      style={{ borderColor: `var(--border)` }}
                      title={viewingLegalDoc.title}
                    />
                  </div>
                ) : (
                  // Generic file viewer (fallback)
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {viewingLegalDoc.attachment.fileName}
                      </p>
                      <a
                        href={viewingLegalDoc.attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        style={{
                          backgroundColor: `var(--card-bg)`,
                          color: `var(--foreground)`,
                          border: `1px solid var(--border)`,
                        }}
                      >
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal - General Files */}
      {viewingGeneralFile && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => setViewingGeneralFile(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] rounded-2xl transition-colors duration-300 flex flex-col"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-xl font-bold transition-colors duration-300 truncate flex-1 mr-4" style={{ color: `var(--foreground)` }}>
                {viewingGeneralFile.fileName}
              </h2>
              <div className="flex items-center gap-3">
                {viewingGeneralFile.fileUrl && (
                  <a
                    href={viewingGeneralFile.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      color: `var(--foreground)`,
                      border: `1px solid var(--border)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </a>
                )}
                <button
                  onClick={() => setViewingGeneralFile(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                  style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden relative">
              {viewingGeneralFile.fileName ? (
                viewingGeneralFile.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  // Image viewer
                  <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                    <img
                      src={viewingGeneralFile.fileUrl}
                      alt={viewingGeneralFile.fileName}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : viewingGeneralFile.fileName.match(/\.(pdf)$/i) ? (
                  // PDF viewer
                  <div className="w-full h-full overflow-auto p-8">
                    <iframe
                      src={viewingGeneralFile.fileUrl}
                      className="w-full h-full min-h-[600px] rounded border"
                      style={{ borderColor: `var(--border)` }}
                      title={viewingGeneralFile.fileName}
                    />
                  </div>
                ) : (
                  // Generic file viewer (fallback)
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {viewingGeneralFile.fileName}
                      </p>
                      <a
                        href={viewingGeneralFile.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        style={{
                          backgroundColor: `var(--card-bg)`,
                          color: `var(--foreground)`,
                          border: `1px solid var(--border)`,
                        }}
                      >
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}


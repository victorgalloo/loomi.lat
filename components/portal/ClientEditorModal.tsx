"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";
import { PortalCard, PortalButton, PortalInput, StatusBadge, FileViewer } from "./shared";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

interface ClientEditorModalProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const processStatuses = [
  { key: "pendiente_de_propuesta", label: "Pendiente de Propuesta" },
  { key: "revisando_propuesta", label: "Revisando Propuesta" },
  { key: "pendiente_de_contrato", label: "Pendiente de Contrato" },
  { key: "firma_de_contrato", label: "Firma de Contrato" },
  { key: "inicio_de_proyecto", label: "Inicio de Proyecto" },
];

interface FileItem {
  id: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  category: "proposals" | "legal-documents" | "general";
  title?: string;
  createdAt?: string;
  isWebProposal?: boolean;
  htmlContent?: string;
  pdfExportable?: boolean;
}

export default function ClientEditorModal({
  client,
  isOpen,
  onClose,
  onSuccess,
}: ClientEditorModalProps) {
  const router = useRouter();
  const { createClient, updateClient, uploadFile, getSignedUrl } = useClients();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "proposals" | "documents">("info");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    notes: "",
    auth_email: "",
    process_status: "pendiente_de_propuesta",
  });

  // Files state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  
  // Web proposal modal
  const [webProposalOpen, setWebProposalOpen] = useState(false);
  const [webProposalTitle, setWebProposalTitle] = useState("");
  const [webProposalHtml, setWebProposalHtml] = useState("");
  const [webProposalPdfExportable, setWebProposalPdfExportable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company_name: client.company_name || "",
        notes: client.notes || "",
        auth_email: (client as { auth_email?: string }).auth_email || "",
        process_status: client.process_status || "pendiente_de_propuesta",
      });

      // Load files
      if (client.files && Array.isArray(client.files)) {
        const loadedFiles: FileItem[] = [];
        (client.files as Array<Record<string, unknown>>).forEach((f, index) => {
          // Include files with fileUrl OR web proposals with htmlContent
          const isWebProposal = f.isWebProposal === true;
          const hasFileUrl = f.fileUrl && f.fileName;
          const hasHtmlContent = isWebProposal && f.htmlContent;
          
          if (hasFileUrl || hasHtmlContent) {
            const fileItem: FileItem = {
              id: (f.id as string) || `file-${index}`,
              fileName: (f.fileName as string) || `${f.title || 'proposal'}.html`,
              fileUrl: (f.fileUrl as string) || "",
              filePath: (f.filePath as string) || "",
              category: (f.category as FileItem["category"]) || "general",
              title: (f.title as string) || (f.fileName as string) || "",
              createdAt: (f.createdAt as string) || new Date().toISOString(),
              isWebProposal: isWebProposal || false,
              htmlContent: (f.htmlContent as string) || undefined,
              pdfExportable: f.pdfExportable === true || f.pdfExportable === "true" || false,
            };
            loadedFiles.push(fileItem);
            if (isWebProposal) {
              console.log("[ClientEditorModal] Loaded web proposal:", fileItem);
            }
          }
        });
        console.log("[ClientEditorModal] Total files loaded:", loadedFiles.length);
        console.log("[ClientEditorModal] Web proposals loaded:", loadedFiles.filter(f => f.isWebProposal).length);
        setFiles(loadedFiles);
      } else {
        setFiles([]);
      }
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        notes: "",
        auth_email: "",
        process_status: "pendiente_de_propuesta",
      });
      setFiles([]);
    }
    setActiveTab("info");
    setError(null);
  }, [client, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare files data - ensure all required fields are present
      const filesData = files.map(f => {
        const fileData: any = {
          id: f.id,
          fileName: f.fileName,
          category: f.category,
          title: f.title || f.fileName,
          createdAt: f.createdAt || new Date().toISOString(),
        };

        // Add file path/URL only if they exist
        if (f.filePath) {
          fileData.filePath = f.filePath;
        }
        if (f.fileUrl) {
          fileData.fileUrl = f.fileUrl;
        }

        // Add web proposal specific fields
        if (f.isWebProposal) {
          fileData.isWebProposal = true;
          if (f.htmlContent) {
            fileData.htmlContent = f.htmlContent;
          }
          if (f.pdfExportable !== undefined) {
            fileData.pdfExportable = f.pdfExportable;
          }
        }

        return fileData;
      });

      console.log("Saving files:", filesData);
      console.log("Web proposals in filesData:", filesData.filter(f => f.isWebProposal));

      const clientData: ClientInsert & { auth_email?: string } = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        notes: formData.notes.trim() || null,
        process_status: formData.process_status,
        files: filesData,
      };

      if (formData.auth_email.trim()) {
        (clientData as { auth_email?: string }).auth_email = formData.auth_email.trim();
      }

      let result;
      if (client) {
        result = await updateClient(client.id, clientData);
      } else {
        result = await createClient(clientData);
      }

      if (result.error) {
        console.error("Save error:", result.error);
        setError(result.error);
      } else {
        console.log("Client saved successfully:", result.data);
        onSuccess?.();
        onClose();
        // Refresh the page to show updated data
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error("Save exception:", err);
      setError(err.message || "Error al guardar el cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    category: "proposals" | "legal-documents" | "general"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If client doesn't exist yet, we need to create it first
    if (!client) {
      setError("Por favor, guarda primero la información del cliente antes de subir archivos");
      event.target.value = "";
      return;
    }

    setUploadingCategory(category);
    setError(null);

    try {
      const result = await uploadFile(client.id, file);
      if (result.data) {
        const newFile: FileItem = {
          id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileUrl: result.data.fullPath, // Signed URL for immediate viewing
          filePath: result.data.path, // Storage path for permanent reference
          category,
          title: file.name.replace(/\.[^/.]+$/, ""),
          createdAt: new Date().toISOString(),
        };
        setFiles(prev => [...prev, newFile]);
        console.log("File uploaded successfully:", newFile);
      } else {
        setError(result.error || "Error al subir el archivo");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Error al subir el archivo");
    } finally {
      setUploadingCategory(null);
      event.target.value = "";
    }
  };

  const handleAddWebProposal = () => {
    if (!webProposalTitle.trim() || !webProposalHtml.trim()) {
      setError("El título y el contenido HTML son requeridos");
      return;
    }

    const newProposal: FileItem = {
      id: `web-proposal-${Date.now()}`,
      fileName: `${webProposalTitle}.html`,
      fileUrl: "",
      filePath: "",
      category: "proposals",
      title: webProposalTitle,
      createdAt: new Date().toISOString(),
      isWebProposal: true,
      htmlContent: webProposalHtml,
      pdfExportable: webProposalPdfExportable,
    };

    console.log("[ClientEditorModal] Adding web proposal:", newProposal);
    setFiles(prev => {
      const updated = [...prev, newProposal];
      console.log("[ClientEditorModal] Files after adding web proposal:", updated);
      return updated;
    });
    setWebProposalOpen(false);
    setWebProposalTitle("");
    setWebProposalHtml("");
    setWebProposalPdfExportable(false);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleViewFile = async (file: FileItem) => {
    if (file.isWebProposal && client) {
      router.push(`/dashboard/clients/${client.id}/proposals/${file.id}`);
    } else if (file.filePath) {
      const result = await getSignedUrl(file.filePath, 3600);
      if (result.data) {
        setViewingFile({ fileName: file.fileName, fileUrl: result.data });
      }
    }
  };

  const proposals = files.filter(f => f.category === "proposals");
  const documents = files.filter(f => f.category === "legal-documents");

  // Debug: Log files when they change
  useEffect(() => {
    console.log("Files state updated:", files);
    console.log("Proposals count:", proposals.length);
    console.log("Web proposals:", proposals.filter(p => p.isWebProposal));
  }, [files, proposals]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {client ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              {client && (
                <p className="text-gray-500 mt-1">{client.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-8 py-4 border-b border-gray-100 bg-gray-50">
            {[
              { key: "info", label: "Información", icon: "👤" },
              { key: "proposals", label: `Propuestas (${proposals.length})`, icon: "📄" },
              { key: "documents", label: `Documentos (${documents.length})`, icon: "📁" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? "bg-white text-[#FF3621] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Info Tab */}
            {activeTab === "info" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <PortalInput
                    label="Nombre *"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del cliente"
                  />
                  <PortalInput
                    label="Empresa"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <PortalInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                  />
                  <PortalInput
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <PortalInput
                  label="Email de acceso al portal"
                  type="email"
                  value={formData.auth_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, auth_email: e.target.value }))}
                  placeholder="Este email podrá acceder al portal del cliente"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del proceso
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {processStatuses.map((status) => (
                      <button
                        key={status.key}
                        onClick={() => setFormData(prev => ({ ...prev, process_status: status.key }))}
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium transition-colors
                          ${formData.process_status === status.key
                            ? "bg-[#FF3621] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }
                        `}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas adicionales sobre el cliente..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Proposals Tab */}
            {activeTab === "proposals" && (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <PortalButton
                    variant="secondary"
                    onClick={() => proposalInputRef.current?.click()}
                    loading={uploadingCategory === "proposals"}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    }
                  >
                    Subir Archivo
                  </PortalButton>
                  <PortalButton
                    variant="secondary"
                    onClick={() => setWebProposalOpen(true)}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    }
                  >
                    Web Proposal
                  </PortalButton>
                  <input
                    ref={proposalInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "proposals")}
                  />
                </div>

                {proposals.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay propuestas agregadas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${file.isWebProposal ? "bg-[#FF3621]/10" : "bg-gray-200"}
                          `}>
                            {file.isWebProposal ? (
                              <svg className="w-5 h-5 text-[#FF3621]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.title || file.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {file.isWebProposal ? "Web Proposal" : file.fileName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {client && (
                            <button
                              onClick={() => handleViewFile(file)}
                              className="p-2 rounded-lg text-gray-400 hover:text-[#FF3621] hover:bg-[#FF3621]/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <PortalButton
                  variant="secondary"
                  onClick={() => documentInputRef.current?.click()}
                  loading={uploadingCategory === "legal-documents"}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  }
                >
                  Subir Documento
                </PortalButton>
                <input
                  ref={documentInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "legal-documents")}
                />

                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay documentos agregados
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.title || file.fileName}</p>
                            <p className="text-xs text-gray-500">{file.fileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {client && (
                            <button
                              onClick={() => handleViewFile(file)}
                              className="p-2 rounded-lg text-gray-400 hover:text-[#FF3621] hover:bg-[#FF3621]/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-gray-50">
            <PortalButton variant="secondary" onClick={onClose}>
              Cancelar
            </PortalButton>
            <PortalButton onClick={handleSave} loading={saving}>
              {client ? "Guardar Cambios" : "Crear Cliente"}
            </PortalButton>
          </div>
        </motion.div>
      </motion.div>

      {/* Web Proposal Modal */}
      <AnimatePresence>
        {webProposalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={() => setWebProposalOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Agregar Web Proposal</h3>
                <button
                  onClick={() => setWebProposalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <PortalInput
                  label="Título"
                  value={webProposalTitle}
                  onChange={(e) => setWebProposalTitle(e.target.value)}
                  placeholder="Nombre de la propuesta"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido HTML
                  </label>
                  <textarea
                    value={webProposalHtml}
                    onChange={(e) => setWebProposalHtml(e.target.value)}
                    placeholder="Pega el código HTML aquí..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF3621]/20 focus:border-[#FF3621] transition-all duration-200 resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webProposalPdfExportable}
                    onChange={(e) => setWebProposalPdfExportable(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF3621] focus:ring-[#FF3621]/20"
                  />
                  <span className="text-sm text-gray-700">Permitir exportar como PDF</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <PortalButton variant="secondary" onClick={() => setWebProposalOpen(false)}>
                  Cancelar
                </PortalButton>
                <PortalButton
                  onClick={handleAddWebProposal}
                  disabled={!webProposalTitle.trim() || !webProposalHtml.trim()}
                >
                  Agregar
                </PortalButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Viewer */}
      {viewingFile && (
        <FileViewer
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
          fileName={viewingFile.fileName}
          fileUrl={viewingFile.fileUrl}
        />
      )}
    </>
  );
}


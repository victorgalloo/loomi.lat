"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/supabase";
import { useClients } from "@/hooks/useClients";
import FileUploader from "./FileUploader";
import Image from "next/image";
import { exportHtmlToPdf } from "@/lib/htmlToPdf";
import { PdfExportLoading } from "@/components/ui/pdf-export-loading";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

interface ClientEditorProps {
  client?: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type BlockType = "title" | "text" | "email" | "phone" | "company" | "notes" | "divider" | "file";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  filePath?: string;
  pendingFile?: File;
}

export default function ClientEditor({
  client,
  isOpen,
  onClose,
  onSuccess,
}: ClientEditorProps) {
  const router = useRouter();
  const { createClient, updateClient, uploadFile, getSignedUrl } = useClients();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Section collapse states
  const [sectionsOpen, setSectionsOpen] = useState({
    clientInfo: true,
    projects: false,
    resources: true,
    calendar: false,
  });

  // Client info fields
  const [clientInfo, setClientInfo] = useState({
    description: "",
    phone: "",
    email: "",
    company: "",
    auth_email: "",
  });

  // Process status
  const [processStatus, setProcessStatus] = useState<string>("pendiente_de_propuesta");

  // Resource view state
  const [openResource, setOpenResource] = useState<string | null>(null);
  
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
  
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [uploadingProposal, setUploadingProposal] = useState(false);
  const proposalFileInputRef = useRef<HTMLInputElement>(null);
  const webProposalHtmlInputRef = useRef<HTMLInputElement>(null);
  
  // Web Proposal Modal state
  const [webProposalModalOpen, setWebProposalModalOpen] = useState(false);
  const [webProposalTitle, setWebProposalTitle] = useState("");
  const [webProposalHtml, setWebProposalHtml] = useState("");
  const [webProposalHtmlFile, setWebProposalHtmlFile] = useState<File | null>(null);
  const [webProposalMode, setWebProposalMode] = useState<"paste" | "upload">("paste");
  const [uploadingWebProposal, setUploadingWebProposal] = useState(false);
  const [webProposalPdfExportable, setWebProposalPdfExportable] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfExportMessage, setPdfExportMessage] = useState("");
  const [viewingProposal, setViewingProposal] = useState<{
    id: string;
    title: string;
    attachment: { fileUrl: string; fileName: string; filePath: string };
  } | null>(null);
  const [editingProposal, setEditingProposal] = useState<{
    id: string;
    title: string;
    tags: string[];
    notes: string;
  } | null>(null);
  const [newTag, setNewTag] = useState("");

  // Legal Documents state
  const [legalDocuments, setLegalDocuments] = useState<Array<{
    id: string;
    title: string;
    attachment?: { fileUrl: string; fileName: string; filePath: string };
    createdAt?: string;
    tags?: string[];
    notes?: string;
  }>>([]);
  
  const [newLegalDocTitle, setNewLegalDocTitle] = useState("");
  const [uploadingLegalDoc, setUploadingLegalDoc] = useState(false);
  const legalDocFileInputRef = useRef<HTMLInputElement>(null);
  const [viewingLegalDoc, setViewingLegalDoc] = useState<{
    id: string;
    title: string;
    attachment: { fileUrl: string; fileName: string; filePath: string };
  } | null>(null);
  const [editingLegalDoc, setEditingLegalDoc] = useState<{
    id: string;
    title: string;
    tags: string[];
    notes: string;
  } | null>(null);
  const [newLegalDocTag, setNewLegalDocTag] = useState("");

  // Initialize blocks from client or create default template
  useEffect(() => {
    if (client) {
      // Load existing client data into blocks
      const initialBlocks: Block[] = [
        { id: "1", type: "title", content: client.name || "" },
      ];

      // Load client info
      setClientInfo({
        description: client.notes || "",
        phone: client.phone || "",
        email: client.email || "",
        company: client.company_name || "",
        auth_email: (client as any).auth_email || "",
      });

      // Load process status
      setProcessStatus((client as any).process_status || "pendiente_de_propuesta");

      // Load existing files if any
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
          // Only add to blocks if not a proposal or legal document (they are managed separately)
          if (file.category !== 'proposals' && file.category !== 'legal-documents') {
            initialBlocks.push({
              id: `file-${index}-${Date.now()}`,
              type: "file",
              content: "",
              fileUrl: file.fileUrl,
              fileName: file.fileName,
              filePath: file.filePath,
            });
          }
          
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
            pdfExportable: (file as any).pdfExportable || false,
          });
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
        });
      }

      setBlocks(initialBlocks);
      setProposals(loadedProposals);
      setLegalDocuments(loadedLegalDocs);
    } else {
      // Create new client template
      setBlocks([
        { id: "1", type: "title", content: "" },
      ]);
      setClientInfo({
        description: "",
        phone: "",
        email: "",
        company: "",
        auth_email: "",
      });
      setProposals([]);
      setLegalDocuments([]);
      setProcessStatus("pendiente_de_propuesta");
    }
    setOpenResource(null);
    setError(null);
  }, [client, isOpen]);

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, content } : block))
    );
  };

  const addBlock = (afterId: string, type: BlockType) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
    };
    const index = blocks.findIndex((b) => b.id === afterId);
    setBlocks((prev) => [
      ...prev.slice(0, index + 1),
      newBlock,
      ...prev.slice(index + 1),
    ]);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks((prev) => prev.filter((block) => block.id !== id));
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(file.name);

    try {
      const clientId = client?.id;
      
      if (!clientId) {
        // For new clients, just add to blocks - will upload after client creation
        const fileBlock: Block = {
          id: `temp-${Date.now()}`,
          type: "file",
          content: "",
          fileUrl: "",
          fileName: file.name,
        };
        (fileBlock as any).pendingFile = file;
        setBlocks((prev) => [...prev, fileBlock]);
        setUploadingFile(null);
        return;
      }

      // For existing clients, upload immediately
      const result = await uploadFile(clientId, file);
      if (result.error) {
        setError(result.error);
        setUploadingFile(null);
        return;
      }

      if (result.data) {
        const fileBlock: Block = {
          id: Date.now().toString(),
          type: "file",
          content: "",
          fileUrl: result.data.fullPath,
          fileName: file.name,
        };
        setBlocks((prev) => [...prev, fileBlock]);
      }
    } catch (err: any) {
      setError(err.message || "Error al subir archivo");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleSave = async () => {
    const titleBlock = blocks.find((b) => b.type === "title");
    if (!titleBlock?.content.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Extract file blocks
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      // Include proposals and legal documents
      const proposalsFiles = proposals.map((p) => ({
        ...(p.attachment ? { ...p.attachment } : {}),
        category: 'proposals',
        title: p.title,
        id: p.id,
        createdAt: p.createdAt,
        tags: p.tags || [],
        notes: p.notes || "",
        isWebProposal: p.isWebProposal || false,
        htmlContent: p.htmlContent || undefined,
      }));

      const legalDocsFiles = legalDocuments.map((d) => ({
        ...d.attachment!,
        category: 'legal-documents',
        title: d.title,
        id: d.id,
        createdAt: d.createdAt,
        tags: d.tags || [],
        notes: d.notes || "",
      }));

      const allFiles = [...filesData, ...proposalsFiles, ...legalDocsFiles];

      const clientData: ClientInsert & { auth_email?: string | null; process_status?: string } = {
        name: titleBlock.content.trim(),
        email: clientInfo.email.trim() || null,
        phone: clientInfo.phone.trim() || null,
        company_name: clientInfo.company.trim() || null,
        notes: clientInfo.description.trim() || null,
        auth_email: clientInfo.auth_email.trim() || null,
        files: allFiles.length > 0 ? allFiles : null,
        process_status: processStatus,
      };

      let result;
      let createdClientId: string | null = null;

      if (client) {
        result = await updateClient(client.id, clientData);
      } else {
        result = await createClient(clientData);
        if (result.data) {
          createdClientId = result.data.id;
        }
      }

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // If it's a new client, upload any pending files
      if (createdClientId) {
        const pendingFiles = fileBlocks.filter((f) => (f as any).pendingFile);
        
        if (pendingFiles.length > 0) {
          const uploadedFiles = [...filesData];
          
          for (const fileBlock of pendingFiles) {
            const file = (fileBlock as any).pendingFile as File;
            try {
              const uploadResult = await uploadFile(createdClientId, file);
              if (uploadResult.data) {
                uploadedFiles.push({
                  fileUrl: uploadResult.data.fullPath,
                  fileName: file.name,
                  filePath: uploadResult.data.path,
                });
              }
            } catch (err: any) {
              console.error("Error uploading pending file:", err);
            }
          }
          
          // Include proposals and legal documents
          const proposalsFilesForNew = proposals.map((p) => ({
            ...p.attachment!,
            category: 'proposals',
            title: p.title,
            id: p.id,
            createdAt: p.createdAt,
            tags: p.tags || [],
            notes: p.notes || "",
          }));

          const legalDocsFilesForNew = legalDocuments.map((d) => ({
            ...d.attachment!,
            category: 'legal-documents',
            title: d.title,
            id: d.id,
            createdAt: d.createdAt,
            tags: d.tags || [],
            notes: d.notes || "",
          }));

          const allFilesForNew = [...uploadedFiles, ...proposalsFilesForNew, ...legalDocsFilesForNew];

          if (allFilesForNew.length > 0) {
            await updateClient(createdClientId, { files: allFilesForNew });
          }
        }
      } else if (client) {
        const pendingFiles = fileBlocks.filter((f) => (f as any).pendingFile);
        
        if (pendingFiles.length > 0) {
          const uploadedFiles = [...filesData];
          
          for (const fileBlock of pendingFiles) {
            const file = (fileBlock as any).pendingFile as File;
            try {
              const uploadResult = await uploadFile(client.id, file);
              if (uploadResult.data) {
                uploadedFiles.push({
                  fileUrl: uploadResult.data.fullPath,
                  fileName: file.name,
                  filePath: uploadResult.data.path,
                });
              }
            } catch (err: any) {
              console.error("Error uploading pending file:", err);
            }
          }
          
          // Include proposals and legal documents
          const proposalsFilesForExisting = proposals.map((p) => ({
            ...p.attachment!,
            category: 'proposals',
            title: p.title,
            id: p.id,
            createdAt: p.createdAt,
            tags: p.tags || [],
            notes: p.notes || "",
          }));

          const legalDocsFilesForExisting = legalDocuments.map((d) => ({
            ...d.attachment!,
            category: 'legal-documents',
            title: d.title,
            id: d.id,
            createdAt: d.createdAt,
            tags: d.tags || [],
            notes: d.notes || "",
          }));

          const allFilesForExisting = [...uploadedFiles, ...proposalsFilesForExisting, ...legalDocsFilesForExisting];

          // Only update if new files were actually added
          if (uploadedFiles.length > filesData.length) {
            await updateClient(client.id, { files: allFilesForExisting });
          }
        }
      }

      setSaving(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
      setSaving(false);
    }
  };

  const handleProposalUpload = async (file: File) => {
    if (!client?.id) {
      setError("Primero guarda el cliente");
      return;
    }

    setUploadingProposal(true);
    try {
      const result = await uploadFile(client.id, file);
      if (result.error) {
        setError(result.error);
        setUploadingProposal(false);
        return;
      }

      if (result.data) {
        const newProposal = {
          id: Date.now().toString(),
          title: newProposalTitle.trim() || file.name,
          attachment: {
            fileUrl: result.data.fullPath,
            fileName: file.name,
            filePath: result.data.path,
          },
          createdAt: new Date().toISOString(),
          tags: [],
          notes: "",
        };

        setProposals((prev) => [...prev, newProposal]);

        // Save to client files
        const fileBlocks = blocks.filter((b) => b.type === "file");
        const filesData = fileBlocks
          .filter((f) => f.fileUrl)
          .map((f) => ({
            fileUrl: f.fileUrl!,
            fileName: f.fileName || "",
            filePath: f.fileUrl!.split('/').slice(-2).join('/'),
          }));

        const proposalsFiles = proposals.map((p) => ({
          ...p.attachment!,
          category: 'proposals',
          title: p.title,
          id: p.id,
          createdAt: p.createdAt,
          tags: p.tags || [],
          notes: p.notes || "",
        }));

        const allFiles = [
          ...filesData,
          ...proposalsFiles,
          {
            ...result.data,
            category: 'proposals',
            title: newProposal.title,
            id: newProposal.id,
            createdAt: newProposal.createdAt,
            tags: newProposal.tags,
            notes: newProposal.notes,
          },
        ];

        await updateClient(client.id, { files: allFiles });
        setNewProposalTitle("");
      }
    } catch (err: any) {
      setError(err.message || "Error al subir propuesta");
    } finally {
      setUploadingProposal(false);
    }
  };

  const generateWebProposalHTML = (clientName: string, proposalTitle: string): string => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta Comercial: ${proposalTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
            color: #37352F;
            background-color: #FFFFFF;
        }
        .notion-gray-bg { background-color: #F1F1EF; color: #37352F; }
        .notion-blue-bg { background-color: #E6F3F7; color: #37352F; }
        .notion-red-bg { background-color: #FDEBEC; color: #37352F; }
        .notion-orange-bg { background-color: #FBF3DB; color: #37352F; }
        .notion-green-bg { background-color: #EDF3EC; color: #37352F; }
        .notion-callout {
            padding: 16px;
            border-radius: 4px;
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        .notion-btn {
            transition: all 0.2s ease;
        }
        .notion-btn:hover {
            background-color: rgba(55, 53, 47, 0.08);
        }
        .notion-btn.active {
            background-color: #37352F;
            color: white;
        }
        .notion-table th {
            font-weight: 400;
            color: #9B9A97;
            font-size: 14px;
            border: 1px solid #E9E9E7;
            background-color: #F7F7F5;
        }
        .notion-table td {
            border: 1px solid #E9E9E7;
            font-size: 14px;
        }
        .chart-container {
            position: relative;
            width: 100%;
            height: 350px;
        }
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-thumb {
            background: #D3D1CB;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        h1, h2, h3 { letter-spacing: -0.02em; }
    </style>
</head>
<body>
    <div class="h-[30vh] w-full bg-gray-200 overflow-hidden relative group">
        <img src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Cover" class="w-full h-full object-cover object-center opacity-90">
        <div class="absolute bottom-4 right-4 bg-white/80 px-2 py-1 text-xs rounded text-gray-500 opacity-0 group-hover:opacity-100 transition">Change cover</div>
    </div>
    <main class="max-w-[900px] mx-auto px-6 md:px-24 relative pb-32">
        <div class="-mt-12 relative z-10 mb-8">
            <div class="text-7xl mb-4 drop-shadow-sm">🏃🏽‍♂️</div>
            <h1 class="text-4xl md:text-5xl font-bold text-[#37352F] mb-6 border-b border-[#E9E9E7] pb-6">Propuesta de Desarrollo: ${proposalTitle}</h1>
            <div class="flex flex-wrap gap-6 text-sm text-gray-500 mb-8 font-mono">
                <div class="flex items-center gap-2">
                    <span class="text-gray-400">📅 Fecha:</span>
                    <span class="text-[#37352F] bg-[#F1F1EF] px-1 rounded">${formattedDate}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-gray-400">👤 Cliente:</span>
                    <span class="text-[#37352F] border-b border-gray-300 border-dotted">${clientName}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-gray-400">🏷️ Tags:</span>
                    <span class="text-[#37352F] bg-[#FDEBEC] px-1 rounded text-xs">#Mobile</span>
                    <span class="text-[#37352F] bg-[#E6F3F7] px-1 rounded text-xs">#Social</span>
                </div>
            </div>
        </div>
        <div class="notion-gray-bg p-4 rounded-md mb-12">
            <h4 class="text-xs font-bold text-gray-500 uppercase mb-2 ml-1 tracking-wide">Tabla de Contenidos</h4>
            <nav class="flex flex-col space-y-1">
                <a href="#resumen" class="text-[#37352F] hover:bg-[#E3E2E0] px-2 py-1 rounded text-sm underline decoration-gray-300 underline-offset-4">1. Resumen Ejecutivo</a>
                <a href="#comparativa" class="text-[#37352F] hover:bg-[#E3E2E0] px-2 py-1 rounded text-sm underline decoration-gray-300 underline-offset-4">2. Estrategia Tecnológica (Comparativa)</a>
                <a href="#roadmap" class="text-[#37352F] hover:bg-[#E3E2E0] px-2 py-1 rounded text-sm underline decoration-gray-300 underline-offset-4">3. Roadmap & Funcionalidades</a>
                <a href="#inversion" class="text-[#37352F] hover:bg-[#E3E2E0] px-2 py-1 rounded text-sm underline decoration-gray-300 underline-offset-4">4. Inversión Estimada</a>
                <a href="#proximos-pasos" class="text-[#37352F] hover:bg-[#E3E2E0] px-2 py-1 rounded text-sm underline decoration-gray-300 underline-offset-4">5. Próximos Pasos</a>
            </nav>
        </div>
        <section id="resumen" class="mb-16 group">
            <div class="flex items-center gap-2 mb-4">
                <span class="bg-[#37352F] text-white text-xs font-bold px-1.5 py-0.5 rounded">1</span>
                <h2 class="text-2xl font-bold text-[#37352F]">Resumen Ejecutivo</h2>
            </div>
            <div class="notion-callout notion-blue-bg mb-6 border-l-4 border-[#2eaadc]">
                <div class="text-2xl">💡</div>
                <div>
                    <p class="font-medium">Visión:</p>
                    <p class="text-sm">"La red social para runners, enfocada en el deporte y app que busca llegar desde el 2025 hasta siempre"</p>
                </div>
            </div>
            <p class="text-lg leading-relaxed mb-4">
                ${proposalTitle} nace para ser la red social definitiva para corredores. Esta propuesta detalla cómo transformaremos esta visión en una realidad digital minimalista, funcional y escalable**.
            </p>
        </section>
        <hr class="border-[#E9E9E7] mb-12">
        <section id="comparativa" class="mb-16">
            <div class="flex items-center gap-2 mb-6">
                <span class="bg-[#37352F] text-white text-xs font-bold px-1.5 py-0.5 rounded">2</span>
                <h2 class="text-2xl font-bold text-[#37352F]">Estrategia Tecnológica</h2>
            </div>
            <p class="mb-6">Tenemos dos caminos. Interactúa con los botones de abajo para ver los detalles de cada opción:</p>
            <div class="flex gap-2 mb-6 border-b border-[#E9E9E7] pb-2">
                <button id="btn-flutter" onclick="selectOption('flutter')" class="notion-btn active px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                    <span>📱</span> Opción A: Flutter
                </button>
                <button id="btn-nativo" onclick="selectOption('nativo')" class="notion-btn px-3 py-1 rounded text-sm font-medium flex items-center gap-2 text-gray-500">
                    <span>🍎/🤖</span> Opción B: Nativo
                </button>
            </div>
            <div class="border border-[#E9E9E7] rounded p-6 shadow-sm">
                <h3 id="tech-title" class="text-xl font-bold mb-2">Desarrollo Multiplataforma (Flutter)</h3>
                <p id="tech-subtitle" class="text-gray-500 text-sm mb-6 border-l-2 border-gray-300 pl-3">Un solo código base. Recomendado para startups.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-green-600 text-sm">▼</span>
                            <h4 class="font-bold text-sm uppercase tracking-wide text-gray-500">Ventajas</h4>
                        </div>
                        <ul id="ventajas-list" class="list-disc list-inside text-sm space-y-1 pl-2"></ul>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-red-500 text-sm">▼</span>
                            <h4 class="font-bold text-sm uppercase tracking-wide text-gray-500">Desventajas</h4>
                        </div>
                        <ul id="desventajas-list" class="list-disc list-inside text-sm space-y-1 pl-2"></ul>
                    </div>
                </div>
                <div class="mt-6 pt-6 border-t border-[#E9E9E7]">
                    <span class="bg-[#FBF3DB] text-[#37352F] px-2 py-1 rounded text-xs font-mono">VEREDICTO</span>
                    <p id="ideal-para-text" class="mt-2 text-sm italic text-gray-600"></p>
                </div>
            </div>
        </section>
        <hr class="border-[#E9E9E7] mb-12">
        <section id="roadmap" class="mb-16">
            <div class="flex items-center gap-2 mb-6">
                <span class="bg-[#37352F] text-white text-xs font-bold px-1.5 py-0.5 rounded">3</span>
                <h2 class="text-2xl font-bold text-[#37352F]">Roadmap de Desarrollo</h2>
            </div>
            <div class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-64 flex-shrink-0 flex flex-col gap-1">
                    <button data-step="diseno" class="step-btn text-left px-3 py-2 rounded text-sm hover:bg-[#F1F1EF] transition font-medium bg-[#F1F1EF] text-[#37352F]">
                        🎨 1. Identidad & Diseño
                    </button>
                    <button data-step="v1" class="step-btn text-left px-3 py-2 rounded text-sm hover:bg-[#F1F1EF] transition text-gray-500">
                        🛠️ 2. Desarrollo v1.0 (MVP)
                    </button>
                    <button data-step="qa" class="step-btn text-left px-3 py-2 rounded text-sm hover:bg-[#F1F1EF] transition text-gray-500">
                        🧪 3. QA & Despliegue
                    </button>
                    <button data-step="v1-1" class="step-btn text-left px-3 py-2 rounded text-sm hover:bg-[#F1F1EF] transition text-gray-500">
                        💬 4. Desarrollo v1.1 (Social)
                    </button>
                </div>
                <div id="step-content" class="flex-grow border-l border-[#E9E9E7] pl-8 min-h-[300px]">
                    <div id="step-diseno" class="step-content-panel">
                        <div class="mb-4">
                            <span class="text-xs font-bold text-gray-400 uppercase">Duración: 3-4 semanas</span>
                            <h3 class="text-xl font-bold mt-1">Fase A: Identidad de Marca</h3>
                        </div>
                        <div class="notion-callout notion-gray-bg">
                            <span>✏️</span>
                            <p class="text-sm">Definiremos el "alma" minimalista de ${proposalTitle} antes de programar.</p>
                        </div>
                        <ul class="list-disc list-inside text-sm space-y-2 mt-4">
                            <li><strong class="font-medium">Logotipo:</strong> Isologotipo versátil.</li>
                            <li><strong class="font-medium">UI Kit:</strong> Componentes reutilizables y paleta de colores.</li>
                            <li><strong class="font-medium">Prototipos:</strong> Mockups de alta fidelidad.</li>
                        </ul>
                    </div>
                    <div id="step-v1" class="step-content-panel hidden">
                        <div class="mb-4">
                            <span class="text-xs font-bold text-gray-400 uppercase">Duración: 6-8 semanas</span>
                            <h3 class="text-xl font-bold mt-1">Fase B: ${proposalTitle} v1.0 (Core)</h3>
                        </div>
                        <div class="notion-callout notion-orange-bg">
                            <span>🚧</span>
                            <p class="text-sm">Objetivo: Correr y sentirse seguro (SOS + Mapas).</p>
                        </div>
                        <ul class="list-disc list-inside text-sm space-y-2 mt-4">
                            <li><strong class="font-medium">Auth (Supabase):</strong> Login Google/Email.</li>
                            <li><strong class="font-medium">Maps SDK:</strong> Tracking de ruta en tiempo real.</li>
                            <li><strong class="font-medium">SOS:</strong> Botón de pánico con ubicación en vivo.</li>
                        </ul>
                    </div>
                    <div id="step-qa" class="step-content-panel hidden">
                        <div class="mb-4">
                            <span class="text-xs font-bold text-gray-400 uppercase">Duración: 1-2 semanas</span>
                            <h3 class="text-xl font-bold mt-1">Fase C: Pruebas</h3>
                        </div>
                        <p class="text-sm mb-4">Limpieza de bugs y subida a tiendas.</p>
                        <ul class="list-disc list-inside text-sm space-y-2">
                            <li>Testflight (iOS) y Internal Testing (Android).</li>
                            <li>Configuración de certificados de Apple/Google.</li>
                        </ul>
                    </div>
                    <div id="step-v1-1" class="step-content-panel hidden">
                        <div class="mb-4">
                            <span class="text-xs font-bold text-gray-400 uppercase">Duración: 3-4 semanas (Post v1.0)</span>
                            <h3 class="text-xl font-bold mt-1">Fase D: ${proposalTitle} v1.1 (Social)</h3>
                        </div>
                        <div class="notion-callout notion-green-bg">
                            <span>💬</span>
                            <p class="text-sm">Activamos la comunidad.</p>
                        </div>
                        <ul class="list-disc list-inside text-sm space-y-2 mt-4">
                            <li>Perfiles públicos.</li>
                            <li>Chat 1 a 1 en tiempo real.</li>
                            <li>Feed de actividad (básico).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        <hr class="border-[#E9E9E7] mb-12">
        <section id="inversion" class="mb-16">
            <div class="flex items-center gap-2 mb-6">
                <span class="bg-[#37352F] text-white text-xs font-bold px-1.5 py-0.5 rounded">4</span>
                <h2 class="text-2xl font-bold text-[#37352F]">Inversión Estimada</h2>
            </div>
            <div class="mb-6 flex items-center gap-3">
                <span class="text-sm text-gray-500">Vista actual:</span>
                <span id="current-view-badge" class="bg-[#E6F3F7] text-[#37352F] px-2 py-1 rounded text-sm cursor-default border border-transparent">
                    Opción A: Flutter
                </span>
                <span class="text-xs text-gray-400">(Cambia la opción en la sección 2 para actualizar esto)</span>
            </div>
            <div class="overflow-hidden border border-[#E9E9E7] rounded mb-8">
                <table class="w-full notion-table text-left border-collapse">
                    <thead>
                        <tr>
                            <th class="p-3 border-r border-[#E9E9E7] w-1/3">Concepto</th>
                            <th class="p-3 border-r border-[#E9E9E7]">Detalles</th>
                            <th class="p-3 text-right bg-[#F7F7F5] w-1/4 text-[#37352F]">Costo (MXN)</th>
                        </tr>
                    </thead>
                    <tbody id="investment-table-body"></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" class="p-3 border-t border-[#E9E9E7] font-bold text-right bg-white">TOTAL ESTIMADO</td>
                            <td id="total-cost" class="p-3 border-t border-l border-[#E9E9E7] font-bold text-right bg-[#F1F1EF] text-[#37352F]">$180,000 MXN + IVA</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mb-4">
                <h4 class="text-sm font-bold text-gray-500 mb-2">📊 Comparativa Visual</h4>
                <div class="chart-container bg-white border border-[#E9E9E7] rounded p-4">
                    <canvas id="costChart"></canvas>
                </div>
            </div>
        </section>
        <section id="proximos-pasos" class="mb-24">
            <div class="notion-callout notion-gray-bg border border-[#E9E9E7]">
                <div class="text-2xl">👋</div>
                <div class="w-full">
                    <h3 class="font-bold text-lg mb-2">¿Listo para empezar?</h3>
                    <p class="text-sm mb-4">Para dar inicio al proyecto ${proposalTitle}, estos son los siguientes pasos:</p>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <input type="checkbox" disabled class="w-4 h-4 rounded border-gray-300">
                            <span class="text-sm line-through text-gray-400">Recibir propuesta</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 cursor-pointer">
                            <span class="text-sm">Aprobación de presupuesto</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 cursor-pointer">
                            <span class="text-sm">Pago de anticipo (50%)</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 cursor-pointer">
                            <span class="text-sm">Kick-off Meeting de Diseño</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const techData = {
                flutter: {
                    title: "Desarrollo Multiplataforma (Flutter)",
                    subtitle: "Un solo código base. Ideal para validación rápida.",
                    totalCost: "$180,000 MXN + IVA",
                    badge: "Opción A: Flutter",
                    badgeClass: "bg-[#E6F3F7]",
                    ventajas: [
                        "<strong>Velocidad:</strong> 30-40% más rápido.",
                        "<strong>Costo:</strong> Menor mantenimiento.",
                        "<strong>UI:</strong> Idéntica en iOS y Android."
                    ],
                    desventajas: [
                        "Dependencia de plugins para funciones de hardware muy nuevas."
                    ],
                    ideal: "Startups que buscan validar mercado y eficiencia presupuestal.",
                    costos: [
                        { concepto: "Fase de Diseño", desc: "Branding, UX, UI Kit", costo: "$35,000" },
                        { concepto: "Desarrollo v1.0", desc: "Supabase, Mapas, SOS", costo: "$95,000" },
                        { concepto: "Desarrollo v1.1", desc: "Chat y Social", costo: "$45,000" },
                        { concepto: "Gestión Tiendas", desc: "Despliegue Apple/Google", costo: "$5,000" }
                    ]
                },
                nativo: {
                    title: "Desarrollo Nativo (Swift & Kotlin)",
                    subtitle: "Máximo rendimiento, doble código base.",
                    totalCost: "$290,000 MXN + IVA",
                    badge: "Opción B: Nativo",
                    badgeClass: "bg-[#FDEBEC]",
                    ventajas: [
                        "<strong>Potencia:</strong> Acceso directo a hardware.",
                        "<strong>Estándar:</strong> UX 100% nativa de cada OS."
                    ],
                    desventajas: [
                        "<strong>Doble Costo:</strong> Dos equipos de desarrollo.",
                        "<strong>Mantenimiento:</strong> Dos códigos separados."
                    ],
                    ideal: "Proyectos con alto presupuesto y necesidades de hardware complejas.",
                    costos: [
                        { concepto: "Fase de Diseño", desc: "Adaptaciones nativas iOS/Android", costo: "$35,000" },
                        { concepto: "Desarrollo v1.0", desc: "Swift (iOS) + Kotlin (Android)", costo: "$155,000" },
                        { concepto: "Desarrollo v1.1", desc: "Social nativo x2", costo: "$95,000" },
                        { concepto: "Gestión Tiendas", desc: "Despliegue", costo: "$5,000" }
                    ]
                }
            };
            const ctx = document.getElementById('costChart').getContext('2d');
            Chart.defaults.font.family = 'Inter';
            Chart.defaults.color = '#37352F';
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Diseño", "Dev v1.0", "Dev v1.1", "Tiendas"],
                    datasets: [
                        {
                            label: "Flutter",
                            data: [35000, 95000, 45000, 5000],
                            backgroundColor: "#2EAADC",
                            borderRadius: 4
                        },
                        {
                            label: "Nativo",
                            data: [35000, 155000, 95000, 5000],
                            backgroundColor: "#EB5757",
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12 } }
                    },
                    scales: {
                        y: {
                            grid: { color: '#F1F1EF' },
                            ticks: { callback: val => '$' + val/1000 + 'k' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
            window.selectOption = function(option) {
                const data = techData[option];
                const btnFlutter = document.getElementById('btn-flutter');
                const btnNativo = document.getElementById('btn-nativo');
                document.getElementById('tech-title').innerText = data.title;
                document.getElementById('tech-subtitle').innerText = data.subtitle;
                document.getElementById('ventajas-list').innerHTML = data.ventajas.map(i => '<li>' + i + '</li>').join('');
                document.getElementById('desventajas-list').innerHTML = data.desventajas.map(i => '<li>' + i + '</li>').join('');
                document.getElementById('ideal-para-text').innerText = data.ideal;
                const viewBadge = document.getElementById('current-view-badge');
                viewBadge.innerText = data.badge;
                viewBadge.className = 'px-2 py-1 rounded text-sm cursor-default border border-transparent text-[#37352F] ' + data.badgeClass;
                const tbody = document.getElementById('investment-table-body');
                tbody.innerHTML = data.costos.map(row => '<tr class="hover:bg-[#F7F7F5] transition-colors"><td class="p-3 border-r border-b border-[#E9E9E7] font-medium text-sm"><span class="mr-2">📄</span>' + row.concepto + '</td><td class="p-3 border-r border-b border-[#E9E9E7] text-gray-500 text-sm">' + row.desc + '</td><td class="p-3 border-b border-[#E9E9E7] text-right font-mono text-sm">' + row.costo + '</td></tr>').join('');
                document.getElementById('total-cost').innerText = data.totalCost;
                if(option === 'flutter') {
                    btnFlutter.classList.add('active', 'bg-[#37352F]', 'text-white');
                    btnFlutter.classList.remove('text-gray-500');
                    btnNativo.classList.remove('active', 'bg-[#37352F]', 'text-white');
                    btnNativo.classList.add('text-gray-500');
                } else {
                    btnNativo.classList.add('active', 'bg-[#37352F]', 'text-white');
                    btnNativo.classList.remove('text-gray-500');
                    btnFlutter.classList.remove('active', 'bg-[#37352F]', 'text-white');
                    btnFlutter.classList.add('text-gray-500');
                }
            };
            const stepBtns = document.querySelectorAll('.step-btn');
            const stepPanels = document.querySelectorAll('.step-content-panel');
            stepBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const stepId = btn.getAttribute('data-step');
                    stepPanels.forEach(panel => {
                        if(panel.id === 'step-' + stepId) panel.classList.remove('hidden');
                        else panel.classList.add('hidden');
                    });
                    stepBtns.forEach(b => {
                        b.classList.remove('bg-[#F1F1EF]', 'text-[#37352F]', 'font-medium');
                        b.classList.add('text-gray-500');
                    });
                    btn.classList.add('bg-[#F1F1EF]', 'text-[#37352F]', 'font-medium');
                    btn.classList.remove('text-gray-500');
                });
            });
            selectOption('flutter');
        });
    </script>
</body>
</html>`;
  };

  const handleOpenWebProposalModal = () => {
    if (!client?.id) {
      setError("Primero guarda el cliente");
      return;
    }
    setWebProposalTitle("");
    setWebProposalHtml("");
    setWebProposalHtmlFile(null);
    setWebProposalMode("paste");
    setWebProposalPdfExportable(false);
    setWebProposalModalOpen(true);
  };

  const handleWebProposalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      setError("Por favor, sube un archivo .html");
      return;
    }

    setWebProposalHtmlFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setWebProposalHtml(content);
    };
    reader.readAsText(file);
  };

  const handleCreateWebProposal = async () => {
    if (!client?.id) {
      setError("Primero guarda el cliente");
      return;
    }

    if (!webProposalTitle.trim()) {
      setError("El título de la propuesta es requerido");
      return;
    }

    let htmlContent = "";

    if (webProposalMode === "upload") {
      if (!webProposalHtmlFile) {
        setError("Por favor, sube un archivo HTML");
        return;
      }
      htmlContent = webProposalHtml;
    } else {
      if (!webProposalHtml.trim()) {
        setError("Por favor, pega el HTML o sube un archivo");
        return;
      }
      htmlContent = webProposalHtml;
    }

    if (!htmlContent.trim()) {
      setError("El HTML no puede estar vacío");
      return;
    }

    setUploadingWebProposal(true);
    setError(null);

    try {
      const proposalId = Date.now().toString();

      const newProposal = {
        id: proposalId,
        title: webProposalTitle.trim(),
        createdAt: new Date().toISOString(),
        tags: [],
        notes: "",
        isWebProposal: true,
        htmlContent: htmlContent,
        pdfExportable: webProposalPdfExportable,
      };

      setProposals((prev) => [...prev, newProposal]);

      // Save to client files
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      const proposalsFiles = proposals.map((p) => ({
        ...(p.attachment ? { ...p.attachment } : {}),
        category: 'proposals',
        title: p.title,
        id: p.id,
        createdAt: p.createdAt,
        tags: p.tags || [],
        notes: p.notes || "",
        isWebProposal: p.isWebProposal || false,
        htmlContent: p.htmlContent || undefined,
      }));

      const allFiles = [
        ...filesData,
        ...proposalsFiles,
        {
          category: 'proposals',
          title: newProposal.title,
          id: newProposal.id,
          createdAt: newProposal.createdAt,
        tags: newProposal.tags,
        notes: newProposal.notes,
        isWebProposal: true,
        htmlContent: htmlContent,
        pdfExportable: webProposalPdfExportable,
      },
      ];

      await updateClient(client.id, { files: allFiles });

      // Close modal and reset state
      setWebProposalModalOpen(false);
      setWebProposalTitle("");
      setWebProposalHtml("");
      setWebProposalHtmlFile(null);
      setWebProposalMode("paste");
      setWebProposalPdfExportable(false);

      // Redirect to web proposal page
      router.push(`/dashboard/clients/${client.id}/proposals/${proposalId}`);
    } catch (err: any) {
      setError(err.message || "Error al crear propuesta web");
    } finally {
      setUploadingWebProposal(false);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!client?.id) return;

    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    try {
      // Remove from proposals state
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));

      // Update client files
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      const proposalsFiles = proposals
        .filter((p) => p.id !== proposalId)
        .map((p) => ({
          ...(p.attachment ? { ...p.attachment } : {}),
          category: 'proposals',
          title: p.title,
          id: p.id,
          createdAt: p.createdAt,
          tags: p.tags || [],
          notes: p.notes || "",
          isWebProposal: p.isWebProposal || false,
          htmlContent: p.htmlContent || undefined,
        }));

      const allFiles = [...filesData, ...proposalsFiles];
      await updateClient(client.id, { files: allFiles });
    } catch (err: any) {
      setError(err.message || "Error al eliminar propuesta");
    }
  };

  const handleUpdateProposal = async () => {
    if (!client?.id || !editingProposal) return;

    try {
      // Update client files with updated proposal
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      // Update proposal in state first, then use updated state
      setProposals((prev) => {
        const updated = prev.map((p) =>
          p.id === editingProposal.id
            ? { ...p, title: editingProposal.title, tags: editingProposal.tags, notes: editingProposal.notes }
            : p
        );

        // Save to client files with updated proposals
        const proposalsFiles = updated.map((p) => ({
          ...(p.attachment ? { ...p.attachment } : {}),
          category: 'proposals',
          title: p.title,
          id: p.id,
          createdAt: p.createdAt,
          tags: p.tags || [],
          notes: p.notes || "",
          isWebProposal: p.isWebProposal || false,
          htmlContent: p.htmlContent || undefined,
        }));

        const allFiles = [...filesData, ...proposalsFiles];
        updateClient(client.id, { files: allFiles }).catch((err: any) => {
          setError(err.message || "Error al actualizar propuesta");
        });

        return updated;
      });

      setEditingProposal(null);
    } catch (err: any) {
      setError(err.message || "Error al actualizar propuesta");
    }
  };

  const addTagToProposal = (tag: string) => {
    if (!editingProposal || !tag.trim()) return;
    const trimmedTag = tag.trim();
    if (!editingProposal.tags.includes(trimmedTag)) {
      setEditingProposal({
        ...editingProposal,
        tags: [...editingProposal.tags, trimmedTag],
      });
    }
    setNewTag("");
  };

  const removeTagFromProposal = (tagToRemove: string) => {
    if (!editingProposal) return;
    setEditingProposal({
      ...editingProposal,
      tags: editingProposal.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Legal Documents functions
  const handleLegalDocUpload = async (file: File) => {
    if (!client?.id) {
      setError("Primero guarda el cliente");
      return;
    }

    setUploadingLegalDoc(true);
    try {
      const result = await uploadFile(client.id, file);
      if (result.error) {
        setError(result.error);
        setUploadingLegalDoc(false);
        return;
      }

      if (result.data) {
        const newLegalDoc = {
          id: Date.now().toString(),
          title: newLegalDocTitle.trim() || file.name,
          attachment: {
            fileUrl: result.data.fullPath,
            fileName: file.name,
            filePath: result.data.path,
          },
          createdAt: new Date().toISOString(),
          tags: [],
          notes: "",
        };

        setLegalDocuments((prev) => [...prev, newLegalDoc]);

        // Save to client files
        const fileBlocks = blocks.filter((b) => b.type === "file");
        const filesData = fileBlocks
          .filter((f) => f.fileUrl)
          .map((f) => ({
            fileUrl: f.fileUrl!,
            fileName: f.fileName || "",
            filePath: f.fileUrl!.split('/').slice(-2).join('/'),
          }));

        const proposalsFiles = proposals.map((p) => ({
          ...p.attachment!,
          category: 'proposals',
          title: p.title,
          id: p.id,
          createdAt: p.createdAt,
          tags: p.tags || [],
          notes: p.notes || "",
        }));

        const legalDocsFiles = legalDocuments.map((d) => ({
          ...d.attachment!,
          category: 'legal-documents',
          title: d.title,
          id: d.id,
          createdAt: d.createdAt,
          tags: d.tags || [],
          notes: d.notes || "",
        }));

        const allFiles = [
          ...filesData,
          ...proposalsFiles,
          ...legalDocsFiles,
          {
            ...result.data,
            category: 'legal-documents',
            title: newLegalDoc.title,
            id: newLegalDoc.id,
            createdAt: newLegalDoc.createdAt,
            tags: newLegalDoc.tags,
            notes: newLegalDoc.notes,
          },
        ];

        await updateClient(client.id, { files: allFiles });
        setNewLegalDocTitle("");
      }
    } catch (err: any) {
      setError(err.message || "Error al subir documento legal");
    } finally {
      setUploadingLegalDoc(false);
    }
  };

  const handleDeleteLegalDoc = async (docId: string) => {
    if (!client?.id) return;

    const doc = legalDocuments.find((d) => d.id === docId);
    if (!doc) return;

    try {
      // Remove from legal documents state
      setLegalDocuments((prev) => prev.filter((d) => d.id !== docId));

      // Update client files
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      const proposalsFiles = proposals.map((p) => ({
        ...(p.attachment ? { ...p.attachment } : {}),
        category: 'proposals',
        title: p.title,
        id: p.id,
        createdAt: p.createdAt,
        tags: p.tags || [],
        notes: p.notes || "",
        isWebProposal: p.isWebProposal || false,
        htmlContent: p.htmlContent || undefined,
      }));

      const legalDocsFiles = legalDocuments
        .filter((d) => d.id !== docId)
        .map((d) => ({
          ...d.attachment!,
          category: 'legal-documents',
          title: d.title,
          id: d.id,
          createdAt: d.createdAt,
          tags: d.tags || [],
          notes: d.notes || "",
        }));

      const allFiles = [...filesData, ...proposalsFiles, ...legalDocsFiles];
      await updateClient(client.id, { files: allFiles });
    } catch (err: any) {
      setError(err.message || "Error al eliminar documento legal");
    }
  };

  const handleUpdateLegalDoc = async () => {
    if (!client?.id || !editingLegalDoc) return;

    try {
      // Update client files with updated legal doc
      const fileBlocks = blocks.filter((b) => b.type === "file");
      const filesData = fileBlocks
        .filter((f) => f.fileUrl)
        .map((f) => ({
          fileUrl: f.fileUrl!,
          fileName: f.fileName || "",
          filePath: f.fileUrl!.split('/').slice(-2).join('/'),
        }));

      // Update legal doc in state first, then use updated state
      setLegalDocuments((prev) => {
        const updated = prev.map((d) =>
          d.id === editingLegalDoc.id
            ? { ...d, title: editingLegalDoc.title, tags: editingLegalDoc.tags, notes: editingLegalDoc.notes }
            : d
        );

        // Save to client files with updated legal docs
        const proposalsFiles = proposals.map((p) => ({
          ...p.attachment!,
          category: 'proposals',
          title: p.title,
          id: p.id,
          createdAt: p.createdAt,
          tags: p.tags || [],
          notes: p.notes || "",
        }));

        const legalDocsFiles = updated.map((d) => ({
          ...d.attachment!,
          category: 'legal-documents',
          title: d.title,
          id: d.id,
          createdAt: d.createdAt,
          tags: d.tags || [],
          notes: d.notes || "",
        }));

        const allFiles = [...filesData, ...proposalsFiles, ...legalDocsFiles];
        updateClient(client.id, { files: allFiles }).catch((err: any) => {
          setError(err.message || "Error al actualizar documento legal");
        });

        return updated;
      });

      setEditingLegalDoc(null);
    } catch (err: any) {
      setError(err.message || "Error al actualizar documento legal");
    }
  };

  const addTagToLegalDoc = (tag: string) => {
    if (!editingLegalDoc || !tag.trim()) return;
    const trimmedTag = tag.trim();
    if (!editingLegalDoc.tags.includes(trimmedTag)) {
      setEditingLegalDoc({
        ...editingLegalDoc,
        tags: [...editingLegalDoc.tags, trimmedTag],
      });
    }
    setNewLegalDocTag("");
  };

  const removeTagFromLegalDoc = (tagToRemove: string) => {
    if (!editingLegalDoc) return;
    setEditingLegalDoc({
      ...editingLegalDoc,
      tags: editingLegalDoc.tags.filter((t) => t !== tagToRemove),
    });
  };

  const renderFileBlock = (block: Block) => {
    const isImage = block.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    return (
      <div key={block.id} className="mb-4 p-4 rounded-2xl border transition-colors duration-300" style={{ backgroundColor: `var(--card-bg)`, borderColor: `var(--border)` }}>
        <div className="flex items-start gap-3">
          {isImage && block.fileUrl ? (
            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: `var(--accent)` }}>
              <img
                src={block.fileUrl}
                alt={block.fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `var(--accent)` }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--foreground)` }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium transition-colors duration-300 truncate" style={{ color: `var(--foreground)` }}>
              {block.fileName}
            </p>
            {block.fileUrl && (
              <a
                href={block.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs transition-colors duration-300 hover:opacity-70 inline-block mt-1"
                style={{ color: `var(--accent)` }}
                onClick={(e) => e.stopPropagation()}
              >
                Ver archivo
              </a>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(block.id);
            }}
            className="p-2 rounded hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: `var(--muted-foreground)` }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const titleBlock = blocks.find((b) => b.type === "title");
  const clientName = titleBlock?.content || "Nuevo Cliente";
  const fileBlocks = blocks.filter((b) => b.type === "file");

  return (
    <>
      <PdfExportLoading isOpen={exportingPdf} message={pdfExportMessage} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-6xl max-h-[95vh] rounded-2xl transition-colors duration-300 flex flex-col overflow-hidden"
        style={{
          backgroundColor: `var(--background)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Process Timeline */}
        <div className="px-8 pt-8 pb-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)`, backgroundColor: `var(--background)` }}>
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
                      <button
                        onClick={() => setProcessStatus(status.key)}
                        className="group relative flex flex-col items-center w-full transition-all duration-500 ease-out"
                      >
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
                                ? `0 0 0 4px var(--background), 0 0 0 8px var(--accent), 0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 30px rgba(115, 115, 115, 0.6)` 
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
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
          <div className="flex-1">
            <input
              type="text"
              value={titleBlock?.content || ""}
              onChange={(e) => updateBlock("1", e.target.value)}
              placeholder="Nombre del Cliente"
              className="w-full text-3xl font-bold bg-transparent border-none outline-none transition-colors duration-300 placeholder:opacity-30"
              style={{ color: `var(--foreground)` }}
              autoFocus={!client}
            />
            <p className="text-sm mt-1 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
              Client Portal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
              onMouseEnter={(e) => {
                if (!saving && !loading) {
                  e.currentTarget.style.backgroundColor = "#e5e5e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && !loading) {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }
              }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={onClose}
              className="text-2xl leading-none transition-colors duration-300 hover:opacity-70"
              style={{ color: `var(--muted-foreground)` }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 min-w-0">
          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl border transition-colors duration-300"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "#ef4444",
                color: "#ef4444",
              }}
            >
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Client Info Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("clientInfo")}
              className="w-full flex items-center gap-2 py-3 transition-colors duration-300 hover:opacity-70"
              style={{ color: `var(--foreground)` }}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${sectionsOpen.clientInfo ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-lg font-semibold">Información del Cliente</span>
            </button>
            {sectionsOpen.clientInfo && (
              <div className="ml-7 mt-4 space-y-6 min-w-0">
                {/* Description */}
                <div className="min-w-0 w-full">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-sm font-medium opacity-50 min-w-[100px] pt-2 transition-colors duration-300 flex-shrink-0" style={{ color: `var(--muted-foreground)` }}>
                      Descripción
                    </span>
                  </div>
                  <div className="ml-[108px] -mt-2 min-w-0 w-[calc(100%-108px)]">
                    <textarea
                      value={clientInfo.description}
                      onChange={(e) => setClientInfo({ ...clientInfo, description: e.target.value })}
                      placeholder="Descripción del cliente..."
                      rows={6}
                      className="w-full text-lg bg-transparent border-none outline-none resize-none transition-colors duration-300 placeholder:opacity-30 leading-relaxed"
                      style={{ 
                        color: `var(--foreground)`,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium opacity-50 min-w-[100px] pt-2 transition-colors duration-300 flex-shrink-0" style={{ color: `var(--muted-foreground)` }}>
                      Correo
                    </span>
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className="flex-1 text-lg bg-transparent border-none outline-none transition-colors duration-300 placeholder:opacity-30 py-2 min-w-0"
                      style={{ color: `var(--foreground)`, maxWidth: '100%' }}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium opacity-50 min-w-[100px] pt-2 transition-colors duration-300 flex-shrink-0" style={{ color: `var(--muted-foreground)` }}>
                      Número
                    </span>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className="flex-1 text-lg bg-transparent border-none outline-none transition-colors duration-300 placeholder:opacity-30 py-2 min-w-0"
                      style={{ color: `var(--foreground)`, maxWidth: '100%' }}
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium opacity-50 min-w-[100px] pt-2 transition-colors duration-300 flex-shrink-0" style={{ color: `var(--muted-foreground)` }}>
                      Empresa
                    </span>
                    <input
                      type="text"
                      value={clientInfo.company}
                      onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
                      placeholder="Nombre de la empresa"
                      className="flex-1 text-lg bg-transparent border-none outline-none transition-colors duration-300 placeholder:opacity-30 py-2 min-w-0"
                      style={{ color: `var(--foreground)`, maxWidth: '100%' }}
                    />
                  </div>
                </div>

                {/* Auth Email */}
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-medium opacity-50 min-w-[100px] pt-2 transition-colors duration-300 flex-shrink-0" style={{ color: `var(--muted-foreground)` }}>
                      Auth Email
                    </span>
                    <div className="flex-1 min-w-0">
                      <input
                        type="email"
                        value={clientInfo.auth_email}
                        onChange={(e) => setClientInfo({ ...clientInfo, auth_email: e.target.value })}
                        placeholder="email@ejemplo.com (para acceso de cliente)"
                        className="w-full text-lg bg-transparent border-none outline-none transition-colors duration-300 placeholder:opacity-30 py-2 min-w-0"
                        style={{ color: `var(--foreground)`, maxWidth: '100%' }}
                      />
                      <p className="text-xs opacity-50 mt-1 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        Email del usuario creado en Supabase Auth (debe coincidir exactamente)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Project Board Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("projects")}
              className="w-full flex items-center gap-2 py-3 transition-colors duration-300 hover:opacity-70"
              style={{ color: `var(--foreground)` }}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${sectionsOpen.projects ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-lg font-semibold">Project Board</span>
            </button>
            {sectionsOpen.projects && (
              <div className="ml-7 mt-4">
                <div className="flex gap-2 mb-4">
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors duration-300" style={{ backgroundColor: `var(--accent)`, color: `var(--foreground)` }}>
                    PROJECTS
                  </button>
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    TIMELINE
                  </button>
                  <button className="px-4 py-2 rounded text-sm font-medium transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    COMPLETED
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ borderBottomColor: `var(--border)` }} className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>Timeline</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>Responsible</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottomColor: `var(--border)` }} className="border-b">
                        <td className="py-3 px-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                          <span className="mr-2">#</span>Onboarding
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs transition-colors duration-300" style={{ backgroundColor: `var(--card-bg)`, color: `var(--muted-foreground)` }}>
                            Not started
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                          {new Date().toLocaleDateString("es-MX", { month: "long", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300" style={{ backgroundColor: `var(--accent)`, color: `var(--foreground)` }}>
                            A
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("resources")}
              className="w-full flex items-center gap-2 py-3 transition-colors duration-300 hover:opacity-70"
              style={{ color: `var(--foreground)` }}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${sectionsOpen.resources ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-lg font-semibold">Resources</span>
            </button>
            {sectionsOpen.resources && (
              <div className="ml-7 mt-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { 
                      image: "/images/proposals.png", 
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      label: "Proposals" 
                    },
                    { 
                      image: "/images/legal documents.png", 
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      label: "Legal Documents" 
                    },
                    { 
                      image: "/images/payment information.png", 
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      ),
                      label: "Payment Information" 
                    },
                    { 
                      image: "/images/accounts access.png", 
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      ),
                      label: "Accounts Access" 
                    },
                  ].map((resource, index) => (
                    <div
                      key={index}
                      className="rounded-2xl overflow-hidden transition-all duration-300 hover:opacity-90 cursor-pointer"
                      style={{ 
                        backgroundColor: `var(--card-bg)`,
                      }}
                      onClick={() => {
                        if (resource.label === "Proposals") {
                          setOpenResource("proposals");
                        } else if (resource.label === "Legal Documents") {
                          setOpenResource("legal-documents");
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
                        className="p-3 flex items-center gap-3"
                        style={{ backgroundColor: `var(--card-bg)` }}
                      >
                        <div style={{ color: `var(--foreground)` }}>
                          {resource.icon}
                        </div>
                        <span className="text-sm font-medium transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                          {resource.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Upload Area */}
                <div className="mt-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile !== null}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      border: 'none',
                      color: `var(--foreground)`,
                    }}
                  >
                    {uploadingFile ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Subiendo {uploadingFile}...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Agregar archivo o imagen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display uploaded files */}
                {fileBlocks.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {fileBlocks.map((block) => renderFileBlock(block))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Planning Calendar Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("calendar")}
              className="w-full flex items-center gap-2 py-3 transition-colors duration-300 hover:opacity-70"
              style={{ color: `var(--foreground)` }}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${sectionsOpen.calendar ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-lg font-semibold">Planning Calendar</span>
            </button>
            {sectionsOpen.calendar && (
              <div className="ml-7 mt-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: `var(--card-bg)` }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                      {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 rounded text-sm transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                        &lt; Today &gt;
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium py-2 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date();
                      date.setDate(1);
                      date.setDate(date.getDate() - date.getDay());
                      date.setDate(date.getDate() + i);
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={i}
                          className={`text-center text-sm py-2 rounded transition-colors duration-300 ${isToday ? 'font-bold' : ''}`}
                          style={{
                            color: isToday ? `var(--foreground)` : `var(--muted-foreground)`,
                            backgroundColor: isToday ? `var(--accent)` : 'transparent',
                          }}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
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
              {/* Add Web Proposal Button */}
              <div className="mb-6">
                <button
                  onClick={handleOpenWebProposalModal}
                  disabled={!client?.id}
                  className="w-full px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{
                    backgroundColor: "#37352F",
                    color: "#ffffff",
                  }}
                  onMouseEnter={(e) => {
                    if (client?.id) {
                      e.currentTarget.style.backgroundColor = "#2a2823";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (client?.id) {
                      e.currentTarget.style.backgroundColor = "#37352F";
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir Proposal Web
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Proposals
                </h2>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setNewProposalTitle("");
                      proposalFileInputRef.current?.click();
                    }}
                    disabled={uploadingProposal}
                    className="px-4 py-2 rounded text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingProposal) {
                        e.currentTarget.style.backgroundColor = "#2563eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!uploadingProposal) {
                        e.currentTarget.style.backgroundColor = "#3b82f6";
                      }
                    }}
                  >
                    {uploadingProposal ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden file input for proposals */}
              <input
                ref={proposalFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && client?.id) {
                    handleProposalUpload(file);
                  }
                }}
                className="hidden"
              />

              {/* Proposals Table */}
              <div className="border rounded-2xl overflow-hidden" style={{ borderColor: `var(--border)` }}>
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
                  <div className="w-12 px-4 py-3"></div>
                  <div className="w-12 px-4 py-3"></div>
                </div>

                {/* Table Rows */}
                {proposals.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <button
                      onClick={() => {
                        setNewProposalTitle("");
                        proposalFileInputRef.current?.click();
                      }}
                      disabled={uploadingProposal || !client?.id}
                      className="flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: `var(--muted-foreground)` }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New page
                    </button>
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
                            {(proposal as any).pdfExportable && proposal.htmlContent && (
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
                      <div className="w-40 px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                      <div className="w-12 px-4 py-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProposal({
                              id: proposal.id,
                              title: proposal.title,
                              tags: proposal.tags || [],
                              notes: proposal.notes || "",
                            });
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                          style={{ color: `var(--muted-foreground)` }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div className="w-12 px-4 py-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProposal(proposal.id);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                          style={{ color: `var(--muted-foreground)` }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* File Viewer Modal */}
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
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
                      <p className="text-lg font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                        {viewingProposal.attachment.fileName}
                      </p>
                      <p className="text-sm mb-4 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        Este tipo de archivo no se puede visualizar en el navegador
                      </p>
                      <a
                        href={viewingProposal.attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#000000",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e5e5e5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )
              ) : (
                // No attachment available
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                      No hay archivo adjunto
                    </p>
                    <p className="text-sm mb-4 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                      Esta propuesta no tiene un archivo adjunto para visualizar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Proposal Modal */}
      {editingProposal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setEditingProposal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl transition-colors duration-300 flex flex-col max-h-[90vh]"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Editar Propuesta
              </h2>
              <button
                onClick={() => setEditingProposal(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Título
                </label>
                <input
                  type="text"
                  value={editingProposal.title}
                  onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                  style={{
                    backgroundColor: `var(--card-bg)`,
                    border: 'none',
                    color: `var(--foreground)`,
                  }}
                  placeholder="Título de la propuesta"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editingProposal.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm transition-colors duration-300 flex items-center gap-2"
                      style={{
                        backgroundColor: `var(--card-bg)`,
                        color: `var(--foreground)`,
                        border: `1px solid var(--border)`,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromProposal(tag)}
                        className="w-4 h-4 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                        style={{ color: `var(--muted-foreground)` }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToProposal(newTag);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      border: 'none',
                      color: `var(--foreground)`,
                    }}
                    placeholder="Agregar etiqueta (Enter)"
                  />
                  <button
                    onClick={() => addTagToProposal(newTag)}
                    className="px-4 py-3 rounded-xl font-medium transition-all duration-300"
                    style={{
                      backgroundColor: `var(--accent)`,
                      color: `var(--foreground)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Notas
                </label>
                <textarea
                  value={editingProposal.notes}
                  onChange={(e) => setEditingProposal({ ...editingProposal, notes: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] resize-none"
                  style={{
                    backgroundColor: `var(--card-bg)`,
                    border: 'none',
                    color: `var(--foreground)`,
                  }}
                  placeholder="Agregar notas sobre esta propuesta..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <button
                onClick={() => setEditingProposal(null)}
                className="px-6 py-2 rounded-xl font-medium transition-all duration-300"
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
                Cancelar
              </button>
              <button
                onClick={handleUpdateProposal}
                className="px-6 py-2 rounded-full font-medium transition-all duration-300"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#000000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e5e5e5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                Guardar
              </button>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Legal Documents
                </h2>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70" style={{ color: `var(--muted-foreground)` }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setNewLegalDocTitle("");
                      legalDocFileInputRef.current?.click();
                    }}
                    disabled={uploadingLegalDoc}
                    className="px-4 py-2 rounded text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(e) => {
                      if (!uploadingLegalDoc) {
                        e.currentTarget.style.backgroundColor = "#2563eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!uploadingLegalDoc) {
                        e.currentTarget.style.backgroundColor = "#3b82f6";
                      }
                    }}
                  >
                    {uploadingLegalDoc ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden file input for legal documents */}
              <input
                ref={legalDocFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && client?.id) {
                    handleLegalDocUpload(file);
                  }
                }}
                className="hidden"
              />

              {/* Legal Documents Table */}
              <div className="border rounded-2xl overflow-hidden" style={{ borderColor: `var(--border)` }}>
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
                  <div className="w-12 px-4 py-3"></div>
                  <div className="w-12 px-4 py-3"></div>
                </div>

                {/* Table Rows */}
                {legalDocuments.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <button
                      onClick={() => {
                        setNewLegalDocTitle("");
                        legalDocFileInputRef.current?.click();
                      }}
                      disabled={uploadingLegalDoc || !client?.id}
                      className="flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: `var(--muted-foreground)` }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New page
                    </button>
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
                      <div className="w-40 px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                      <div className="w-12 px-4 py-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLegalDoc({
                              id: doc.id,
                              title: doc.title,
                              tags: doc.tags || [],
                              notes: doc.notes || "",
                            });
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                          style={{ color: `var(--muted-foreground)` }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div className="w-12 px-4 py-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLegalDoc(doc.id);
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                          style={{ color: `var(--muted-foreground)` }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Legal Document Viewer Modal */}
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
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
                      <p className="text-lg font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                        {viewingLegalDoc.attachment.fileName}
                      </p>
                      <p className="text-sm mb-4 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                        Este tipo de archivo no se puede visualizar en el navegador
                      </p>
                      <a
                        href={viewingLegalDoc.attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#000000",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e5e5e5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar archivo
                      </a>
                    </div>
                  </div>
                )
              ) : (
                // No attachment available
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                      No hay archivo adjunto
                    </p>
                    <p className="text-sm mb-4 transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                      Este documento legal no tiene un archivo adjunto para visualizar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Legal Document Modal */}
      {editingLegalDoc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setEditingLegalDoc(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl transition-colors duration-300 flex flex-col max-h-[90vh]"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Editar Documento Legal
              </h2>
              <button
                onClick={() => setEditingLegalDoc(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Título
                </label>
                <input
                  type="text"
                  value={editingLegalDoc.title}
                  onChange={(e) => setEditingLegalDoc({ ...editingLegalDoc, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                  style={{
                    backgroundColor: `var(--card-bg)`,
                    border: 'none',
                    color: `var(--foreground)`,
                  }}
                  placeholder="Título del documento legal"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editingLegalDoc.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm transition-colors duration-300 flex items-center gap-2"
                      style={{
                        backgroundColor: `var(--card-bg)`,
                        color: `var(--foreground)`,
                        border: `1px solid var(--border)`,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromLegalDoc(tag)}
                        className="w-4 h-4 rounded flex items-center justify-center transition-colors duration-300 hover:opacity-70"
                        style={{ color: `var(--muted-foreground)` }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLegalDocTag}
                    onChange={(e) => setNewLegalDocTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToLegalDoc(newLegalDocTag);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      border: 'none',
                      color: `var(--foreground)`,
                    }}
                    placeholder="Agregar etiqueta (Enter)"
                  />
                  <button
                    onClick={() => addTagToLegalDoc(newLegalDocTag)}
                    className="px-4 py-3 rounded-xl font-medium transition-all duration-300"
                    style={{
                      backgroundColor: `var(--accent)`,
                      color: `var(--foreground)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Notas
                </label>
                <textarea
                  value={editingLegalDoc.notes}
                  onChange={(e) => setEditingLegalDoc({ ...editingLegalDoc, notes: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] resize-none"
                  style={{
                    backgroundColor: `var(--card-bg)`,
                    border: 'none',
                    color: `var(--foreground)`,
                  }}
                  placeholder="Agregar notas sobre este documento legal..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <button
                onClick={() => setEditingLegalDoc(null)}
                className="px-6 py-2 rounded-xl font-medium transition-all duration-300"
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
                Cancelar
              </button>
              <button
                onClick={handleUpdateLegalDoc}
                className="px-6 py-2 rounded-full font-medium transition-all duration-300"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#000000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e5e5e5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Proposal Modal */}
      {webProposalModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-colors duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => {
            if (!uploadingWebProposal) {
              setWebProposalModalOpen(false);
              setWebProposalTitle("");
              setWebProposalHtml("");
              setWebProposalHtmlFile(null);
              setWebProposalMode("paste");
              setError(null);
            }
          }}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl transition-colors duration-300 flex flex-col"
            style={{
              backgroundColor: `var(--background)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                Crear Propuesta Web
              </h2>
              <button
                onClick={() => {
                  if (!uploadingWebProposal) {
                    setWebProposalModalOpen(false);
                    setWebProposalTitle("");
                    setWebProposalHtml("");
                    setWebProposalHtmlFile(null);
                    setWebProposalMode("paste");
                  }
                }}
                disabled={uploadingWebProposal}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:opacity-70 disabled:opacity-50"
                style={{ color: `var(--foreground)`, backgroundColor: `var(--card-bg)` }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Título de la Propuesta *
                </label>
                <input
                  type="text"
                  value={webProposalTitle}
                  onChange={(e) => setWebProposalTitle(e.target.value)}
                  placeholder="Ej: Propuesta de Desarrollo - Proyecto X"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                  style={{
                    backgroundColor: `var(--card-bg)`,
                    border: 'none',
                    color: `var(--foreground)`,
                  }}
                  disabled={uploadingWebProposal}
                />
              </div>

              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium mb-3 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                  Opción de Entrada
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!uploadingWebProposal) {
                        setWebProposalMode("paste");
                        setWebProposalHtmlFile(null);
                        setError(null);
                      }
                    }}
                    disabled={uploadingWebProposal}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      webProposalMode === "paste" ? "opacity-100" : "opacity-70"
                    }`}
                    style={{
                      backgroundColor: webProposalMode === "paste" ? `var(--accent)` : `var(--card-bg)`,
                      color: `var(--foreground)`,
                      border: `1px solid var(--border)`,
                    }}
                  >
                    Pegar HTML
                  </button>
                  <button
                    onClick={() => {
                      if (!uploadingWebProposal) {
                        setWebProposalMode("upload");
                        setWebProposalHtml("");
                        setError(null);
                      }
                    }}
                    disabled={uploadingWebProposal}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      webProposalMode === "upload" ? "opacity-100" : "opacity-70"
                    }`}
                    style={{
                      backgroundColor: webProposalMode === "upload" ? `var(--accent)` : `var(--card-bg)`,
                      color: `var(--foreground)`,
                      border: `1px solid var(--border)`,
                    }}
                  >
                    Subir Archivo HTML
                  </button>
                </div>
              </div>

              {/* PDF Exportable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: `var(--card-bg)`, border: `1px solid var(--border)` }}>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    PDF Exportable
                  </label>
                  <p className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                    Permite exportar esta propuesta como PDF (tanto admin como cliente)
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!uploadingWebProposal) {
                      setWebProposalPdfExportable(!webProposalPdfExportable);
                    }
                  }}
                  disabled={uploadingWebProposal}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed ${
                    webProposalPdfExportable ? "opacity-100" : "opacity-70"
                  }`}
                  style={{
                    backgroundColor: webProposalPdfExportable ? `var(--accent)` : `var(--border)`,
                  }}
                  role="switch"
                  aria-checked={webProposalPdfExportable}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      webProposalPdfExportable ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Paste HTML Mode */}
              {webProposalMode === "paste" && (
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    HTML Content *
                  </label>
                  <textarea
                    value={webProposalHtml}
                    onChange={(e) => setWebProposalHtml(e.target.value)}
                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>Propuesta</title>&#10;  </head>&#10;  <body>&#10;    ...&#10;  </body>&#10;</html>"
                    rows={20}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] resize-none font-mono text-sm"
                    style={{
                      backgroundColor: `var(--card-bg)`,
                      border: 'none',
                      color: `var(--foreground)`,
                      fontFamily: 'monospace',
                    }}
                    disabled={uploadingWebProposal}
                  />
                  <p className="mt-2 text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                    Pega aquí el código HTML completo de tu propuesta
                  </p>
                </div>
              )}

              {/* Upload HTML Mode */}
              {webProposalMode === "upload" && (
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                    Archivo HTML *
                  </label>
                  <div
                    className="border-2 border-dashed rounded-2xl p-8 text-center transition-colors duration-300"
                    style={{ borderColor: `var(--border)`, backgroundColor: `var(--card-bg)` }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = `var(--accent)`;
                      e.currentTarget.style.opacity = "0.8";
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = `var(--border)`;
                      e.currentTarget.style.opacity = "1";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.style.borderColor = `var(--border)`;
                      e.currentTarget.style.opacity = "1";
                      
                      if (uploadingWebProposal) return;
                      
                      const file = e.dataTransfer.files[0];
                      if (file && file.name.endsWith('.html')) {
                        setWebProposalHtmlFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setWebProposalHtml(content);
                        };
                        reader.readAsText(file);
                      } else if (file) {
                        setError("Por favor, sube un archivo .html");
                      }
                    }}
                  >
                    <input
                      ref={webProposalHtmlInputRef}
                      type="file"
                      accept=".html"
                      onChange={handleWebProposalFileChange}
                      className="hidden"
                      disabled={uploadingWebProposal}
                    />
                    {webProposalHtmlFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--accent)` }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-left">
                            <p className="font-medium transition-colors duration-300" style={{ color: `var(--foreground)` }}>
                              {webProposalHtmlFile.name}
                            </p>
                            <p className="text-sm transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                              {(webProposalHtmlFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!uploadingWebProposal) {
                              setWebProposalHtmlFile(null);
                              setWebProposalHtml("");
                              webProposalHtmlInputRef.current?.click();
                            }
                          }}
                          disabled={uploadingWebProposal}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: `var(--accent)`,
                            color: `var(--foreground)`,
                          }}
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `var(--muted-foreground)` }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium transition-colors duration-300 mb-1" style={{ color: `var(--foreground)` }}>
                            Arrastra un archivo HTML aquí o haz clic para seleccionar
                          </p>
                          <p className="text-xs transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
                            Solo archivos .html
                          </p>
                        </div>
                        <button
                          onClick={() => webProposalHtmlInputRef.current?.click()}
                          disabled={uploadingWebProposal}
                          className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: `var(--accent)`,
                            color: `var(--foreground)`,
                          }}
                        >
                          Seleccionar archivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                  <p className="text-sm" style={{ color: "#ef4444" }}>
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0" style={{ borderColor: `var(--border)` }}>
              <button
                onClick={() => {
                  if (!uploadingWebProposal) {
                    setWebProposalModalOpen(false);
                    setWebProposalTitle("");
                    setWebProposalHtml("");
                    setWebProposalHtmlFile(null);
                    setWebProposalMode("paste");
                  }
                }}
                disabled={uploadingWebProposal}
                className="px-6 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `var(--card-bg)`,
                  color: `var(--foreground)`,
                  border: `1px solid var(--border)`,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWebProposal}
                disabled={uploadingWebProposal || !webProposalTitle.trim() || (!webProposalHtml.trim() && !webProposalHtmlFile)}
                className="px-6 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  backgroundColor: "#37352F",
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#2a2823";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#37352F";
                  }
                }}
              >
                {uploadingWebProposal ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </>
                ) : (
                  "Crear Propuesta"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClients } from "@/hooks/useClients";
import { Database } from "@/types/supabase";
import { exportHtmlToPdf } from "@/lib/htmlToPdf";
import { PdfExportLoading } from "@/components/ui/pdf-export-loading";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export default function WebProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { getClient } = useClients();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [proposalTitle, setProposalTitle] = useState<string>("");
  const [pdfExportable, setPdfExportable] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfExportMessage, setPdfExportMessage] = useState("");

  const clientId = params.clientId as string;
  const proposalId = params.proposalId as string;

  useEffect(() => {
    const loadProposal = async () => {
      if (!clientId || !proposalId) {
        setError("Client ID o Proposal ID no válidos");
        setLoading(false);
        return;
      }

      try {
        const result = await getClient(clientId);
        if (result.error || !result.data) {
          setError("Error al cargar el cliente");
          setLoading(false);
          return;
        }

        const client = result.data;
        const files = (client.files as Array<any>) || [];
        const proposal = files.find(
          (f) => f.category === "proposals" && f.id === proposalId && f.isWebProposal
        );

        if (!proposal || !proposal.htmlContent) {
          setError("Propuesta web no encontrada");
          setLoading(false);
          return;
        }

        setHtmlContent(proposal.htmlContent);
        setProposalTitle(proposal.title || "Propuesta");
        setPdfExportable(proposal.pdfExportable === true || proposal.pdfExportable === "true" || false);
      } catch (err: any) {
        setError(err.message || "Error al cargar la propuesta");
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, proposalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen transition-colors duration-300" style={{ backgroundColor: `var(--background)` }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: `var(--foreground)` }}></div>
          <p className="text-lg transition-colors duration-300" style={{ color: `var(--muted-foreground)` }}>
            Cargando propuesta...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen transition-colors duration-300" style={{ backgroundColor: `var(--background)` }}>
        <div className="text-center">
          <p className="text-lg mb-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
            {error}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
            style={{
              backgroundColor: `var(--accent)`,
              color: `var(--foreground)`,
            }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="flex items-center justify-center min-h-screen transition-colors duration-300" style={{ backgroundColor: `var(--background)` }}>
        <div className="text-center">
          <p className="text-lg mb-4 transition-colors duration-300" style={{ color: `var(--foreground)` }}>
            No se encontró contenido HTML
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
            style={{
              backgroundColor: `var(--accent)`,
              color: `var(--foreground)`,
            }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PdfExportLoading isOpen={exportingPdf} message={pdfExportMessage} />
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: `var(--background)` }}>
        {/* Close Button and Export PDF Button */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {pdfExportable && htmlContent && (
          <button
            onClick={async () => {
              setExportingPdf(true);
              setPdfExportMessage("Preparando contenido...");
              try {
                await exportHtmlToPdf(
                  htmlContent, 
                  proposalTitle,
                  (message) => setPdfExportMessage(message)
                );
              } catch (error: any) {
                alert(error.message || 'Error al exportar el PDF');
              } finally {
                setExportingPdf(false);
                setPdfExportMessage("");
              }
            }}
            className="px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 hover:opacity-80 shadow-lg"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "#ffffff",
            }}
            title="Exportar como PDF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-sm font-medium">PDF</span>
          </button>
        )}
        <button
          onClick={() => router.back()}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:opacity-70 shadow-lg"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#ffffff",
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Render HTML Content */}
      <iframe
        srcDoc={htmlContent}
        className="w-full h-screen border-none"
        title="Web Proposal"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      </div>
    </>
  );
}


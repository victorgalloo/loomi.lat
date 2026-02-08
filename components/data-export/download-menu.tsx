import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AssistantResponse } from "@/lib/responses";
import { Button } from "@/components/ui/button";
import { Download, FileText, LayoutDashboard } from "lucide-react";
import { generatePDF } from "@/lib/pdfGenerator";
import { generateDashboardHTML } from "@/lib/dashboardGenerator";

const formatters = {
  csv: (table: AssistantResponse["table"]) => {
    const headers = table.columns.map((column) => column.label);
    const rows = table.rows.map((row) =>
      table.columns
        .map((column) => {
          const raw = row[column.accessor];
          if (typeof raw === "number") return raw.toString();
          if (typeof raw === "string") {
            const escaped = raw.replace(/"/g, '""');
            return `"${escaped}"`;
          }
          return "";
        })
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  },
  json: (table: AssistantResponse["table"]) => JSON.stringify(table.rows, null, 2),
  raw: (table: AssistantResponse["table"]) =>
    table.rows
      .map((row) =>
        table.columns
          .map((column) => `${column.label}: ${row[column.accessor]}`)
          .join(" | ")
      )
      .join("\n")
};

const triggerDownload = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type DownloadMenuProps = {
  table: AssistantResponse["table"];
  heading?: string;
  summary?: string;
};

export const DownloadMenu = ({ table, heading, summary }: DownloadMenuProps) => {
  const filenameBase = useMemo(() => {
    const normalized = table.caption
      ? table.caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "know-your-business-table";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${normalized || "insight"}-${timestamp}`;
  }, [table.caption]);

  const handleDownload = (type: "csv" | "json" | "raw") => {
    const formatted = formatters[type](table);
    const mime =
      type === "csv"
        ? "text/csv"
        : type === "json"
        ? "application/json"
        : "text/plain";
    triggerDownload(formatted, `${filenameBase}.${type === "raw" ? "txt" : type}`, mime);
  };

  const handlePDFDownload = async () => {
    try {
      const response: AssistantResponse = {
        heading: heading || table.caption || "Reporte de Datos",
        summary: summary || "Generado desde Syntra",
        table: table
      };
      await generatePDF(response);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Por favor, intenta nuevamente.");
    }
  };

  const handleDashboardDownload = async () => {
    try {
      // Load logo as base64 before generating dashboard
      let logoBase64: string | null = null;
      try {
        const logoPath = "/images/Syntra hor no bg lightmode.png";
        const response = await fetch(logoPath);
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Failed to convert logo to base64"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.warn("Could not load logo for dashboard:", error);
      }

      const response: AssistantResponse = {
        heading: heading || table.caption || "Dashboard de Datos",
        summary: summary || "Generado desde Syntra",
        table: table
      };
      const html = await generateDashboardHTML(response, logoBase64);
      const normalized = table.caption
        ? table.caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : "dashboard";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const dashboardFilename = `${normalized || "dashboard"}-${timestamp}.html`;
      
      // Create blob and open in new tab
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, "_blank");
      
      // Also trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = dashboardFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after a delay to allow both actions
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      alert("Error al generar el dashboard. Por favor, intenta nuevamente.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-muted shadow-subtle hover:bg-surface-2 md:px-4"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleDashboardDownload} className="font-semibold">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Descargar Dashboard HTML
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handlePDFDownload} className="font-semibold">
          <FileText className="mr-2 h-4 w-4" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleDownload("csv")}>
          Descargar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleDownload("json")}>
          Descargar JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleDownload("raw")}>
          Descargar Raw (TXT)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


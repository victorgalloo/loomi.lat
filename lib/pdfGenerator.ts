import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AssistantResponse } from "@/lib/responses";

// Color palette for Syntra brand
const COLORS = {
  primary: "#FF9F32", // Orange
  secondary: "#37352F", // Dark gray
  background: "#FFFFFF",
  text: "#37352F",
  textLight: "#6B6B6B",
  border: "#E9E9E7"
};

// Load image as base64 for PDF
const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    // Try PNG first, then SVG
    const paths = [
      imagePath,
      imagePath.replace('.svg', '.png'),
      imagePath.replace('.png', '.svg'),
      '/images/Syntra hor no bg lightmode.png',
      '/assets/icons/Syntra hor no bg lightmode.svg'
    ];

    for (const path of paths) {
      try {
        const fullPath = path.startsWith('http') ? path : `${window.location.origin}${path}`;
        const response = await fetch(fullPath);
        
        if (!response.ok) continue;
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to convert image to base64"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        continue;
      }
    }
    
    throw new Error("Could not load logo from any path");
  } catch (error) {
    console.error("Error loading image:", error);
    throw error;
  }
};

export const generatePDF = async (
  response: AssistantResponse,
  logoUrl?: string
): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // Header with logo - Membretado
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Load and add Syntra logo
  try {
    const logoPath = logoUrl || "/images/Syntra hor no bg lightmode.png";
    const logoBase64 = await loadImageAsBase64(logoPath);
    
    // Add logo image (resize to fit nicely)
    const logoWidth = 45;
    const logoHeight = 12;
    doc.addImage(logoBase64, "PNG", margin, 12, logoWidth, logoHeight);
  } catch (error) {
    console.warn("Could not load logo image, using text fallback:", error);
    // Fallback to text logo if image fails to load
    doc.setFillColor(255, 159, 50);
    doc.roundedRect(margin, 10, 35, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SYNTRA", margin + 3, 20);
  }


  // Date
  doc.setTextColor(COLORS.textLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  doc.text(date, pageWidth - margin, 22, { align: "right" });

  // Line separator
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, 28, pageWidth - margin, 28);

  yPosition = 38;

  // Title
  doc.setTextColor(COLORS.text);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(response.heading, contentWidth);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 7 + 5;

  // Summary
  doc.setTextColor(COLORS.textLight);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(response.summary, contentWidth);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 10;

  // Table
  const tableData = response.table.rows.map((row) =>
    response.table.columns.map((col) => {
      const value = row[col.accessor];
      if (typeof value === "number") {
        // Format numbers with locale
        if (col.label.toLowerCase().includes("venta") || 
            col.label.toLowerCase().includes("costo") ||
            col.label.toLowerCase().includes("ingreso") ||
            col.label.toLowerCase().includes("presupuesto") ||
            col.label.toLowerCase().includes("salario")) {
          return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN"
          }).format(value);
        }
        return new Intl.NumberFormat("es-MX").format(value);
      }
      return String(value || "");
    })
  );

  const tableHeaders = response.table.columns.map((col) => col.label);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPosition,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: COLORS.text,
      cellPadding: { top: 5, right: 5, bottom: 5, left: 5 }
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    },
    margin: { left: margin, right: margin },
    theme: "striped",
    didDrawPage: function (data) {
      // Footer on each page
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textLight);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Página ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  yPosition = finalY + 15;

  // Add chart if we have numeric data suitable for charts
  const numericColumns = response.table.columns.filter((col) => {
    const sampleRow = response.table.rows[0];
    if (!sampleRow) return false;
    const value = sampleRow[col.accessor];
    return typeof value === "number";
  });

  if (numericColumns.length > 0 && response.table.rows.length > 0 && yPosition < pageHeight - 80) {
    // Determine chart type based on data
    const firstNumericCol = numericColumns[0];
    const isSalesData = firstNumericCol.label.toLowerCase().includes("venta") || 
                        firstNumericCol.label.toLowerCase().includes("ingreso") ||
                        firstNumericCol.label.toLowerCase().includes("revenue");
    
    // Chart container
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, yPosition, contentWidth, 55, 4, 4, "F");

    // Chart title
    doc.setTextColor(COLORS.text);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    const chartTitle = isSalesData ? "Análisis de Ventas" : "Visualización de Datos";
    doc.text(chartTitle, margin + 8, yPosition + 10);

    // Prepare chart data (top 5-8 items)
    const maxItems = Math.min(8, response.table.rows.length);
    const chartData = response.table.rows.slice(0, maxItems).map((row) => {
      const value = row[firstNumericCol.accessor] as number;
      const labelCol = response.table.columns.find(col => 
        col.accessor !== firstNumericCol.accessor && 
        (col.label.toLowerCase().includes("nombre") || 
         col.label.toLowerCase().includes("name") ||
         col.label.toLowerCase().includes("punto") ||
         col.label.toLowerCase().includes("producto") ||
         col.label.toLowerCase().includes("estado") ||
         col.label.toLowerCase().includes("departamento"))
      ) || response.table.columns[0];
      
      return {
        label: String(row[labelCol.accessor] || "").substring(0, 15),
        value,
        originalValue: value
      };
    });

    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));

    // Chart area
    const chartX = margin + 8;
    const chartY = yPosition + 16;
    const chartWidth = contentWidth - 16;
    const chartHeight = 32;
    const barSpacing = 2;
    const availableWidth = chartWidth - (chartData.length - 1) * barSpacing;
    const barWidth = Math.min(availableWidth / chartData.length, 12);

    // Y-axis labels
    doc.setTextColor(COLORS.textLight);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const maxLabel = new Intl.NumberFormat("es-MX", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(maxValue);
    doc.text(maxLabel, chartX - 3, chartY + 4, { align: "right" });
    doc.text("0", chartX - 3, chartY + chartHeight - 1, { align: "right" });

    // Grid lines
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    for (let i = 1; i <= 4; i++) {
      const y = chartY + (chartHeight / 4) * i;
      doc.line(chartX, y, chartX + chartWidth, y);
    }

    // Draw bars with gradient effect
    chartData.forEach((item, idx) => {
      const barX = chartX + idx * (barWidth + barSpacing);
      const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
      const barY = chartY + chartHeight - barHeight;

      if (barHeight > 0.5) {
        // Bar with solid color (gradient not supported in jsPDF without extensions)
        doc.setFillColor(255, 159, 50);
        doc.roundedRect(
          barX, 
          barY, 
          barWidth, 
          barHeight, 
          1, 
          1, 
          "F"
        );

        // Value label on top of bar
        if (barHeight > 6) {
          doc.setTextColor(COLORS.text);
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          const valueText = new Intl.NumberFormat("es-MX", {
            notation: "compact",
            maximumFractionDigits: 1
          }).format(item.originalValue);
          const textWidth = doc.getTextWidth(valueText);
          
          // White background for label
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(
            barX + barWidth / 2 - textWidth / 2 - 1,
            barY - 6,
            textWidth + 2,
            4,
            1,
            1,
            "F"
          );
          
          doc.text(valueText, barX + barWidth / 2, barY - 4);
        }

        // X-axis label
        if (item.label) {
          doc.setTextColor(COLORS.textLight);
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          doc.text(
            item.label,
            barX + barWidth / 2,
            chartY + chartHeight + 4,
            { align: "center", maxWidth: barWidth + 2 }
          );
        }
      }
    });
  }

  // Footer
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setTextColor(COLORS.textLight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Generado por Syntra - Plataforma de Inteligencia de Negocios",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // Generate filename
  const filename = `${response.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;

  // Save PDF
  doc.save(filename);
};


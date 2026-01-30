import { AssistantResponse } from "@/lib/responses";

// Load logo image as base64 for embedding in HTML
const loadLogoAsBase64 = async (): Promise<string | null> => {
  try {
    if (typeof window === "undefined") return null;
    
    const logoPath = "/images/Syntra hor no bg lightmode.png";
    const response = await fetch(logoPath);
    
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
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
  } catch (error) {
    console.error("Error loading logo:", error);
    return null;
  }
};

// Generate interactive HTML dashboard
export const generateDashboardHTML = async (
  response: AssistantResponse,
  logoBase64?: string | null
): Promise<string> => {
  const { heading, summary, table } = response;

  // Determine chart types based on data
  const numericColumns = table.columns.filter((col) => {
    const sampleRow = table.rows[0];
    if (!sampleRow) return false;
    const value = sampleRow[col.accessor];
    return typeof value === "number";
  });

  const categoryColumn = table.columns.find(
    (col) =>
      !numericColumns.includes(col) &&
      (col.label.toLowerCase().includes("nombre") ||
        col.label.toLowerCase().includes("name") ||
        col.label.toLowerCase().includes("punto") ||
        col.label.toLowerCase().includes("producto") ||
        col.label.toLowerCase().includes("estado") ||
        col.label.toLowerCase().includes("departamento") ||
        col.label.toLowerCase().includes("ciudad") ||
        col.label.toLowerCase().includes("categoria"))
  ) || table.columns[0];

  // Prepare data for charts
  const top10Data = table.rows.slice(0, 10);
  const labels = top10Data.map((row) => {
    const label = String(row[categoryColumn.accessor] || "");
    return label.length > 30 ? label.substring(0, 30) + "..." : label;
  });

  // Use provided logo or try to load it
  let logo: string | null = logoBase64 || null;
  if (!logo && typeof window !== "undefined") {
    try {
      logo = await loadLogoAsBase64();
    } catch (error) {
      console.warn("Could not load logo for dashboard:", error);
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading} - Syntra Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #FF9F32;
      --primary-light: #FFB84D;
      --primary-dark: #E88A1F;
      --text-primary: #1a1a1a;
      --text-secondary: #6b7280;
      --bg-gradient: linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 25%, #e3f2fd 50%, #f1f5f9 75%, #e8eaf6 100%);
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: var(--bg-gradient);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      color: var(--text-primary);
      padding: 24px;
      line-height: 1.6;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Liquid Glass Header */
    .header {
      background: linear-gradient(135deg, rgba(255, 159, 50, 0.95) 0%, rgba(255, 180, 77, 0.95) 100%);
      backdrop-filter: blur(60px) saturate(200%);
      -webkit-backdrop-filter: blur(60px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 32px;
      padding: 40px;
      margin-bottom: 32px;
      box-shadow: 
        0 20px 60px rgba(255, 159, 50, 0.25),
        0 8px 24px rgba(0, 0, 0, 0.08),
        inset 0 2px 4px rgba(255, 255, 255, 0.4),
        inset 0 -2px 4px rgba(255, 255, 255, 0.2);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 2px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.3) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.6;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 12px 24px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .logo-image {
      height: 36px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }

    .logo-box {
      font-weight: 800;
      font-size: 28px;
      letter-spacing: 2px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .logo-tagline {
      font-size: 12px;
      opacity: 0.95;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .header-info {
      text-align: right;
    }

    .date {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    h1 {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 16px;
      letter-spacing: -1px;
      line-height: 1.2;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .summary {
      font-size: 17px;
      opacity: 0.98;
      line-height: 1.7;
      margin-top: 20px;
      font-weight: 400;
      position: relative;
      z-index: 1;
      max-width: 90%;
    }

    /* Liquid Glass Stats Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 251, 255, 0.85) 100%);
      backdrop-filter: blur(60px) saturate(200%);
      -webkit-backdrop-filter: blur(60px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.03),
        inset 0 2px 2px rgba(255, 255, 255, 0.95),
        inset 0 -2px 2px rgba(255, 255, 255, 0.6),
        0 0 40px rgba(255, 159, 50, 0.05);
      text-align: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 159, 50, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .stat-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.12),
        0 8px 20px rgba(0, 0, 0, 0.06),
        inset 0 2px 4px rgba(255, 255, 255, 1),
        0 0 60px rgba(255, 159, 50, 0.15);
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-value {
      font-size: 42px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      letter-spacing: -1px;
      position: relative;
      z-index: 1;
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      position: relative;
      z-index: 1;
    }

    /* Liquid Glass Chart Cards */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .chart-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 251, 255, 0.85) 100%);
      backdrop-filter: blur(60px) saturate(200%);
      -webkit-backdrop-filter: blur(60px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 28px;
      padding: 32px;
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.03),
        inset 0 2px 2px rgba(255, 255, 255, 0.95),
        inset 0 -2px 2px rgba(255, 255, 255, 0.6),
        0 0 40px rgba(255, 159, 50, 0.05);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .chart-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.3) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.5;
    }

    .chart-card:hover {
      transform: translateY(-6px);
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.12),
        0 8px 24px rgba(0, 0, 0, 0.06),
        inset 0 2px 4px rgba(255, 255, 255, 1),
        0 0 60px rgba(255, 159, 50, 0.15);
    }

    .chart-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.3px;
      position: relative;
      z-index: 1;
    }

    .chart-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(255, 159, 50, 0.3);
      flex-shrink: 0;
    }

    .chart-icon svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2.5;
    }

    .chart-container {
      position: relative;
      height: 380px;
      margin-top: 10px;
      z-index: 1;
    }

    /* Liquid Glass Table Section */
    .table-section {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 251, 255, 0.85) 100%);
      backdrop-filter: blur(60px) saturate(200%);
      -webkit-backdrop-filter: blur(60px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 28px;
      padding: 32px;
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.03),
        inset 0 2px 2px rgba(255, 255, 255, 0.95),
        inset 0 -2px 2px rgba(255, 255, 255, 0.6),
        0 0 40px rgba(255, 159, 50, 0.05);
      margin-bottom: 32px;
      overflow-x: auto;
      position: relative;
    }

    .table-section::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.3) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0.5;
    }

    .table-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 24px;
      color: var(--text-primary);
      letter-spacing: -0.3px;
      position: relative;
      z-index: 1;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
      position: relative;
      z-index: 1;
    }

    thead {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    thead tr:first-child th:first-child {
      border-top-left-radius: 12px;
    }

    thead tr:first-child th:last-child {
      border-top-right-radius: 12px;
    }

    th {
      padding: 16px 20px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    tbody tr {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    tbody tr:hover {
      background: rgba(255, 159, 50, 0.05);
      transform: scale(1.01);
    }

    td {
      padding: 16px 20px;
      color: var(--text-primary);
      font-weight: 500;
    }

    tbody tr:nth-child(even) {
      background: rgba(0, 0, 0, 0.02);
    }

    tbody tr:last-child td:first-child {
      border-bottom-left-radius: 12px;
    }

    tbody tr:last-child td:last-child {
      border-bottom-right-radius: 12px;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 28px;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(250, 251, 255, 0.5) 100%);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }

    /* Responsive */
    @media (max-width: 768px) {
      body {
        padding: 16px;
      }
      
      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }
      
      h1 {
        font-size: 28px;
      }
      
      .header {
        padding: 28px;
        border-radius: 24px;
      }
      
      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .stat-value {
        font-size: 32px;
      }

      .chart-card, .table-section {
        padding: 24px;
        border-radius: 20px;
      }

      .chart-container {
        height: 300px;
      }
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      border-radius: 10px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      background-clip: padding-box;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="logo-section">
          ${logo 
            ? `<div class="logo-container">
                <img src="${logo}" alt="Syntra Logo" class="logo-image" />
                <div class="logo-tagline">Inteligencia de Negocios</div>
              </div>`
            : `<div class="logo-container">
                <div class="logo-box">SYNTRA</div>
                <div class="logo-tagline">Inteligencia de Negocios</div>
              </div>`
          }
        </div>
        <div class="header-info">
          <div class="date">${new Date().toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}</div>
        </div>
      </div>
      <h1>${heading}</h1>
      <div class="summary">${summary}</div>
    </div>

    <!-- Stats Cards -->
    ${generateStatsCards(table)}

    <!-- Charts Grid -->
    <div class="dashboard-grid">
      ${generateBarChart(numericColumns[0], categoryColumn, top10Data, labels)}
      ${numericColumns.length > 1 ? generateLineChart(numericColumns[1], categoryColumn, top10Data, labels) : ""}
      ${generatePieChart(numericColumns[0], categoryColumn, top10Data.slice(0, 6))}
      ${numericColumns.length > 1 ? generateComparisonChart(numericColumns[0], numericColumns[1], categoryColumn, top10Data, labels) : ""}
    </div>

    <!-- Data Table -->
    <div class="table-section">
      <div class="table-title">
        <span style="display: inline-flex; align-items: center; gap: 10px;">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2.5;">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="7" y1="4" x2="7" y2="22"/>
            <line x1="12" y1="4" x2="12" y2="22"/>
            <line x1="17" y1="4" x2="17" y2="22"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="14" x2="21" y2="14"/>
          </svg>
          Datos Completos
        </span>
      </div>
      ${generateTable(table)}
    </div>

    <!-- Footer -->
    <div class="footer">
      Generado por Syntra - Plataforma de Inteligencia de Negocios
    </div>
  </div>

  <script>
    // Initialize charts
    ${generateChartScripts(numericColumns, categoryColumn, top10Data, labels)}
  </script>
</body>
</html>
  `;

  return html;
};

// Generate stats cards
const generateStatsCards = (table: AssistantResponse["table"]): string => {
  const numericColumns = table.columns.filter((col) => {
    const sampleRow = table.rows[0];
    if (!sampleRow) return false;
    return typeof sampleRow[col.accessor] === "number";
  });

  if (numericColumns.length === 0) return "";

  const totalRows = table.rows.length;
  const firstNumericCol = numericColumns[0];
  const total = table.rows.reduce((sum, row) => {
    return sum + (Number(row[firstNumericCol.accessor]) || 0);
  }, 0);

  const avg = total / totalRows;
  const max = Math.max(...table.rows.map((row) => Number(row[firstNumericCol.accessor]) || 0));

  const formatValue = (value: number): string => {
    if (firstNumericCol.label.toLowerCase().includes("venta") ||
        firstNumericCol.label.toLowerCase().includes("costo") ||
        firstNumericCol.label.toLowerCase().includes("ingreso") ||
        firstNumericCol.label.toLowerCase().includes("presupuesto") ||
        firstNumericCol.label.toLowerCase().includes("salario")) {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        notation: "compact"
      }).format(value);
    }
    return new Intl.NumberFormat("es-MX", {
      notation: "compact"
    }).format(value);
  };

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${totalRows}</div>
        <div class="stat-label">Total de Registros</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatValue(total)}</div>
        <div class="stat-label">Total ${firstNumericCol.label}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatValue(avg)}</div>
        <div class="stat-label">Promedio ${firstNumericCol.label}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatValue(max)}</div>
        <div class="stat-label">Máximo ${firstNumericCol.label}</div>
      </div>
    </div>
  `;
};

// Generate bar chart
const generateBarChart = (
  numericCol: { accessor: string; label: string },
  categoryCol: { accessor: string; label: string },
  data: any[],
  labels: string[]
): string => {
  const values = data.map((row) => Number(row[numericCol.accessor]) || 0);

  return `
    <div class="chart-card">
      <div class="chart-title">
        <span class="chart-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="18" width="4" height="4" rx="1"/>
            <rect x="8" y="14" width="4" height="8" rx="1"/>
            <rect x="13" y="10" width="4" height="12" rx="1"/>
            <rect x="18" y="6" width="4" height="16" rx="1"/>
          </svg>
        </span>
        ${numericCol.label} por ${categoryCol.label}
      </div>
      <div class="chart-container">
        <canvas id="barChart"></canvas>
      </div>
    </div>
  `;
};

// Generate line chart
const generateLineChart = (
  numericCol: { accessor: string; label: string },
  categoryCol: { accessor: string; label: string },
  data: any[],
  labels: string[]
): string => {
  return `
    <div class="chart-card">
      <div class="chart-title">
        <span class="chart-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polyline points="3 17 9 11 13 15 21 7" fill="none"/>
            <polyline points="21 7 21 3 17 3" fill="none"/>
          </svg>
        </span>
        Tendencia: ${numericCol.label}
      </div>
      <div class="chart-container">
        <canvas id="lineChart"></canvas>
      </div>
    </div>
  `;
};

// Generate pie chart
const generatePieChart = (
  numericCol: { accessor: string; label: string },
  categoryCol: { accessor: string; label: string },
  data: any[]
): string => {
  return `
    <div class="chart-card">
      <div class="chart-title">
        <span class="chart-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none"/>
            <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="none"/>
            <path d="M12 2 A10 10 0 0 0 2 12 L12 12 Z" fill="none"/>
          </svg>
        </span>
        Distribución: Top 6
      </div>
      <div class="chart-container">
        <canvas id="pieChart"></canvas>
      </div>
    </div>
  `;
};

// Generate comparison chart
const generateComparisonChart = (
  numericCol1: { accessor: string; label: string },
  numericCol2: { accessor: string; label: string },
  categoryCol: { accessor: string; label: string },
  data: any[],
  labels: string[]
): string => {
  return `
    <div class="chart-card">
      <div class="chart-title">
        <span class="chart-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="12" width="4" height="8" rx="1"/>
            <rect x="8" y="8" width="4" height="12" rx="1"/>
            <rect x="13" y="4" width="4" height="16" rx="1"/>
            <rect x="18" y="10" width="4" height="10" rx="1"/>
          </svg>
        </span>
        Comparativa: ${numericCol1.label} vs ${numericCol2.label}
      </div>
      <div class="chart-container">
        <canvas id="comparisonChart"></canvas>
      </div>
    </div>
  `;
};

// Generate table HTML
const generateTable = (table: AssistantResponse["table"]): string => {
  const headers = table.columns.map((col) => `<th>${col.label}</th>`).join("");

  const rows = table.rows.map((row) => {
    const cells = table.columns.map((col) => {
      let value = row[col.accessor];
      if (typeof value === "number") {
        // Format numbers
        if (
          col.label.toLowerCase().includes("venta") ||
          col.label.toLowerCase().includes("costo") ||
          col.label.toLowerCase().includes("ingreso") ||
          col.label.toLowerCase().includes("presupuesto") ||
          col.label.toLowerCase().includes("salario")
        ) {
          value = new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN"
          }).format(value);
        } else if (col.label.toLowerCase().includes("%") || col.label.toLowerCase().includes("porcentaje")) {
          value = new Intl.NumberFormat("es-MX", {
            style: "percent",
            minimumFractionDigits: 1
          }).format(value / 100);
        } else {
          value = new Intl.NumberFormat("es-MX").format(value);
        }
      }
      return `<td>${String(value || "")}</td>`;
    });
    return `<tr>${cells.join("")}</tr>`;
  });

  return `
    <table>
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody>
        ${rows.join("")}
      </tbody>
    </table>
  `;
};

// Generate Chart.js scripts
const generateChartScripts = (
  numericColumns: Array<{ accessor: string; label: string }>,
  categoryColumn: { accessor: string; label: string },
  data: any[],
  labels: string[]
): string => {
  if (numericColumns.length === 0) return "";

  const firstNumericCol = numericColumns[0];
  const secondNumericCol = numericColumns[1];

  const values1 = data.map((row) => Number(row[firstNumericCol.accessor]) || 0);
  const values2 = secondNumericCol
    ? data.map((row) => Number(row[secondNumericCol.accessor]) || 0)
    : null;

  // Bar Chart with beautiful gradient
  let scripts = `
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    Chart.defaults.color = '#37352F';
    Chart.defaults.plugins.legend.labels.font = { weight: '600', size: 13 };
    
    // Bar Chart
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
      const gradient = barCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(255, 159, 50, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 180, 77, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 200, 100, 0.7)');
      
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: [{
            label: '${firstNumericCol.label}',
            data: ${JSON.stringify(values1)},
            backgroundColor: gradient,
            borderColor: 'rgba(255, 159, 50, 1)',
            borderWidth: 2,
            borderRadius: 12,
            borderSkipped: false,
            barThickness: 'flex',
            maxBarThickness: 60,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              padding: 16,
              titleFont: { size: 15, weight: '700', family: "'Inter', sans-serif" },
              bodyFont: { size: 14, weight: '500', family: "'Inter', sans-serif" },
              cornerRadius: 12,
              displayColors: false,
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 159, 50, 0.3)',
              borderWidth: 1,
              boxPadding: 6,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.06)',
                lineWidth: 1,
                drawBorder: false,
              },
              ticks: {
                color: '#6b7280',
                font: { size: 12, weight: '500' },
                padding: 10,
                callback: function(value) {
                  return new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(value);
                }
              }
            },
            x: {
              grid: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                color: '#6b7280',
                font: { size: 12, weight: '500' },
                maxRotation: 45,
                minRotation: 0,
                padding: 12,
              }
            }
          }
        }
      });
    }
  `;

  // Line Chart (if second numeric column exists)
  if (secondNumericCol && values2) {
    scripts += `
      // Line Chart
      const lineCtx = document.getElementById('lineChart');
      if (lineCtx) {
        const lineGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        lineGradient.addColorStop(0, 'rgba(255, 159, 50, 0.3)');
        lineGradient.addColorStop(0.5, 'rgba(255, 180, 77, 0.15)');
        lineGradient.addColorStop(1, 'rgba(255, 200, 100, 0.05)');
        
        new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
              label: '${secondNumericCol.label}',
              data: ${JSON.stringify(values2)},
              borderColor: 'rgba(255, 159, 50, 1)',
              backgroundColor: lineGradient,
              borderWidth: 3,
              fill: true,
              tension: 0.5,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: '#FF9F32',
              pointBorderColor: '#fff',
              pointBorderWidth: 3,
              pointHoverBackgroundColor: '#FFB84D',
              pointHoverBorderColor: '#fff',
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1500,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  font: { size: 13, weight: '600' },
                  color: '#37352F'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(26, 26, 26, 0.95)',
                padding: 16,
                titleFont: { size: 15, weight: '700', family: "'Inter', sans-serif" },
                bodyFont: { size: 14, weight: '500', family: "'Inter', sans-serif" },
                cornerRadius: 12,
                displayColors: true,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 159, 50, 0.3)',
                borderWidth: 1,
                boxPadding: 6,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.06)',
                  lineWidth: 1,
                  drawBorder: false,
                },
                ticks: {
                  color: '#6b7280',
                  font: { size: 12, weight: '500' },
                  padding: 10,
                }
              },
              x: {
                grid: {
                  display: false,
                  drawBorder: false,
                },
                ticks: {
                  color: '#6b7280',
                  font: { size: 12, weight: '500' },
                  maxRotation: 45,
                  minRotation: 0,
                  padding: 12,
                }
              }
            }
          }
        });
      }
    `;
  }

  // Pie Chart with beautiful colors
  const pieData = data.slice(0, 6);
  const pieLabels = pieData.map((row) => String(row[categoryColumn.accessor] || "").substring(0, 20));
  const pieValues = pieData.map((row) => Number(row[firstNumericCol.accessor]) || 0);

  const pieColors = [
    'rgba(255, 159, 50, 0.95)',
    'rgba(255, 180, 77, 0.95)',
    'rgba(255, 200, 100, 0.95)',
    'rgba(255, 210, 120, 0.95)',
    'rgba(255, 220, 140, 0.95)',
    'rgba(255, 230, 160, 0.95)'
  ];

  scripts += `
    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
      new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ${JSON.stringify(pieLabels)},
          datasets: [{
            data: ${JSON.stringify(pieValues)},
            backgroundColor: ${JSON.stringify(pieColors)},
            borderColor: '#fff',
            borderWidth: 4,
            hoverBorderWidth: 6,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              position: 'right',
              labels: {
                padding: 18,
                font: { size: 13, weight: '500', family: "'Inter', sans-serif" },
                color: '#37352F',
                usePointStyle: true,
                pointStyle: 'circle',
              }
            },
            tooltip: {
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              padding: 16,
              titleFont: { size: 15, weight: '700', family: "'Inter', sans-serif" },
              bodyFont: { size: 14, weight: '500', family: "'Inter', sans-serif" },
              cornerRadius: 12,
              displayColors: true,
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 159, 50, 0.3)',
              borderWidth: 1,
              boxPadding: 6,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return label + ': ' + new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(value) + ' (' + percentage + '%)';
                }
              }
            }
          }
        }
      });
    }
  `;

  // Comparison Chart (if second numeric column exists)
  if (secondNumericCol && values2) {
    scripts += `
      // Comparison Chart
      const compCtx = document.getElementById('comparisonChart');
      if (compCtx) {
        const compGradient1 = compCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        compGradient1.addColorStop(0, 'rgba(255, 159, 50, 0.9)');
        compGradient1.addColorStop(1, 'rgba(255, 180, 77, 0.7)');
        
        const compGradient2 = compCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        compGradient2.addColorStop(0, 'rgba(55, 53, 47, 0.9)');
        compGradient2.addColorStop(1, 'rgba(107, 114, 128, 0.7)');
        
        new Chart(compCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(labels)},
            datasets: [
              {
                label: '${firstNumericCol.label}',
                data: ${JSON.stringify(values1)},
                backgroundColor: compGradient1,
                borderColor: 'rgba(255, 159, 50, 1)',
                borderWidth: 2,
                borderRadius: 12,
                barThickness: 'flex',
                maxBarThickness: 50,
              },
              {
                label: '${secondNumericCol.label}',
                data: ${JSON.stringify(values2)},
                backgroundColor: compGradient2,
                borderColor: 'rgba(55, 53, 47, 1)',
                borderWidth: 2,
                borderRadius: 12,
                barThickness: 'flex',
                maxBarThickness: 50,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1500,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  font: { size: 13, weight: '600', family: "'Inter', sans-serif" },
                  color: '#37352F'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(26, 26, 26, 0.95)',
                padding: 16,
                titleFont: { size: 15, weight: '700', family: "'Inter', sans-serif" },
                bodyFont: { size: 14, weight: '500', family: "'Inter', sans-serif" },
                cornerRadius: 12,
                displayColors: true,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 159, 50, 0.3)',
                borderWidth: 1,
                boxPadding: 6,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.06)',
                  lineWidth: 1,
                  drawBorder: false,
                },
                ticks: {
                  color: '#6b7280',
                  font: { size: 12, weight: '500' },
                  padding: 10,
                  callback: function(value) {
                    return new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(value);
                  }
                }
              },
              x: {
                grid: {
                  display: false,
                  drawBorder: false,
                },
                ticks: {
                  color: '#6b7280',
                  font: { size: 12, weight: '500' },
                  maxRotation: 45,
                  minRotation: 0,
                  padding: 12,
                }
              }
            }
          }
        });
      }
    `;
  }

  return scripts;
};


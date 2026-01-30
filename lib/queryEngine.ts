// Intelligent query engine for processing natural language queries about business data

import {
  POINTS_OF_SALE,
  PRODUCTS,
  SALES_BY_STATE,
  PRODUCTION_LINES,
  MANUFACTURED_PRODUCTS,
  SHIPMENTS,
  ROUTES,
  WAREHOUSES,
  SALES_REPS,
  SALES_CHANNELS,
  EMPLOYEES,
  DEPARTMENTS,
  type PointOfSale
} from "@/data/businessData";

export type QueryResult = {
  heading: string;
  summary: string;
  data: any[];
  columns: Array<{ accessor: string; label: string; sortable?: boolean }>;
};

// Normalizar texto para búsqueda (quitar acentos y convertir a minúsculas)
const normalize = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Detectar estados mencionados en la query
const detectStates = (query: string): string[] => {
  const normalized = normalize(query);
  const states = SALES_BY_STATE.map((s) => s.state);
  return states.filter((state) => normalized.includes(normalize(state)));
};

// Detectar ciudades mencionadas
const detectCities = (query: string): string[] => {
  const normalized = normalize(query);
  const cities = [...new Set(POINTS_OF_SALE.map((p) => p.city))];
  return cities.filter((city) => normalized.includes(normalize(city)));
};

// Detectar periodo de tiempo mencionado
const detectTimePeriod = (query: string): "month" | "3months" | "6months" | "year" => {
  const normalized = normalize(query);
  if (normalized.includes("ultimo mes") || normalized.includes("1 mes")) {
    return "month";
  }
  if (normalized.includes("6 meses") || normalized.includes("semestre")) {
    return "6months";
  }
  if (normalized.includes("ano") || normalized.includes("anual") || normalized.includes("12 meses")) {
    return "year";
  }
  return "3months"; // default
};

// Query 1: Listar puntos de venta (por estado o ciudad)
const queryPointsOfSale = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  // Detectar si pregunta por puntos de venta
  if (!normalized.includes("punto") && !normalized.includes("venta") && !normalized.includes("tienda")) {
    return null;
  }

  const states = detectStates(query);
  const cities = detectCities(query);

  let filtered = [...POINTS_OF_SALE];

  // Filtrar por estado si se menciona
  if (states.length > 0) {
    filtered = filtered.filter((p) => states.includes(p.state));
  }

  // Filtrar por ciudad si se menciona
  if (cities.length > 0) {
    filtered = filtered.filter((p) => cities.includes(p.city));
  }

  const location = states.length > 0 ? states[0] : cities.length > 0 ? cities[0] : "todo el país";
  const activeCount = filtered.filter((p) => p.status === "Activo").length;

  return {
    heading: `Puntos de Venta - ${location}`,
    summary: `Actualmente tienes ${filtered.length} puntos de venta en ${location}, de los cuales ${activeCount} están activos y operando con normalidad.`,
    data: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      state: p.state,
      salesLastMonth: p.salesLastMonth,
      salesLast3Months: p.salesLast3Months,
      status: p.status
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Punto de Venta", sortable: true },
      { accessor: "city", label: "Ciudad", sortable: true },
      { accessor: "state", label: "Estado", sortable: true },
      { accessor: "salesLastMonth", label: "Ventas (1 mes)", sortable: true },
      { accessor: "salesLast3Months", label: "Ventas (3 meses)", sortable: true },
      { accessor: "status", label: "Estatus", sortable: true }
    ]
  };
};

// Query 2: Top puntos de venta (cuál vendió más)
const queryTopPointsOfSale = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  // Detectar si pregunta por el mejor/top/más vendido
  if (
    !normalized.includes("top") &&
    !normalized.includes("mejor") &&
    !normalized.includes("mas vendi") &&
    !normalized.includes("mayor") &&
    !normalized.includes("cual")
  ) {
    return null;
  }

  const states = detectStates(query);
  const period = detectTimePeriod(query);
  
  let filtered = [...POINTS_OF_SALE];
  
  // Filtrar por estado si se menciona
  if (states.length > 0) {
    filtered = filtered.filter((p) => states.includes(p.state));
  }

  // Determinar campo de ventas según periodo
  const salesField =
    period === "month"
      ? "salesLastMonth"
      : period === "6months"
      ? "salesLast6Months"
      : period === "year"
      ? "salesLastYear"
      : "salesLast3Months";

  // Ordenar por ventas (mayor a menor)
  filtered.sort((a, b) => b[salesField] - a[salesField]);

  // Detectar si pide un número específico (top 3, top 5, etc)
  const topMatch = normalized.match(/top\s*(\d+)/);
  const limit = topMatch ? parseInt(topMatch[1]) : 5;
  filtered = filtered.slice(0, limit);

  const location = states.length > 0 ? states[0] : "todo el país";
  const periodLabel =
    period === "month"
      ? "último mes"
      : period === "6months"
      ? "últimos 6 meses"
      : period === "year"
      ? "último año"
      : "últimos 3 meses";

  const winner = filtered[0];

  return {
    heading: `Top ${limit} Puntos de Venta - ${periodLabel}`,
    summary: `El punto de venta con mayores ventas en ${periodLabel} ${
      states.length > 0 ? `en ${location}` : ""
    } es ${winner.name} (${winner.id}) con un total de ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(winner[salesField])}.`,
    data: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      sales: p[salesField]
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: false },
      { accessor: "name", label: "Punto de Venta", sortable: false },
      { accessor: "city", label: "Ciudad", sortable: false },
      { accessor: "sales", label: `Ventas (${periodLabel})`, sortable: false }
    ]
  };
};

// Query 3: Ventas por estado
const querySalesByState = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  // Detectar si pregunta por ventas por estado
  if (
    !normalized.includes("venta") ||
    (!normalized.includes("estado") && !normalized.includes("region"))
  ) {
    return null;
  }

  const period = detectTimePeriod(query);
  
  // Determinar campo de ventas
  const salesField =
    period === "month"
      ? "salesLastMonth"
      : period === "year"
      ? "salesLastYear"
      : "salesLast3Months";

  const periodLabel =
    period === "month"
      ? "último mes"
      : period === "year"
      ? "último año"
      : "últimos 3 meses";

  // Ordenar por ventas
  const sorted = [...SALES_BY_STATE].sort((a, b) => b[salesField] - a[salesField]);
  const topState = sorted[0];

  return {
    heading: `Resumen de Ventas por Estado - ${periodLabel}`,
    summary: `En ${periodLabel}, el estado con mejores resultados es ${
      topState.state
    } con ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(topState[salesField])} y un crecimiento del ${topState.growth}% respecto al periodo anterior.`,
    data: sorted.map((s) => ({
      state: s.state,
      region: s.region,
      sales: s[salesField],
      growth: s.growth,
      pointsOfSale: s.pointsOfSale
    })),
    columns: [
      { accessor: "state", label: "Estado", sortable: true },
      { accessor: "region", label: "Región", sortable: true },
      { accessor: "sales", label: `Ventas (${periodLabel})`, sortable: true },
      { accessor: "growth", label: "Crecimiento (%)", sortable: true },
      { accessor: "pointsOfSale", label: "Puntos de Venta", sortable: true }
    ]
  };
};

// Query 4: Productos
const queryProducts = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  if (!normalized.includes("producto") && !normalized.includes("catalogo") && !normalized.includes("inventario")) {
    return null;
  }

  let filtered = [...PRODUCTS];

  // Detectar si pide top productos
  if (normalized.includes("top") || normalized.includes("mejor") || normalized.includes("mas vendi")) {
    filtered.sort((a, b) => b.revenue - a.revenue);
    const topMatch = normalized.match(/top\s*(\d+)/);
    const limit = topMatch ? parseInt(topMatch[1]) : 5;
    filtered = filtered.slice(0, limit);

    const topProduct = filtered[0];

    return {
      heading: `Top ${limit} Productos por Ingresos`,
      summary: `El producto más vendido es "${topProduct.name}" con ${
        topProduct.unitsSold
      } unidades vendidas y ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(topProduct.revenue)} en ingresos totales.`,
      data: filtered.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unitsSold: p.unitsSold,
        revenue: p.revenue
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: false },
        { accessor: "name", label: "Producto", sortable: false },
        { accessor: "category", label: "Categoría", sortable: false },
        { accessor: "unitsSold", label: "Unidades Vendidas", sortable: false },
        { accessor: "revenue", label: "Ingresos Totales", sortable: false }
      ]
    };
  }

  // Listar todos los productos
  const totalRevenue = filtered.reduce((sum, p) => sum + p.revenue, 0);

  return {
    heading: "Catálogo de Productos",
    summary: `Actualmente gestionas ${filtered.length} productos en tu catálogo, con ingresos totales de ${new Intl.NumberFormat(
      "es-MX",
      {
        style: "currency",
        currency: "MXN"
      }
    ).format(totalRevenue)}.`,
    data: filtered.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unitsSold: p.unitsSold
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Producto", sortable: true },
      { accessor: "category", label: "Categoría", sortable: true },
      { accessor: "price", label: "Precio", sortable: true },
      { accessor: "stock", label: "Stock", sortable: true },
      { accessor: "unitsSold", label: "Unidades Vendidas", sortable: true }
    ]
  };
};

// Query 5: Empleados/Personal (from HR)
const queryEmployees = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  if (
    !normalized.includes("gerente") &&
    !normalized.includes("manager") &&
    !normalized.includes("empleado") &&
    !normalized.includes("personal") &&
    !normalized.includes("recursos humanos")
  ) {
    return null;
  }

  // Check if asking for departments
  if (normalized.includes("departamento") || normalized.includes("area")) {
    const totalEmployees = EMPLOYEES.filter(e => e.status === "Activo").length;
    const totalBudget = DEPARTMENTS.reduce((sum, d) => sum + d.budget, 0);

    return {
      heading: "Departamentos y Organización",
      summary: `La empresa cuenta con ${DEPARTMENTS.length} departamentos, ${totalEmployees} empleados activos y un presupuesto mensual total de ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(totalBudget)}.`,
      data: DEPARTMENTS.map((d) => ({
        id: d.id,
        name: d.name,
        employees: d.employees,
        budget: d.budget,
        manager: d.manager,
        status: d.status
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: true },
        { accessor: "name", label: "Departamento", sortable: true },
        { accessor: "employees", label: "Empleados", sortable: true },
        { accessor: "budget", label: "Presupuesto Mensual", sortable: true },
        { accessor: "manager", label: "Gerente", sortable: true },
        { accessor: "status", label: "Estatus", sortable: true }
      ]
    };
  }

  const totalEmployees = EMPLOYEES.filter(e => e.status === "Activo").length;
  const avgSalary = EMPLOYEES.filter(e => e.status === "Activo").reduce((sum, e) => sum + e.salary, 0) / totalEmployees;

  return {
    heading: "Empleados de la Empresa",
    summary: `La empresa cuenta con ${totalEmployees} empleados activos, distribuidos en ${DEPARTMENTS.length} departamentos, con un salario promedio de ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(avgSalary)}.`,
    data: EMPLOYEES.filter(e => e.status === "Activo").map((e) => ({
      id: e.id,
      name: e.name,
      department: e.department,
      position: e.position,
      location: e.location,
      salary: e.salary,
      performance: e.performance
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Nombre", sortable: true },
      { accessor: "department", label: "Departamento", sortable: true },
      { accessor: "position", label: "Posición", sortable: true },
      { accessor: "location", label: "Ubicación", sortable: true },
      { accessor: "salary", label: "Salario", sortable: true },
      { accessor: "performance", label: "Desempeño", sortable: true }
    ]
  };
};

// Query 6: Manufacturing - Production Lines
const queryManufacturing = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  if (
    !normalized.includes("manufactura") &&
    !normalized.includes("produccion") &&
    !normalized.includes("linea") &&
    !normalized.includes("planta") &&
    !normalized.includes("ensamble")
  ) {
    return null;
  }

  // Check if asking for manufactured products
  if (normalized.includes("producto manufacturado") || normalized.includes("fabricado")) {
    const totalProduced = MANUFACTURED_PRODUCTS.reduce((sum, p) => sum + p.unitsProduced, 0);
    const totalRevenue = MANUFACTURED_PRODUCTS.reduce((sum, p) => sum + p.revenue, 0);

    return {
      heading: "Productos Manufacturados",
      summary: `La empresa produce ${MANUFACTURED_PRODUCTS.length} tipos de productos manufacturados, con un total de ${totalProduced.toLocaleString("es-MX")} unidades producidas y ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(totalRevenue)} en ingresos totales.`,
      data: MANUFACTURED_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unitsProduced: p.unitsProduced,
        unitsSold: p.unitsSold,
        stock: p.stock,
        revenue: p.revenue
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: true },
        { accessor: "name", label: "Producto", sortable: true },
        { accessor: "category", label: "Categoría", sortable: true },
        { accessor: "unitsProduced", label: "Unidades Producidas", sortable: true },
        { accessor: "unitsSold", label: "Unidades Vendidas", sortable: true },
        { accessor: "stock", label: "Inventario", sortable: true },
        { accessor: "revenue", label: "Ingresos", sortable: true }
      ]
    };
  }

  // Default: production lines
  const activeLines = PRODUCTION_LINES.filter(l => l.status === "Operativa").length;
  const totalProduction = PRODUCTION_LINES.reduce((sum, l) => sum + l.monthlyProduction, 0);
  const avgEfficiency = PRODUCTION_LINES.reduce((sum, l) => sum + l.efficiency, 0) / PRODUCTION_LINES.length;

  return {
    heading: "Líneas de Producción",
    summary: `La empresa cuenta con ${PRODUCTION_LINES.length} líneas de producción, ${activeLines} operativas actualmente, produciendo un total de ${totalProduction.toLocaleString("es-MX")} unidades mensuales con una eficiencia promedio del ${avgEfficiency.toFixed(1)}%.`,
    data: PRODUCTION_LINES.map((l) => ({
      id: l.id,
      name: l.name,
      location: l.location,
      productType: l.productType,
      monthlyProduction: l.monthlyProduction,
      efficiency: l.efficiency,
      defectsRate: l.defectsRate,
      status: l.status,
      supervisor: l.supervisor,
      workers: l.workers
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Línea", sortable: true },
      { accessor: "location", label: "Ubicación", sortable: true },
      { accessor: "productType", label: "Tipo de Producto", sortable: true },
      { accessor: "monthlyProduction", label: "Producción Mensual", sortable: true },
      { accessor: "efficiency", label: "Eficiencia (%)", sortable: true },
      { accessor: "defectsRate", label: "Tasa de Defectos (%)", sortable: true },
      { accessor: "status", label: "Estatus", sortable: true }
    ]
  };
};

// Query 7: Logistics - Shipments, Routes, Warehouses
const queryLogistics = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  if (
    !normalized.includes("logistica") &&
    !normalized.includes("embarque") &&
    !normalized.includes("ruta") &&
    !normalized.includes("almacen") &&
    !normalized.includes("distribucion") &&
    !normalized.includes("transporte")
  ) {
    return null;
  }

  // Check if asking for shipments
  if (normalized.includes("embarque") || normalized.includes("envio")) {
    const inTransit = SHIPMENTS.filter(s => s.status === "En Tránsito").length;
    const delivered = SHIPMENTS.filter(s => s.status === "Entregado").length;

    return {
      heading: "Embarques y Envíos",
      summary: `Actualmente hay ${SHIPMENTS.length} embarques registrados: ${inTransit} en tránsito, ${delivered} entregados. El costo total de envíos es de ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(SHIPMENTS.reduce((sum, s) => sum + s.cost, 0))}.`,
      data: SHIPMENTS.map((s) => ({
        id: s.id,
        origin: s.origin,
        destination: s.destination,
        route: s.route,
        carrier: s.carrier,
        quantity: s.quantity,
        status: s.status,
        shippedDate: s.shippedDate,
        expectedDelivery: s.expectedDelivery,
        cost: s.cost
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: true },
        { accessor: "origin", label: "Origen", sortable: true },
        { accessor: "destination", label: "Destino", sortable: true },
        { accessor: "carrier", label: "Transportista", sortable: true },
        { accessor: "quantity", label: "Cantidad", sortable: true },
        { accessor: "status", label: "Estatus", sortable: true },
        { accessor: "cost", label: "Costo", sortable: true }
      ]
    };
  }

  // Check if asking for routes
  if (normalized.includes("ruta")) {
    const activeRoutes = ROUTES.filter(r => r.status === "Activa").length;

    return {
      heading: "Rutas de Distribución",
      summary: `La empresa opera ${activeRoutes} rutas activas de distribución, cubriendo las principales ciudades del país con una frecuencia promedio diaria.`,
      data: ROUTES.map((r) => ({
        id: r.id,
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        distance: r.distance,
        estimatedTime: r.estimatedTime,
        frequency: r.frequency,
        shipmentsLastMonth: r.shipmentsLastMonth,
        averageCost: r.averageCost,
        status: r.status
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: true },
        { accessor: "name", label: "Ruta", sortable: true },
        { accessor: "origin", label: "Origen", sortable: true },
        { accessor: "destination", label: "Destino", sortable: true },
        { accessor: "distance", label: "Distancia (km)", sortable: true },
        { accessor: "estimatedTime", label: "Tiempo Est. (hrs)", sortable: true },
        { accessor: "frequency", label: "Frecuencia", sortable: true },
        { accessor: "status", label: "Estatus", sortable: true }
      ]
    };
  }

  // Default: warehouses
  const totalCapacity = WAREHOUSES.reduce((sum, w) => sum + w.capacity, 0);
  const totalStock = WAREHOUSES.reduce((sum, w) => sum + w.currentStock, 0);
  const avgUtilization = WAREHOUSES.reduce((sum, w) => sum + w.utilization, 0) / WAREHOUSES.length;

  return {
    heading: "Almacenes y Centros de Distribución",
    summary: `La empresa cuenta con ${WAREHOUSES.length} almacenes distribuidos estratégicamente, con una capacidad total de ${totalCapacity.toLocaleString("es-MX")} m², utilización promedio del ${avgUtilization.toFixed(1)}% y ${totalStock.toLocaleString("es-MX")} m² ocupados actualmente.`,
    data: WAREHOUSES.map((w) => ({
      id: w.id,
      name: w.name,
      location: w.location,
      city: w.city,
      state: w.state,
      capacity: w.capacity,
      currentStock: w.currentStock,
      utilization: w.utilization,
      products: w.products,
      manager: w.manager
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Almacén", sortable: true },
      { accessor: "city", label: "Ciudad", sortable: true },
      { accessor: "state", label: "Estado", sortable: true },
      { accessor: "capacity", label: "Capacidad (m²)", sortable: true },
      { accessor: "currentStock", label: "Ocupación (m²)", sortable: true },
      { accessor: "utilization", label: "Utilización (%)", sortable: true },
      { accessor: "products", label: "Productos", sortable: true }
    ]
  };
};

// Query 8: Sales - Sales Reps and Channels
const querySales = (query: string): QueryResult | null => {
  const normalized = normalize(query);
  
  if (
    !normalized.includes("vendedor") &&
    !normalized.includes("ejecutivo") &&
    !normalized.includes("canal") &&
    !normalized.includes("cuota") &&
    (!normalized.includes("venta") || normalized.includes("ventas por estado"))
  ) {
    return null;
  }

  // Check if asking for sales channels
  if (normalized.includes("canal")) {
    const totalSales = SALES_CHANNELS.reduce((sum, c) => sum + c.salesLastMonth, 0);
    const activeChannels = SALES_CHANNELS.filter(c => c.status === "Activo").length;

    return {
      heading: "Canales de Venta",
      summary: `La empresa opera a través de ${activeChannels} canales de venta activos, generando un total de ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
      }).format(totalSales)} en ventas del último mes.`,
      data: SALES_CHANNELS.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        salesLastMonth: c.salesLastMonth,
        salesLastYear: c.salesLastYear,
        clients: c.clients,
        margin: c.margin,
        status: c.status
      })),
      columns: [
        { accessor: "id", label: "ID", sortable: true },
        { accessor: "name", label: "Canal", sortable: true },
        { accessor: "type", label: "Tipo", sortable: true },
        { accessor: "salesLastMonth", label: "Ventas (Mes)", sortable: true },
        { accessor: "salesLastYear", label: "Ventas (Año)", sortable: true },
        { accessor: "clients", label: "Clientes", sortable: true },
        { accessor: "margin", label: "Margen (%)", sortable: true }
      ]
    };
  }

  // Default: sales representatives
  const activeReps = SALES_REPS.filter(r => r.status === "Activo").length;
  const totalSales = SALES_REPS.reduce((sum, r) => sum + r.salesLastMonth, 0);
  const avgAchievement = SALES_REPS.filter(r => r.status === "Activo").reduce((sum, r) => sum + r.quotaAchievement, 0) / activeReps;

  return {
    heading: "Equipo de Ventas",
    summary: `El equipo de ventas cuenta con ${activeReps} vendedores activos, generando un total de ${new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN"
    }).format(totalSales)} en ventas del último mes, con un cumplimiento promedio de cuota del ${avgAchievement.toFixed(1)}%.`,
    data: SALES_REPS.filter(r => r.status === "Activo").map((r) => ({
      id: r.id,
      name: r.name,
      region: r.region,
      territory: r.territory,
      salesLastMonth: r.salesLastMonth,
      quota: r.quota,
      quotaAchievement: r.quotaAchievement,
      clients: r.clients,
      manager: r.manager
    })),
    columns: [
      { accessor: "id", label: "ID", sortable: true },
      { accessor: "name", label: "Vendedor", sortable: true },
      { accessor: "region", label: "Región", sortable: true },
      { accessor: "salesLastMonth", label: "Ventas (Mes)", sortable: true },
      { accessor: "quota", label: "Cuota Mensual", sortable: true },
      { accessor: "quotaAchievement", label: "Cumplimiento (%)", sortable: true },
      { accessor: "clients", label: "Clientes", sortable: true }
    ]
  };
};

// Motor principal: intenta cada tipo de query en orden de prioridad
export const processQuery = (query: string): QueryResult => {
  // Intentar cada función de query en orden de especificidad
  const result =
    queryTopPointsOfSale(query) ||
    queryManufacturing(query) ||
    queryLogistics(query) ||
    querySales(query) ||
    queryEmployees(query) ||
    queryPointsOfSale(query) ||
    querySalesByState(query) ||
    queryProducts(query);

  if (result) {
    return result;
  }

  // Respuesta por defecto si ninguna query coincide
  return querySalesByState("ventas por estado 3 meses")!;
};


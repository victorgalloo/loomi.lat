// Comprehensive mock business data for Syntra
// Manufacturing company with retail, logistics, sales, and HR departments

// ============================================================================
// POINTS OF SALE (Retail)
// ============================================================================

export type PointOfSale = {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string;
  salesLastMonth: number;
  salesLast3Months: number;
  salesLast6Months: number;
  salesLastYear: number;
  status: "Activo" | "Bajo Rendimiento" | "Inactivo" | "En Revisión";
  manager: string;
  employees: number;
  openingSince: string;
};

export const POINTS_OF_SALE: PointOfSale[] = [
  // Jalisco
  {
    id: "SYN-GDL-001",
    name: "Syntra Guadalajara Centro",
    city: "Guadalajara",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 120500,
    salesLast3Months: 350200,
    salesLast6Months: 680000,
    salesLastYear: 1250000,
    status: "Activo",
    manager: "Carlos Martínez",
    employees: 12,
    openingSince: "2019-03-15"
  },
  {
    id: "SYN-ZAP-001",
    name: "Syntra Zapopan",
    city: "Zapopan",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 85300,
    salesLast3Months: 240100,
    salesLast6Months: 465000,
    salesLastYear: 890000,
    status: "Activo",
    manager: "Ana López",
    employees: 8,
    openingSince: "2020-01-20"
  },
  {
    id: "SYN-PVA-001",
    name: "Syntra Puerto Vallarta",
    city: "Puerto Vallarta",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 62100,
    salesLast3Months: 190000,
    salesLast6Months: 380000,
    salesLastYear: 720000,
    status: "Bajo Rendimiento",
    manager: "Roberto Sánchez",
    employees: 6,
    openingSince: "2021-06-10"
  },
  {
    id: "SYN-TLA-001",
    name: "Syntra Tlaquepaque",
    city: "Tlaquepaque",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 95000,
    salesLast3Months: 295500,
    salesLast6Months: 580000,
    salesLastYear: 1100000,
    status: "Activo",
    manager: "María González",
    employees: 10,
    openingSince: "2019-08-25"
  },
  {
    id: "SYN-TON-001",
    name: "Syntra Tonalá",
    city: "Tonalá",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 48200,
    salesLast3Months: 142000,
    salesLast6Months: 280000,
    salesLastYear: 530000,
    status: "En Revisión",
    manager: "Jorge Ramírez",
    employees: 5,
    openingSince: "2022-02-14"
  },
  {
    id: "SYN-LAG-001",
    name: "Syntra Lagos de Moreno",
    city: "Lagos de Moreno",
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 38500,
    salesLast3Months: 115000,
    salesLast6Months: 225000,
    salesLastYear: 430000,
    status: "Activo",
    manager: "Patricia Díaz",
    employees: 4,
    openingSince: "2021-11-05"
  },

  // Ciudad de México
  {
    id: "SYN-CDMX-001",
    name: "Syntra Polanco",
    city: "Ciudad de México",
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 185000,
    salesLast3Months: 540000,
    salesLast6Months: 1050000,
    salesLastYear: 2100000,
    status: "Activo",
    manager: "Fernando Torres",
    employees: 18,
    openingSince: "2018-05-10"
  },
  {
    id: "SYN-CDMX-002",
    name: "Syntra Santa Fe",
    city: "Ciudad de México",
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 210000,
    salesLast3Months: 625000,
    salesLast6Months: 1220000,
    salesLastYear: 2450000,
    status: "Activo",
    manager: "Laura Mendoza",
    employees: 22,
    openingSince: "2017-09-20"
  },
  {
    id: "SYN-CDMX-003",
    name: "Syntra Roma Norte",
    city: "Ciudad de México",
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 142000,
    salesLast3Months: 425000,
    salesLast6Months: 830000,
    salesLastYear: 1650000,
    status: "Activo",
    manager: "Diego Vargas",
    employees: 14,
    openingSince: "2019-07-15"
  },
  {
    id: "SYN-CDMX-004",
    name: "Syntra Reforma",
    city: "Ciudad de México",
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 165000,
    salesLast3Months: 495000,
    salesLast6Months: 970000,
    salesLastYear: 1920000,
    status: "Activo",
    manager: "Sofía Herrera",
    employees: 16,
    openingSince: "2018-11-30"
  },
  {
    id: "SYN-CDMX-005",
    name: "Syntra Coyoacán",
    city: "Ciudad de México",
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 128000,
    salesLast3Months: 385000,
    salesLast6Months: 750000,
    salesLastYear: 1450000,
    status: "Activo",
    manager: "Eduardo Morales",
    employees: 13,
    openingSince: "2019-02-18"
  },

  // Nuevo León
  {
    id: "SYN-MTY-001",
    name: "Syntra Monterrey Centro",
    city: "Monterrey",
    state: "Nuevo León",
    region: "Norte",
    salesLastMonth: 152000,
    salesLast3Months: 445000,
    salesLast6Months: 870000,
    salesLastYear: 1720000,
    status: "Activo",
    manager: "Ricardo Flores",
    employees: 15,
    openingSince: "2019-01-10"
  },
  {
    id: "SYN-MTY-002",
    name: "Syntra San Pedro",
    city: "San Pedro Garza García",
    state: "Nuevo León",
    region: "Norte",
    salesLastMonth: 195000,
    salesLast3Months: 580000,
    salesLast6Months: 1140000,
    salesLastYear: 2250000,
    status: "Activo",
    manager: "Gabriela Ruiz",
    employees: 20,
    openingSince: "2018-04-22"
  },
  {
    id: "SYN-APO-001",
    name: "Syntra Apodaca",
    city: "Apodaca",
    state: "Nuevo León",
    region: "Norte",
    salesLastMonth: 78000,
    salesLast3Months: 230000,
    salesLast6Months: 450000,
    salesLastYear: 880000,
    status: "Activo",
    manager: "Miguel Ángel Castro",
    employees: 9,
    openingSince: "2020-08-15"
  },

  // Querétaro
  {
    id: "SYN-QRO-001",
    name: "Syntra Querétaro Centro",
    city: "Querétaro",
    state: "Querétaro",
    region: "Bajío",
    salesLastMonth: 105000,
    salesLast3Months: 315000,
    salesLast6Months: 620000,
    salesLastYear: 1220000,
    status: "Activo",
    manager: "Alejandra Moreno",
    employees: 11,
    openingSince: "2019-10-05"
  },
  {
    id: "SYN-QRO-002",
    name: "Syntra El Refugio",
    city: "Querétaro",
    state: "Querétaro",
    region: "Bajío",
    salesLastMonth: 88000,
    salesLast3Months: 265000,
    salesLast6Months: 520000,
    salesLastYear: 1020000,
    status: "Activo",
    manager: "Javier Ortiz",
    employees: 10,
    openingSince: "2020-03-18"
  },

  // Puebla
  {
    id: "SYN-PUE-001",
    name: "Syntra Puebla Angelópolis",
    city: "Puebla",
    state: "Puebla",
    region: "Centro",
    salesLastMonth: 112000,
    salesLast3Months: 335000,
    salesLast6Months: 660000,
    salesLastYear: 1300000,
    status: "Activo",
    manager: "Andrea Jiménez",
    employees: 13,
    openingSince: "2019-05-20"
  },
  {
    id: "SYN-PUE-002",
    name: "Syntra Puebla Centro",
    city: "Puebla",
    state: "Puebla",
    region: "Centro",
    salesLastMonth: 92000,
    salesLast3Months: 275000,
    salesLast6Months: 540000,
    salesLastYear: 1060000,
    status: "Activo",
    manager: "Luis Reyes",
    employees: 11,
    openingSince: "2020-07-12"
  },

  // Guanajuato
  {
    id: "SYN-LEO-001",
    name: "Syntra León",
    city: "León",
    state: "Guanajuato",
    region: "Bajío",
    salesLastMonth: 98000,
    salesLast3Months: 290000,
    salesLast6Months: 570000,
    salesLastYear: 1120000,
    status: "Activo",
    manager: "Rosa Navarro",
    employees: 10,
    openingSince: "2019-12-01"
  },
  {
    id: "SYN-GTO-001",
    name: "Syntra Guanajuato Capital",
    city: "Guanajuato",
    state: "Guanajuato",
    region: "Bajío",
    salesLastMonth: 52000,
    salesLast3Months: 158000,
    salesLast6Months: 310000,
    salesLastYear: 610000,
    status: "Activo",
    manager: "Enrique Salinas",
    employees: 6,
    openingSince: "2021-04-08"
  },

  // Yucatán
  {
    id: "SYN-MER-001",
    name: "Syntra Mérida Norte",
    city: "Mérida",
    state: "Yucatán",
    region: "Sureste",
    salesLastMonth: 118000,
    salesLast3Months: 350000,
    salesLast6Months: 690000,
    salesLastYear: 1360000,
    status: "Activo",
    manager: "Carmen Aguilar",
    employees: 12,
    openingSince: "2019-06-15"
  },
  {
    id: "SYN-MER-002",
    name: "Syntra Mérida Centro",
    city: "Mérida",
    state: "Yucatán",
    region: "Sureste",
    salesLastMonth: 95000,
    salesLast3Months: 282000,
    salesLast6Months: 555000,
    salesLastYear: 1090000,
    status: "Activo",
    manager: "Pedro Chávez",
    employees: 10,
    openingSince: "2020-09-22"
  },

  // Aguascalientes
  {
    id: "SYN-AGS-001",
    name: "Syntra Aguascalientes Centro",
    city: "Aguascalientes",
    state: "Aguascalientes",
    region: "Bajío",
    salesLastMonth: 89000,
    salesLast3Months: 268000,
    salesLast6Months: 525000,
    salesLastYear: 1030000,
    status: "Activo",
    manager: "Isabel Contreras",
    employees: 9,
    openingSince: "2020-05-12"
  },

  // Sonora
  {
    id: "SYN-HER-001",
    name: "Syntra Hermosillo",
    city: "Hermosillo",
    state: "Sonora",
    region: "Norte",
    salesLastMonth: 102000,
    salesLast3Months: 305000,
    salesLast6Months: 600000,
    salesLastYear: 1180000,
    status: "Activo",
    manager: "Roberto Hernández",
    employees: 11,
    openingSince: "2019-11-08"
  },

  // Chihuahua
  {
    id: "SYN-CHI-001",
    name: "Syntra Chihuahua",
    city: "Chihuahua",
    state: "Chihuahua",
    region: "Norte",
    salesLastMonth: 115000,
    salesLast3Months: 342000,
    salesLast6Months: 670000,
    salesLastYear: 1320000,
    status: "Activo",
    manager: "Verónica Ríos",
    employees: 12,
    openingSince: "2019-08-25"
  }
];

// ============================================================================
// MANUFACTURING - Production Lines & Products
// ============================================================================

export type ProductionLine = {
  id: string;
  name: string;
  location: string;
  productType: string;
  dailyProduction: number;
  weeklyProduction: number;
  monthlyProduction: number;
  efficiency: number; // percentage
  defectsRate: number; // percentage
  status: "Operativa" | "Mantenimiento" | "Parada" | "Configuración";
  supervisor: string;
  workers: number;
};

export type ManufacturedProduct = {
  id: string;
  name: string;
  category: string;
  productionLineId: string;
  cost: number;
  price: number;
  unitsProduced: number;
  unitsSold: number;
  revenue: number;
  stock: number;
  rawMaterials: string[];
};

export const PRODUCTION_LINES: ProductionLine[] = [
  {
    id: "LINE-001",
    name: "Línea de Ensamble A1",
    location: "Planta Guadalajara",
    productType: "Dispositivos Electrónicos",
    dailyProduction: 450,
    weeklyProduction: 3150,
    monthlyProduction: 13500,
    efficiency: 94.5,
    defectsRate: 2.1,
    status: "Operativa",
    supervisor: "José Ramón Pérez",
    workers: 12
  },
  {
    id: "LINE-002",
    name: "Línea de Ensamble A2",
    location: "Planta Guadalajara",
    productType: "Dispositivos Electrónicos",
    dailyProduction: 420,
    weeklyProduction: 2940,
    monthlyProduction: 12600,
    efficiency: 91.2,
    defectsRate: 3.2,
    status: "Operativa",
    supervisor: "María Elena Silva",
    workers: 11
  },
  {
    id: "LINE-003",
    name: "Línea de Empaque B1",
    location: "Planta Guadalajara",
    productType: "Productos Empaquetados",
    dailyProduction: 2800,
    weeklyProduction: 19600,
    monthlyProduction: 84000,
    efficiency: 97.8,
    defectsRate: 0.8,
    status: "Operativa",
    supervisor: "Luis Fernando Gómez",
    workers: 8
  },
  {
    id: "LINE-004",
    name: "Línea de Montaje C1",
    location: "Planta Querétaro",
    productType: "Componentes Mecánicos",
    dailyProduction: 380,
    weeklyProduction: 2660,
    monthlyProduction: 11400,
    efficiency: 88.5,
    defectsRate: 4.5,
    status: "Operativa",
    supervisor: "Ana Patricia Vázquez",
    workers: 14
  },
  {
    id: "LINE-005",
    name: "Línea de Calidad C2",
    location: "Planta Querétaro",
    productType: "Control de Calidad",
    dailyProduction: 520,
    weeklyProduction: 3640,
    monthlyProduction: 15600,
    efficiency: 96.3,
    defectsRate: 1.5,
    status: "Operativa",
    supervisor: "Roberto Carlos Medina",
    workers: 10
  },
  {
    id: "LINE-006",
    name: "Línea de Ensamble D1",
    location: "Planta Monterrey",
    productType: "Equipos Industriales",
    dailyProduction: 125,
    weeklyProduction: 875,
    monthlyProduction: 3750,
    efficiency: 92.1,
    defectsRate: 2.8,
    status: "Operativa",
    supervisor: "Carmen Rosa Delgado",
    workers: 16
  },
  {
    id: "LINE-007",
    name: "Línea de Ensamble D2",
    location: "Planta Monterrey",
    productType: "Equipos Industriales",
    dailyProduction: 135,
    weeklyProduction: 945,
    monthlyProduction: 4050,
    efficiency: 95.7,
    defectsRate: 1.9,
    status: "Mantenimiento",
    supervisor: "Juan Carlos Morales",
    workers: 15
  },
  {
    id: "LINE-008",
    name: "Línea de Empaque E1",
    location: "Planta Puebla",
    productType: "Productos Terminados",
    dailyProduction: 3200,
    weeklyProduction: 22400,
    monthlyProduction: 96000,
    efficiency: 98.2,
    defectsRate: 0.6,
    status: "Operativa",
    supervisor: "Guadalupe Martínez",
    workers: 9
  }
];

export const MANUFACTURED_PRODUCTS: ManufacturedProduct[] = [
  {
    id: "MFG-001",
    name: "Termostato Digital Inteligente",
    category: "Dispositivos Electrónicos",
    productionLineId: "LINE-001",
    cost: 85,
    price: 250,
    unitsProduced: 13500,
    unitsSold: 12400,
    revenue: 3100000,
    stock: 1100,
    rawMaterials: ["Plástico ABS", "Circuito integrado", "Pantalla LCD", "Batería"]
  },
  {
    id: "MFG-002",
    name: "Sensor de Movimiento IoT",
    category: "Dispositivos Electrónicos",
    productionLineId: "LINE-002",
    cost: 45,
    price: 180,
    unitsProduced: 12600,
    unitsSold: 11800,
    revenue: 2124000,
    stock: 800,
    rawMaterials: ["Carcasa plástica", "Sensor PIR", "Módulo WiFi", "PCB"]
  },
  {
    id: "MFG-003",
    name: "Kit de Instalación Estándar",
    category: "Productos Empaquetados",
    productionLineId: "LINE-003",
    cost: 25,
    price: 75,
    unitsProduced: 84000,
    unitsSold: 78500,
    revenue: 5887500,
    stock: 5500,
    rawMaterials: ["Caja cartón", "Manual", "Soporte metálico", "Tornillos"]
  },
  {
    id: "MFG-004",
    name: "Motor DC de Precisión",
    category: "Componentes Mecánicos",
    productionLineId: "LINE-004",
    cost: 120,
    price: 380,
    unitsProduced: 11400,
    unitsSold: 10200,
    revenue: 3876000,
    stock: 1200,
    rawMaterials: ["Cobre", "Imanes neodimio", "Eje acero", "Rodamientos"]
  },
  {
    id: "MFG-005",
    name: "Controlador PLC Industrial",
    category: "Equipos Industriales",
    productionLineId: "LINE-006",
    cost: 350,
    price: 1200,
    unitsProduced: 3750,
    unitsSold: 3420,
    revenue: 4104000,
    stock: 330,
    rawMaterials: ["Carcasa aluminio", "Procesador ARM", "Módulos E/S", "Fuente"]
  },
  {
    id: "MFG-006",
    name: "Pantalla Touch 7 Pulgadas",
    category: "Dispositivos Electrónicos",
    productionLineId: "LINE-001",
    cost: 95,
    price: 320,
    unitsProduced: 12500,
    unitsSold: 11450,
    revenue: 3664000,
    stock: 1050,
    rawMaterials: ["Panel LCD", "Capa táctil", "Controlador", "Marco plástico"]
  },
  {
    id: "MFG-007",
    name: "Caja de Empaque Premium",
    category: "Productos Empaquetados",
    productionLineId: "LINE-008",
    cost: 15,
    price: 45,
    unitsProduced: 96000,
    unitsSold: 89200,
    revenue: 4014000,
    stock: 6800,
    rawMaterials: ["Cartón corrugado", "Espuma protectora", "Etiqueta", "Cinta"]
  },
  {
    id: "MFG-008",
    name: "Actuador Lineal Motorizado",
    category: "Equipos Industriales",
    productionLineId: "LINE-006",
    cost: 280,
    price: 950,
    unitsProduced: 3800,
    unitsSold: 3420,
    revenue: 3249000,
    stock: 380,
    rawMaterials: ["Tornillo de avance", "Motor paso a paso", "Carril guía", "Carcasa"]
  }
];

// ============================================================================
// LOGISTICS - Shipments, Routes, Warehouses
// ============================================================================

export type Shipment = {
  id: string;
  origin: string;
  destination: string;
  route: string;
  carrier: string;
  productId: string;
  quantity: number;
  status: "En Tránsito" | "Entregado" | "Retrasado" | "En Almacén" | "Programado";
  shippedDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  cost: number;
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  capacity: number; // in square meters
  currentStock: number;
  utilization: number; // percentage
  products: number; // number of different products
  manager: string;
};

export type Route = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number; // in km
  estimatedTime: number; // in hours
  frequency: string; // "Diaria", "Semanal", "Quincenal"
  shipmentsLastMonth: number;
  averageCost: number;
  status: "Activa" | "Inactiva" | "Temporal";
};

export const WAREHOUSES: Warehouse[] = [
  {
    id: "WH-001",
    name: "Almacén Central Guadalajara",
    location: "Zona Industrial El Salto",
    city: "Guadalajara",
    state: "Jalisco",
    capacity: 15000,
    currentStock: 12800,
    utilization: 85.3,
    products: 245,
    manager: "Francisco Javier López"
  },
  {
    id: "WH-002",
    name: "Almacén Distribución CDMX",
    location: "Iztapalapa",
    city: "Ciudad de México",
    state: "Ciudad de México",
    capacity: 12000,
    currentStock: 10200,
    utilization: 85.0,
    products: 198,
    manager: "Lucía Estela Ramírez"
  },
  {
    id: "WH-003",
    name: "Almacén Regional Norte",
    location: "Parque Industrial Apodaca",
    city: "Apodaca",
    state: "Nuevo León",
    capacity: 10000,
    currentStock: 8400,
    utilization: 84.0,
    products: 165,
    manager: "Raúl Alberto González"
  },
  {
    id: "WH-004",
    name: "Almacén Bajío",
    location: "Corredor Industrial Querétaro",
    city: "Querétaro",
    state: "Querétaro",
    capacity: 8500,
    currentStock: 6800,
    utilization: 80.0,
    products: 142,
    manager: "Sandra Patricia Mendoza"
  },
  {
    id: "WH-005",
    name: "Almacén Sureste",
    location: "Polígono Industrial Mérida",
    city: "Mérida",
    state: "Yucatán",
    capacity: 7000,
    currentStock: 5600,
    utilization: 80.0,
    products: 128,
    manager: "Jorge Luis Herrera"
  }
];

export const ROUTES: Route[] = [
  {
    id: "RT-001",
    name: "Guadalajara - CDMX",
    origin: "Guadalajara",
    destination: "Ciudad de México",
    distance: 540,
    estimatedTime: 8,
    frequency: "Diaria",
    shipmentsLastMonth: 45,
    averageCost: 8500,
    status: "Activa"
  },
  {
    id: "RT-002",
    name: "CDMX - Monterrey",
    origin: "Ciudad de México",
    destination: "Monterrey",
    distance: 915,
    estimatedTime: 12,
    frequency: "Diaria",
    shipmentsLastMonth: 38,
    averageCost: 12500,
    status: "Activa"
  },
  {
    id: "RT-003",
    name: "Guadalajara - Querétaro",
    origin: "Guadalajara",
    destination: "Querétaro",
    distance: 420,
    estimatedTime: 6,
    frequency: "Diaria",
    shipmentsLastMonth: 52,
    averageCost: 6800,
    status: "Activa"
  },
  {
    id: "RT-004",
    name: "Monterrey - CDMX",
    origin: "Monterrey",
    destination: "Ciudad de México",
    distance: 915,
    estimatedTime: 12,
    frequency: "Diaria",
    shipmentsLastMonth: 35,
    averageCost: 12500,
    status: "Activa"
  },
  {
    id: "RT-005",
    name: "CDMX - Puebla",
    origin: "Ciudad de México",
    destination: "Puebla",
    distance: 135,
    estimatedTime: 2,
    frequency: "Diaria",
    shipmentsLastMonth: 68,
    averageCost: 3200,
    status: "Activa"
  },
  {
    id: "RT-006",
    name: "Querétaro - CDMX",
    origin: "Querétaro",
    destination: "Ciudad de México",
    distance: 220,
    estimatedTime: 3,
    frequency: "Diaria",
    shipmentsLastMonth: 58,
    averageCost: 4500,
    status: "Activa"
  },
  {
    id: "RT-007",
    name: "CDMX - Mérida",
    origin: "Ciudad de México",
    destination: "Mérida",
    distance: 1320,
    estimatedTime: 18,
    frequency: "Semanal",
    shipmentsLastMonth: 12,
    averageCost: 18500,
    status: "Activa"
  },
  {
    id: "RT-008",
    name: "Guadalajara - Aguascalientes",
    origin: "Guadalajara",
    destination: "Aguascalientes",
    distance: 320,
    estimatedTime: 4,
    frequency: "Diaria",
    shipmentsLastMonth: 42,
    averageCost: 5200,
    status: "Activa"
  }
];

export const SHIPMENTS: Shipment[] = [
  {
    id: "SHIP-001",
    origin: "Guadalajara",
    destination: "Ciudad de México",
    route: "RT-001",
    carrier: "Transportes Rápidos SA",
    productId: "MFG-001",
    quantity: 500,
    status: "En Tránsito",
    shippedDate: "2024-11-18",
    expectedDelivery: "2024-11-19",
    cost: 8500
  },
  {
    id: "SHIP-002",
    origin: "CDMX",
    destination: "Monterrey",
    route: "RT-002",
    carrier: "Logística del Norte",
    productId: "MFG-005",
    quantity: 120,
    status: "Entregado",
    shippedDate: "2024-11-15",
    expectedDelivery: "2024-11-16",
    actualDelivery: "2024-11-16",
    cost: 12500
  },
  {
    id: "SHIP-003",
    origin: "Querétaro",
    destination: "CDMX",
    route: "RT-006",
    carrier: "Transportes Express",
    productId: "MFG-004",
    quantity: 300,
    status: "Entregado",
    shippedDate: "2024-11-17",
    expectedDelivery: "2024-11-17",
    actualDelivery: "2024-11-17",
    cost: 4500
  },
  {
    id: "SHIP-004",
    origin: "Guadalajara",
    destination: "Querétaro",
    route: "RT-003",
    carrier: "Fletes Rápidos",
    productId: "MFG-003",
    quantity: 2000,
    status: "Retrasado",
    shippedDate: "2024-11-16",
    expectedDelivery: "2024-11-17",
    cost: 6800
  },
  {
    id: "SHIP-005",
    origin: "CDMX",
    destination: "Puebla",
    route: "RT-005",
    carrier: "Transportes Locales",
    productId: "MFG-007",
    quantity: 1500,
    status: "En Tránsito",
    shippedDate: "2024-11-18",
    expectedDelivery: "2024-11-18",
    cost: 3200
  },
  {
    id: "SHIP-006",
    origin: "Monterrey",
    destination: "CDMX",
    route: "RT-004",
    carrier: "Logística del Norte",
    productId: "MFG-008",
    quantity: 100,
    status: "Programado",
    shippedDate: "2024-11-20",
    expectedDelivery: "2024-11-21",
    cost: 12500
  },
  {
    id: "SHIP-007",
    origin: "CDMX",
    destination: "Mérida",
    route: "RT-007",
    carrier: "Transportes Sureste",
    productId: "MFG-001",
    quantity: 400,
    status: "En Tránsito",
    shippedDate: "2024-11-17",
    expectedDelivery: "2024-11-19",
    cost: 18500
  },
  {
    id: "SHIP-008",
    origin: "Guadalajara",
    destination: "Aguascalientes",
    route: "RT-008",
    carrier: "Fletes Bajío",
    productId: "MFG-002",
    quantity: 600,
    status: "Entregado",
    shippedDate: "2024-11-17",
    expectedDelivery: "2024-11-17",
    actualDelivery: "2024-11-17",
    cost: 5200
  }
];

// ============================================================================
// SALES - Sales Representatives, Channels, Quotas
// ============================================================================

export type SalesRep = {
  id: string;
  name: string;
  region: string;
  territory: string;
  salesLastMonth: number;
  salesLast3Months: number;
  salesLastYear: number;
  quota: number; // monthly quota
  quotaAchievement: number; // percentage
  clients: number;
  status: "Activo" | "En Capacitación" | "Licencia" | "Baja";
  manager: string;
};

export type SalesChannel = {
  id: string;
  name: string;
  type: "Retail" | "Mayoreo" | "Online" | "Distribuidor" | "Institucional";
  salesLastMonth: number;
  salesLast3Months: number;
  salesLastYear: number;
  clients: number;
  margin: number; // percentage
  status: "Activo" | "Inactivo" | "Pendiente";
};

export const SALES_REPS: SalesRep[] = [
  {
    id: "SALES-001",
    name: "Roberto Sánchez García",
    region: "Occidente",
    territory: "Jalisco - Centro",
    salesLastMonth: 285000,
    salesLast3Months: 840000,
    salesLastYear: 3200000,
    quota: 250000,
    quotaAchievement: 114.0,
    clients: 45,
    status: "Activo",
    manager: "Carlos Martínez"
  },
  {
    id: "SALES-002",
    name: "Patricia López Hernández",
    region: "Centro",
    territory: "CDMX - Zona Norte",
    salesLastMonth: 420000,
    salesLast3Months: 1250000,
    salesLastYear: 4850000,
    quota: 400000,
    quotaAchievement: 105.0,
    clients: 68,
    status: "Activo",
    manager: "Laura Mendoza"
  },
  {
    id: "SALES-003",
    name: "Fernando Ramírez Torres",
    region: "Norte",
    territory: "Monterrey y Zona Metropolitana",
    salesLastMonth: 380000,
    salesLast3Months: 1120000,
    salesLastYear: 4280000,
    quota: 350000,
    quotaAchievement: 108.6,
    clients: 52,
    status: "Activo",
    manager: "Ricardo Flores"
  },
  {
    id: "SALES-004",
    name: "María Elena Silva",
    region: "Bajío",
    territory: "Querétaro y Guanajuato",
    salesLastMonth: 295000,
    salesLast3Months: 875000,
    salesLastYear: 3350000,
    quota: 280000,
    quotaAchievement: 105.4,
    clients: 38,
    status: "Activo",
    manager: "Alejandra Moreno"
  },
  {
    id: "SALES-005",
    name: "Luis Fernando Gómez",
    region: "Centro",
    territory: "CDMX - Zona Sur",
    salesLastMonth: 395000,
    salesLast3Months: 1180000,
    salesLastYear: 4520000,
    quota: 380000,
    quotaAchievement: 103.9,
    clients: 55,
    status: "Activo",
    manager: "Laura Mendoza"
  },
  {
    id: "SALES-006",
    name: "Ana Patricia Vázquez",
    region: "Centro",
    territory: "Puebla y Tlaxcala",
    salesLastMonth: 210000,
    salesLast3Months: 625000,
    salesLastYear: 2400000,
    quota: 220000,
    quotaAchievement: 95.5,
    clients: 32,
    status: "Activo",
    manager: "Andrea Jiménez"
  },
  {
    id: "SALES-007",
    name: "Carmen Rosa Delgado",
    region: "Sureste",
    territory: "Yucatán, Campeche y Quintana Roo",
    salesLastMonth: 235000,
    salesLast3Months: 695000,
    salesLastYear: 2680000,
    quota: 230000,
    quotaAchievement: 102.2,
    clients: 28,
    status: "Activo",
    manager: "Carmen Aguilar"
  },
  {
    id: "SALES-008",
    name: "Juan Carlos Morales",
    region: "Norte",
    territory: "Chihuahua y Sonora",
    salesLastMonth: 195000,
    salesLast3Months: 580000,
    salesLastYear: 2250000,
    quota: 200000,
    quotaAchievement: 97.5,
    clients: 25,
    status: "Activo",
    manager: "Ricardo Flores"
  },
  {
    id: "SALES-009",
    name: "Guadalupe Martínez",
    region: "Occidente",
    territory: "Jalisco - Zona Costa",
    salesLastMonth: 145000,
    salesLast3Months: 425000,
    salesLastYear: 1620000,
    quota: 150000,
    quotaAchievement: 96.7,
    clients: 22,
    status: "Activo",
    manager: "Carlos Martínez"
  },
  {
    id: "SALES-010",
    name: "Jorge Luis Herrera",
    region: "Bajío",
    territory: "Aguascalientes y Zacatecas",
    salesLastMonth: 175000,
    salesLast3Months: 520000,
    salesLastYear: 1980000,
    quota: 180000,
    quotaAchievement: 97.2,
    clients: 20,
    status: "En Capacitación",
    manager: "Alejandra Moreno"
  }
];

export const SALES_CHANNELS: SalesChannel[] = [
  {
    id: "CHANNEL-001",
    name: "Tiendas Físicas Propias",
    type: "Retail",
    salesLastMonth: 1850000,
    salesLast3Months: 5480000,
    salesLastYear: 21000000,
    clients: 0, // walk-in customers
    margin: 42.5,
    status: "Activo"
  },
  {
    id: "CHANNEL-002",
    name: "Distribuidores Mayoristas",
    type: "Mayoreo",
    salesLastMonth: 2850000,
    salesLast3Months: 8450000,
    salesLastYear: 32500000,
    clients: 85,
    margin: 28.0,
    status: "Activo"
  },
  {
    id: "CHANNEL-003",
    name: "Tienda Online",
    type: "Online",
    salesLastMonth: 1250000,
    salesLast3Months: 3750000,
    salesLastYear: 14500000,
    clients: 12500,
    margin: 48.0,
    status: "Activo"
  },
  {
    id: "CHANNEL-004",
    name: "Red de Distribuidores Autorizados",
    type: "Distribuidor",
    salesLastMonth: 1950000,
    salesLast3Months: 5800000,
    salesLastYear: 22500000,
    clients: 245,
    margin: 32.5,
    status: "Activo"
  },
  {
    id: "CHANNEL-005",
    name: "Ventas Institucionales y Gobierno",
    type: "Institucional",
    salesLastMonth: 950000,
    salesLast3Months: 2850000,
    salesLastYear: 11200000,
    clients: 45,
    margin: 35.0,
    status: "Activo"
  },
  {
    id: "CHANNEL-006",
    name: "Exportación",
    type: "Mayoreo",
    salesLastMonth: 420000,
    salesLast3Months: 1250000,
    salesLastYear: 4800000,
    clients: 12,
    margin: 25.0,
    status: "Activo"
  }
];

// ============================================================================
// HUMAN RESOURCES - Employees, Departments, Salaries
// ============================================================================

export type Employee = {
  id: string;
  name: string;
  department: string;
  position: string;
  location: string;
  hireDate: string;
  salary: number;
  performance: number; // 1-5 rating
  status: "Activo" | "Licencia" | "Vacaciones" | "Baja";
  manager: string;
};

export type Department = {
  id: string;
  name: string;
  employees: number;
  budget: number; // monthly
  location: string;
  manager: string;
  status: "Activo" | "Reestructuración" | "Fusión";
};

export const DEPARTMENTS: Department[] = [
  {
    id: "DEPT-001",
    name: "Manufactura",
    employees: 156,
    budget: 2850000,
    location: "Planta Guadalajara, Planta Querétaro, Planta Monterrey, Planta Puebla",
    manager: "Ing. José Ramón Pérez",
    status: "Activo"
  },
  {
    id: "DEPT-002",
    name: "Logística y Distribución",
    employees: 48,
    budget: 1250000,
    location: "Centros de Distribución Nacional",
    manager: "Lic. Francisco Javier López",
    status: "Activo"
  },
  {
    id: "DEPT-003",
    name: "Ventas",
    employees: 35,
    budget: 1850000,
    location: "Oficinas Regionales",
    manager: "Lic. Carlos Martínez",
    status: "Activo"
  },
  {
    id: "DEPT-004",
    name: "Recursos Humanos",
    employees: 12,
    budget: 450000,
    location: "Oficina Corporativa Guadalajara",
    manager: "Lic. María González",
    status: "Activo"
  },
  {
    id: "DEPT-005",
    name: "Tecnología e Informática",
    employees: 28,
    budget: 980000,
    location: "Oficina Corporativa Guadalajara",
    manager: "Ing. Diego Vargas",
    status: "Activo"
  },
  {
    id: "DEPT-006",
    name: "Finanzas y Contabilidad",
    employees: 18,
    budget: 650000,
    location: "Oficina Corporativa Guadalajara",
    manager: "CPA Sofía Herrera",
    status: "Activo"
  },
  {
    id: "DEPT-007",
    name: "Calidad y Control",
    employees: 22,
    budget: 720000,
    location: "Planta Guadalajara",
    manager: "Ing. Roberto Carlos Medina",
    status: "Activo"
  },
  {
    id: "DEPT-008",
    name: "Marketing y Comunicación",
    employees: 15,
    budget: 580000,
    location: "Oficina Corporativa Guadalajara",
    manager: "Lic. Laura Mendoza",
    status: "Activo"
  }
];

export const EMPLOYEES: Employee[] = [
  // Manufacturing
  {
    id: "EMP-001",
    name: "José Ramón Pérez",
    department: "Manufactura",
    position: "Gerente de Producción",
    location: "Planta Guadalajara",
    hireDate: "2018-03-15",
    salary: 85000,
    performance: 4.8,
    status: "Activo",
    manager: "Director General"
  },
  {
    id: "EMP-002",
    name: "María Elena Silva",
    department: "Manufactura",
    position: "Supervisora de Línea",
    location: "Planta Guadalajara",
    hireDate: "2019-06-20",
    salary: 32000,
    performance: 4.5,
    status: "Activo",
    manager: "José Ramón Pérez"
  },
  {
    id: "EMP-003",
    name: "Luis Fernando Gómez",
    department: "Manufactura",
    position: "Operador de Máquina",
    location: "Planta Guadalajara",
    hireDate: "2020-08-10",
    salary: 18500,
    performance: 4.2,
    status: "Activo",
    manager: "María Elena Silva"
  },
  
  // Logistics
  {
    id: "EMP-004",
    name: "Francisco Javier López",
    department: "Logística y Distribución",
    position: "Gerente de Logística",
    location: "Almacén Central Guadalajara",
    hireDate: "2018-11-05",
    salary: 72000,
    performance: 4.7,
    status: "Activo",
    manager: "Director General"
  },
  {
    id: "EMP-005",
    name: "Lucía Estela Ramírez",
    department: "Logística y Distribución",
    position: "Coordinadora de Almacén",
    location: "Almacén Distribución CDMX",
    hireDate: "2019-02-18",
    salary: 28000,
    performance: 4.4,
    status: "Activo",
    manager: "Francisco Javier López"
  },
  
  // Sales
  {
    id: "EMP-006",
    name: "Carlos Martínez",
    department: "Ventas",
    position: "Gerente Regional Occidente",
    location: "Oficina Guadalajara",
    hireDate: "2017-09-20",
    salary: 65000,
    performance: 4.9,
    status: "Activo",
    manager: "Director de Ventas"
  },
  {
    id: "EMP-007",
    name: "Roberto Sánchez García",
    department: "Ventas",
    position: "Ejecutivo de Ventas",
    location: "Territorio Jalisco",
    hireDate: "2020-01-15",
    salary: 25000,
    performance: 4.6,
    status: "Activo",
    manager: "Carlos Martínez"
  },
  
  // HR
  {
    id: "EMP-008",
    name: "María González",
    department: "Recursos Humanos",
    position: "Gerente de RH",
    location: "Oficina Corporativa",
    hireDate: "2018-05-12",
    salary: 58000,
    performance: 4.5,
    status: "Activo",
    manager: "Director General"
  },
  {
    id: "EMP-009",
    name: "Patricia López",
    department: "Recursos Humanos",
    position: "Especialista en Reclutamiento",
    location: "Oficina Corporativa",
    hireDate: "2021-03-08",
    salary: 24000,
    performance: 4.3,
    status: "Activo",
    manager: "María González"
  },
  
  // IT
  {
    id: "EMP-010",
    name: "Diego Vargas",
    department: "Tecnología e Informática",
    position: "Gerente de TI",
    location: "Oficina Corporativa",
    hireDate: "2018-07-22",
    salary: 75000,
    performance: 4.7,
    status: "Activo",
    manager: "Director General"
  },
  
  // Quality
  {
    id: "EMP-011",
    name: "Roberto Carlos Medina",
    department: "Calidad y Control",
    position: "Gerente de Calidad",
    location: "Planta Guadalajara",
    hireDate: "2019-01-10",
    salary: 62000,
    performance: 4.6,
    status: "Activo",
    manager: "Director General"
  },
  
  // Finance
  {
    id: "EMP-012",
    name: "Sofía Herrera",
    department: "Finanzas y Contabilidad",
    position: "Gerente Financiero",
    location: "Oficina Corporativa",
    hireDate: "2017-11-30",
    salary: 78000,
    performance: 4.8,
    status: "Activo",
    manager: "Director General"
  },
  
  // Marketing
  {
    id: "EMP-013",
    name: "Laura Mendoza",
    department: "Marketing y Comunicación",
    position: "Gerente de Marketing",
    location: "Oficina Corporativa",
    hireDate: "2019-04-15",
    salary: 68000,
    performance: 4.5,
    status: "Activo",
    manager: "Director General"
  }
];

// ============================================================================
// PRODUCTS (Combined Retail + Manufactured)
// ============================================================================

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unitsSold: number;
  revenue: number;
  stock: number;
  supplier: string;
  type: "Manufacturado" | "Comprado" | "Servicio";
};

export const PRODUCTS: Product[] = [
  // Manufactured Products
  ...MANUFACTURED_PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    unitsSold: p.unitsSold,
    revenue: p.revenue,
    stock: p.stock,
    supplier: "Producción Interna",
    type: "Manufacturado" as const
  })),
  
  // Purchased Products
  {
    id: "PROD-009",
    name: "Materia Prima: Plástico ABS",
    category: "Materia Prima",
    price: 850,
    unitsSold: 0,
    revenue: 0,
    stock: 45000, // kg
    supplier: "Plásticos del Bajío SA",
    type: "Comprado"
  },
  {
    id: "PROD-010",
    name: "Materia Prima: Circuito Integrado MCU",
    category: "Materia Prima",
    price: 125,
    unitsSold: 0,
    revenue: 0,
    stock: 12000,
    supplier: "Electrónica Global MX",
    type: "Comprado"
  },
  {
    id: "PROD-011",
    name: "Servicio de Mantenimiento Mensual",
    category: "Servicios",
    price: 3500,
    unitsSold: 125,
    revenue: 437500,
    stock: 0,
    supplier: "Mantenimiento Interno",
    type: "Servicio"
  },
  {
    id: "PROD-012",
    name: "Consultoría en Optimización",
    category: "Servicios",
    price: 8500,
    unitsSold: 42,
    revenue: 357000,
    stock: 0,
    supplier: "Consultoría Interna",
    type: "Servicio"
  }
];

// ============================================================================
// SALES BY STATE (Aggregated)
// ============================================================================

export type SalesByState = {
  state: string;
  region: string;
  salesLastMonth: number;
  salesLast3Months: number;
  salesLastYear: number;
  growth: number;
  pointsOfSale: number;
};

export const SALES_BY_STATE: SalesByState[] = [
  {
    state: "Ciudad de México",
    region: "Centro",
    salesLastMonth: 702000,
    salesLast3Months: 2085000,
    salesLastYear: 7920000,
    growth: 18.5,
    pointsOfSale: 5
  },
  {
    state: "Nuevo León",
    region: "Norte",
    salesLastMonth: 425000,
    salesLast3Months: 1255000,
    salesLastYear: 4850000,
    growth: 22.3,
    pointsOfSale: 3
  },
  {
    state: "Jalisco",
    region: "Occidente",
    salesLastMonth: 449600,
    salesLast3Months: 1332800,
    salesLastYear: 4820000,
    growth: 15.7,
    pointsOfSale: 6
  },
  {
    state: "Querétaro",
    region: "Bajío",
    salesLastMonth: 193000,
    salesLast3Months: 580000,
    salesLastYear: 2240000,
    growth: 28.4,
    pointsOfSale: 2
  },
  {
    state: "Puebla",
    region: "Centro",
    salesLastMonth: 204000,
    salesLast3Months: 610000,
    salesLastYear: 2360000,
    growth: 16.2,
    pointsOfSale: 2
  },
  {
    state: "Guanajuato",
    region: "Bajío",
    salesLastMonth: 150000,
    salesLast3Months: 448000,
    salesLastYear: 1730000,
    growth: 12.8,
    pointsOfSale: 2
  },
  {
    state: "Yucatán",
    region: "Sureste",
    salesLastMonth: 213000,
    salesLast3Months: 632000,
    salesLastYear: 2450000,
    growth: 19.6,
    pointsOfSale: 2
  },
  {
    state: "Aguascalientes",
    region: "Bajío",
    salesLastMonth: 89000,
    salesLast3Months: 268000,
    salesLastYear: 1030000,
    growth: 14.2,
    pointsOfSale: 1
  },
  {
    state: "Sonora",
    region: "Norte",
    salesLastMonth: 102000,
    salesLast3Months: 305000,
    salesLastYear: 1180000,
    growth: 16.8,
    pointsOfSale: 1
  },
  {
    state: "Chihuahua",
    region: "Norte",
    salesLastMonth: 115000,
    salesLast3Months: 342000,
    salesLastYear: 1320000,
    growth: 18.3,
    pointsOfSale: 1
  }
];

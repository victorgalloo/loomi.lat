"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Database,
  Zap,
  Shield,
  Layers,
  Clock,
  Cloud,
  Code,
  ChevronRight,
  CheckCircle,
  Sparkles,
  Users,
  BarChart3,
  GitBranch,
  Cpu,
} from "lucide-react";

// Databricks color palette
const db = {
  red: "#FF3621",
  orange: "#FF6B35",
};

// Hero Animation Component - Light Mode
function HeroAnimation() {
  return (
    <div className="relative w-full aspect-[16/9] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-14 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1.5 shadow-sm">
          <Image src="/logos/databricks.svg" alt="Databricks" width={18} height={18} />
        </div>
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            className="w-8 h-8 rounded-lg bg-gray-200"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="absolute left-14 top-0 right-0 bottom-0 p-5">
        {/* Top Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 font-medium">Workspace</span>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "30%" }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="h-1.5 rounded-full"
            style={{ background: `linear-gradient(90deg, ${db.red}40, transparent)` }}
          />
        </div>

        {/* Split View */}
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-50px)]">
          {/* Code Editor */}
          <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 ml-2">pipeline.py</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {[
                { delay: 0.8, content: <><span className="text-purple-400">import</span><span className="text-gray-300 ml-2">dlt</span></> },
                { delay: 1, content: <><span className="text-purple-400">from</span><span className="text-gray-300 ml-2">pyspark.sql</span><span className="text-purple-400 ml-2">import</span><span className="text-gray-300 ml-2">*</span></> },
                { delay: 1.2, content: <span className="text-gray-600"># Transform data</span> },
                { delay: 1.4, content: <span className="text-yellow-400">@dlt.table</span> },
                { delay: 1.6, content: <><span className="text-blue-400">def</span><span className="text-green-400 ml-2">silver_customers</span><span className="text-gray-400">():</span></> },
                { delay: 1.8, content: <span className="text-gray-400 ml-4">return spark.read.table</span> },
              ].map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: line.delay }}
                >
                  {line.content}
                </motion.div>
              ))}
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-3 bg-white/80 ml-4 mt-1"
              />
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">Pipeline Status</span>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-100"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-green-700 font-medium">Running</span>
              </motion.div>
            </div>

            {/* Mini Chart */}
            <div className="h-16 flex items-end gap-1 mb-3">
              {[35, 55, 40, 70, 50, 80, 60, 75, 55, 65].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, delay: 2 + i * 0.08 }}
                  className="flex-1 rounded-t"
                  style={{ background: `linear-gradient(to top, ${db.red}, ${db.orange})` }}
                />
              ))}
            </div>

            {/* Data Rows */}
            <div className="space-y-1.5">
              {[
                { label: "bronze.raw", count: "2.4M", done: true },
                { label: "silver.clean", count: "847K", done: true },
                { label: "gold.analytics", count: "—", done: false },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3 + i * 0.15 }}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${row.done ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-xs text-gray-600">{row.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{row.count}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lakehouse Animation Component
function LakehouseAnimation() {
  const layers = [
    { 
      name: "Bronze", 
      subtitle: "Raw Data",
      color: "#CD7F32",
      items: ["JSON", "CSV", "Parquet", "Logs"],
    },
    { 
      name: "Silver", 
      subtitle: "Cleaned & Enriched",
      color: "#A8A8A8",
      items: ["Validated", "Deduplicated", "Joined"],
    },
    { 
      name: "Gold", 
      subtitle: "Business-Ready",
      color: "#FFD700",
      items: ["Aggregated", "ML Features", "Analytics"],
    },
  ];

  return (
    <div className="space-y-4">
      {layers.map((layer, index) => (
        <motion.div
          key={layer.name}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
        >
          <div 
            className="relative rounded-xl p-5 border overflow-hidden"
            style={{ 
              borderColor: `${layer.color}50`,
              background: `linear-gradient(135deg, ${layer.color}08, white)`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="font-semibold text-gray-900">{layer.name}</span>
                <span className="text-sm text-gray-500">{layer.subtitle}</span>
              </div>
              <span 
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${layer.color}20`, color: layer.color === "#FFD700" ? "#B8860B" : layer.color }}
              >
                Layer {index + 1}
              </span>
            </div>

            {/* Data Items */}
            <div className="flex flex-wrap gap-2">
              {layer.items.map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.2 + i * 0.1 }}
                  className="px-3 py-1.5 rounded-lg bg-white text-xs text-gray-600 border border-gray-200 shadow-sm"
                >
                  {item}
                </motion.span>
              ))}
            </div>

            {/* Progress Line */}
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
              className="absolute bottom-0 left-0 h-1"
              style={{ background: `linear-gradient(90deg, ${layer.color}, transparent)` }}
            />
          </div>

          {/* Arrow */}
          {index < layers.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 + 0.4 }}
              className="flex justify-center py-2"
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function DatabricksLanding() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  const useCases = [
    {
      id: "ai",
      label: "AI",
      title: "Inteligencia Artificial",
      description: "Desarrolla y despliega modelos de IA y LLMs sobre tus datos privados. Fine-tuning seguro, RAG con vector search integrado, y endpoints optimizados para inferencia en producción.",
      features: ["Fine-tuning de LLMs", "Vector Search", "Model Serving", "RAG Applications"],
      stat: "Datos 100% privados",
      image: "/images/db-ai.png",
    },
    {
      id: "governance",
      label: "Governance",
      title: "Gobernanza Unificada",
      description: "Unity Catalog proporciona gobernanza centralizada para todos tus datos, analytics e IA. Control de acceso granular, linaje automático y cumplimiento regulatorio.",
      features: ["Unity Catalog", "Control de Acceso", "Linaje de Datos", "Auditoría Completa"],
      stat: "1 modelo de permisos",
      image: "/images/db-governance.png",
    },
    {
      id: "warehousing",
      label: "Warehousing",
      title: "Data Warehousing",
      description: "SQL Warehouses serverless con rendimiento 12x superior. Ejecución de queries optimizada con Photon, escalado automático y conexión directa con tus herramientas de BI favoritas.",
      features: ["SQL Serverless", "Photon Engine", "BI Integrations", "Auto-scaling"],
      stat: "12× mejor rendimiento",
      image: "/images/db-warehousing.png",
    },
    {
      id: "etl",
      label: "ETL",
      title: "ETL & Data Engineering",
      description: "Construye pipelines de datos confiables con Delta Live Tables. Define tu lógica de forma declarativa y Databricks se encarga del resto: calidad, errores y orquestación.",
      features: ["Delta Live Tables", "Streaming & Batch", "Data Quality", "Auto-recovery"],
      stat: "85% menos código",
      image: "/images/db-etl.png",
    },
    {
      id: "sharing",
      label: "Data sharing",
      title: "Compartir Datos",
      description: "Delta Sharing permite compartir datos de forma segura y abierta sin copiar ni mover datos. Compatible con cualquier plataforma, sin formatos propietarios.",
      features: ["Delta Sharing", "Zero-copy", "Cross-platform", "Marketplace"],
      stat: "Sin replicación",
      image: "/images/db-datasharing.png",
    },
    {
      id: "orchestration",
      label: "Orchestration",
      title: "Orquestación",
      description: "Workflows inteligentes que optimizan la ejecución de pipelines según tus deadlines y presupuesto. Selección automática de compute y recuperación de errores.",
      features: ["Workflows", "Job Scheduling", "Auto-remediation", "Cost Optimization"],
      stat: "Pipelines inteligentes",
      image: "/images/db-orchestration.png",
    },
  ];

  const platformFeatures = [
    {
      id: "workspace",
      title: "Workspace Colaborativo",
      description: "Un entorno unificado donde científicos de datos, ingenieros y analistas trabajan juntos.",
      icon: Users,
    },
    {
      id: "catalog",
      title: "Unity Catalog",
      description: "Gobernanza unificada para todos tus datos y activos de IA.",
      icon: Database,
    },
    {
      id: "sql",
      title: "SQL Warehouse",
      description: "Ejecuta consultas SQL a velocidad increíble con warehouses serverless.",
      icon: BarChart3,
    },
    {
      id: "workflows",
      title: "Workflows & Jobs",
      description: "Orquesta pipelines de datos complejos con facilidad.",
      icon: GitBranch,
    },
    {
      id: "mlflow",
      title: "MLflow & Model Serving",
      description: "Gestiona el ciclo de vida completo de ML.",
      icon: Cpu,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">anthana.agency</span>
            </Link>
            <div className="flex items-center gap-2">
              <Image
                src="/logos/databricks.svg"
                alt="Databricks"
                width={20}
                height={20}
              />
              <span className="text-sm text-gray-500">Partner</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 mb-6"
              >
                <Image src="/logos/databricks.svg" alt="Databricks" width={16} height={16} />
                <span className="text-xs font-medium text-gray-600">Data Intelligence Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight"
              >
                La Plataforma de{" "}
                <span style={{ color: db.red }}>Inteligencia de Datos</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 mb-8 leading-relaxed"
              >
                Databricks unifica todos tus datos, analytics e IA en una sola plataforma. 
                Desde data engineering hasta machine learning.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-full transition-all hover:opacity-90"
                  style={{ backgroundColor: db.red }}
                >
                  Implementar Databricks
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#tour"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Ver Tour
                </a>
              </motion.div>
            </div>

            {/* Right - Animation */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:block"
            >
              <HeroAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Databricks - Bento Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2">¿Por qué Databricks?</h2>
            <p className="text-gray-600">La plataforma líder mundial para data, analytics e IA.</p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* Large Card - Speed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-12 lg:col-span-8 p-8 bg-white rounded-2xl border border-gray-200"
            >
              <span 
                className="text-7xl lg:text-8xl font-black"
                style={{ color: db.red }}
              >
                12×
              </span>
              <h3 className="text-2xl font-bold mt-2 mb-2">Más Rápido</h3>
              <p className="text-gray-600 max-w-md">
                Apache Spark optimizado con Photon Engine. Procesamiento hasta 12x superior que Spark tradicional.
              </p>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 p-6 bg-white rounded-2xl border border-gray-200"
            >
              <Shield className="w-10 h-10 mb-4" style={{ color: db.red }} />
              <h3 className="font-semibold text-lg mb-2">Seguridad Enterprise</h3>
              <p className="text-sm text-gray-600">SOC 2, HIPAA, GDPR. Encriptación end-to-end y RBAC.</p>
            </motion.div>

            {/* Lakehouse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 p-6 bg-white rounded-2xl border border-gray-200"
            >
              <Layers className="w-10 h-10 mb-4" style={{ color: db.orange }} />
              <h3 className="font-semibold text-lg mb-2">Lakehouse Unificado</h3>
              <p className="text-sm text-gray-600">Lo mejor de data lakes y warehouses en una plataforma.</p>
            </motion.div>

            {/* Real-time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 p-6 bg-white rounded-2xl border border-gray-200"
            >
              <Clock className="w-10 h-10 mb-4" style={{ color: db.red }} />
              <h3 className="font-semibold text-lg mb-2">Tiempo Real</h3>
              <p className="text-sm text-gray-600">Streaming y batch unificados con Delta Live Tables.</p>
            </motion.div>

            {/* Multi-cloud + Open Source - Wide Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 p-6 bg-white rounded-2xl border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="w-10 h-10" style={{ color: db.orange }} />
                <span className="text-gray-300 text-2xl">+</span>
                <Code className="w-10 h-10" style={{ color: db.red }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Multi-Cloud & Open</h3>
              <p className="text-sm text-gray-600">AWS, Azure, GCP. Construido sobre Apache Spark y Delta Lake.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Tour */}
      <section id="tour" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span 
              className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: `${db.red}15`, color: db.red }}
            >
              Tour de la Plataforma
            </span>
            <h2 className="text-3xl font-bold mb-2">Conoce Databricks por Dentro</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Explora las capacidades que hacen de Databricks la plataforma más poderosa del mercado.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature List */}
            <div className="space-y-2">
              {platformFeatures.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isActive 
                        ? "bg-gray-100 border-l-4" 
                        : "hover:bg-gray-50"
                    }`}
                    style={{ borderColor: isActive ? db.red : "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" style={{ color: isActive ? db.red : "#6B7280" }} />
                      <div>
                        <h4 className={`font-medium ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                          {feature.title}
                        </h4>
                        {isActive && (
                          <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Image */}
            <div className="lg:col-span-2">
              <Image
                src="/images/db-platform.png"
                alt="Databricks Platform"
                width={700}
                height={450}
                className="rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lakehouse Architecture */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Arquitectura <span style={{ color: db.red }}>Lakehouse</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                El Lakehouse combina la flexibilidad de un data lake con el rendimiento 
                de un data warehouse. Una sola arquitectura para todos tus casos de uso.
              </p>
              
              <div className="space-y-3">
                {[
                  "Almacenamiento en formato abierto (Delta Lake, Parquet)",
                  "Transacciones ACID para datos confiables",
                  "Time travel y versionado de datos",
                  "Streaming y batch unificados",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: db.red }} />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div>
              <LakehouseAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-2">Unifica todos tus datos + AI</h2>
            <p className="text-gray-600">Una plataforma para todos tus casos de uso.</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {useCases.map((useCase, index) => (
              <button
                key={useCase.id}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === index
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={activeTab === index ? { backgroundColor: db.red } : {}}
              >
                {useCase.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="text-2xl font-bold mb-4">{useCases[activeTab].title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {useCases[activeTab].description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {useCases[activeTab].features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: `${db.red}15` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: db.red }} />
                <span className="text-sm font-medium" style={{ color: db.red }}>
                  {useCases[activeTab].stat}
                </span>
              </div>
            </div>

            <div>
              <Image
                src={useCases[activeTab].image}
                alt={useCases[activeTab].title}
                width={550}
                height={400}
                className="rounded-xl shadow-md"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-xl font-bold">anthana.agency</span>
            <span className="text-gray-400">×</span>
            <Image src="/logos/databricks.svg" alt="Databricks" width={100} height={24} />
          </div>

          <h2 className="text-3xl font-bold mb-4">
            Implementamos Databricks <span style={{ color: db.red }}>Para Tu Empresa</span>
          </h2>

          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            No solo recomendamos Databricks, lo implementamos. Desde la migración de datos hasta 
            la configuración de workflows de ML.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-full transition-all hover:opacity-90"
              style={{ backgroundColor: db.red }}
            >
              Agendar Consultoría
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} anthana.agency. Databricks Partner.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Powered by</span>
              <Image src="/logos/databricks.svg" alt="Databricks" width={70} height={18} />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

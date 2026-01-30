"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PortalCard, StatusBadge } from "./shared";

interface Client {
  id: string;
  name: string;
  created_at: string;
  process_status: string | null;
}

interface AdminDashboardProps {
  clients: Client[];
}

export default function AdminDashboard({ clients }: AdminDashboardProps) {
  // Calculate stats
  const totalClients = clients.length;
  const activeProjects = clients.filter(c => c.process_status === "inicio_de_proyecto").length;
  const pendingProposals = clients.filter(c => 
    c.process_status === "pendiente_de_propuesta" || 
    c.process_status === "revisando_propuesta"
  ).length;
  const pendingContracts = clients.filter(c => 
    c.process_status === "pendiente_de_contrato" || 
    c.process_status === "firma_de_contrato"
  ).length;

  const stats = [
    {
      label: "Total Clientes",
      value: totalClients,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Proyectos Activos",
      value: activeProjects,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Propuestas Pendientes",
      value: pendingProposals,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Contratos en Proceso",
      value: pendingContracts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen general de tus clientes y proyectos</p>
        </div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF3621] text-white font-semibold shadow-lg shadow-[#FF3621]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Cliente
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <PortalCard>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </PortalCard>
          </motion.div>
        ))}
      </div>

      {/* Recent Clients */}
      <PortalCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Clientes Recientes</h2>
          <Link
            href="/dashboard/clients"
            className="text-sm font-medium text-[#FF3621] hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No hay clientes registrados aún</p>
            <Link
              href="/dashboard/clients"
              className="inline-block mt-4 text-sm font-medium text-[#FF3621] hover:underline"
            >
              Agregar primer cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 5).map((client) => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3621] to-[#FF6B35] flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={client.process_status || "pendiente_de_propuesta"} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/dashboard/clients?edit=${client.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#FF3621] hover:underline"
                      >
                        Ver detalles
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalCard>
    </div>
  );
}



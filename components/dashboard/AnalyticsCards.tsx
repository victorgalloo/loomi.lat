'use client';

import { motion } from 'framer-motion';
import { Users, MessageCircle, Mail, Calendar, TrendingUp, Target } from 'lucide-react';

interface AnalyticsData {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalConversations: number;
  messagesThisMonth: number;
  appointmentsBooked: number;
  qualifiedLeads: number;
  responseRate: number;
  stageBreakdown: Record<string, number>;
}

interface AnalyticsCardsProps {
  data: AnalyticsData;
}

export default function AnalyticsCards({ data }: AnalyticsCardsProps) {
  const mainMetrics = [
    {
      label: 'Total Leads',
      value: data.totalLeads,
      change: data.newLeadsThisMonth,
      changeLabel: 'este mes',
      icon: Users,
      color: 'cyan',
      gradient: 'from-cyan-50 to-cyan-100/50'
    },
    {
      label: 'Conversaciones',
      value: data.totalConversations,
      icon: MessageCircle,
      color: 'emerald',
      gradient: 'from-emerald-50 to-emerald-100/50'
    },
    {
      label: 'Mensajes este mes',
      value: data.messagesThisMonth,
      icon: Mail,
      color: 'purple',
      gradient: 'from-purple-50 to-purple-100/50'
    },
    {
      label: 'Citas agendadas',
      value: data.appointmentsBooked,
      icon: Calendar,
      color: 'amber',
      gradient: 'from-amber-50 to-amber-100/50'
    }
  ];

  const colorClasses: Record<string, { icon: string; text: string; bg: string; border: string }> = {
    cyan: {
      icon: 'text-cyan-600',
      text: 'text-cyan-700',
      bg: 'bg-cyan-100',
      border: 'border-cyan-200'
    },
    emerald: {
      icon: 'text-emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200'
    },
    purple: {
      icon: 'text-purple-600',
      text: 'text-purple-700',
      bg: 'bg-purple-100',
      border: 'border-purple-200'
    },
    amber: {
      icon: 'text-amber-600',
      text: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    }
  };

  const stageLabels: Record<string, string> = {
    initial: 'Nuevos',
    qualified: 'Calificados',
    demo_scheduled: 'Demo agendada',
    demo_completed: 'Demo completada',
    payment_pending: 'Pago pendiente',
    customer: 'Clientes',
    cold: 'Frios'
  };

  const stageColors = ['bg-emerald-500', 'bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-blue-500', 'bg-orange-500'];

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => {
          const colors = colorClasses[metric.color];
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <div className={`w-10 h-10 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${colors.text}`}>
                  {metric.value.toLocaleString()}
                </p>
                {metric.change !== undefined && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{metric.change} {metric.changeLabel}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Quality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Calidad de leads
          </h3>
          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Leads calificados</span>
                <span className="font-medium text-gray-900">{data.qualifiedLeads} / {data.totalLeads}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.totalLeads > 0 ? (data.qualifiedLeads / data.totalLeads) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tasa de respuesta</span>
                <span className="font-medium text-gray-900">{data.responseRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.responseRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stage Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Leads por etapa
          </h3>
          <div className="space-y-4">
            {Object.entries(data.stageBreakdown).length > 0 ? (
              Object.entries(data.stageBreakdown).map(([stage, count], index) => {
                const colorClass = stageColors[index % stageColors.length];
                const percentage = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0;

                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <span className="text-sm text-gray-600 w-32 truncate">{stageLabels[stage] || stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${colorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No hay datos de etapas disponibles</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useTheme } from '@/components/dashboard/ThemeProvider';
import { Users, MessageCircle, Mail, Calendar, TrendingUp, Target, BarChart3 } from 'lucide-react';

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

interface AnalyticsViewProps {
  data: AnalyticsData;
}

export default function AnalyticsView({ data }: AnalyticsViewProps) {
  const { isDark } = useTheme();

  const mainMetrics = [
    {
      label: 'Total Leads',
      value: data.totalLeads,
      change: data.newLeadsThisMonth,
      changeLabel: 'este mes',
      icon: Users,
      color: 'cyan',
    },
    {
      label: 'Conversaciones',
      value: data.totalConversations,
      icon: MessageCircle,
      color: 'emerald',
    },
    {
      label: 'Mensajes',
      value: data.messagesThisMonth,
      subLabel: 'este mes',
      icon: Mail,
      color: 'purple',
    },
    {
      label: 'Citas',
      value: data.appointmentsBooked,
      icon: Calendar,
      color: 'amber',
    }
  ];

  const colorClasses: Record<string, { icon: string; text: string; bg: string; darkBg: string; darkText: string }> = {
    cyan: {
      icon: isDark ? 'text-cyan-400' : 'text-cyan-600',
      text: 'text-cyan-700',
      bg: 'bg-cyan-100',
      darkBg: 'bg-cyan-500/10',
      darkText: 'text-cyan-400',
    },
    emerald: {
      icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-100',
      darkBg: 'bg-emerald-500/10',
      darkText: 'text-emerald-400',
    },
    purple: {
      icon: isDark ? 'text-purple-400' : 'text-purple-600',
      text: 'text-purple-700',
      bg: 'bg-purple-100',
      darkBg: 'bg-purple-500/10',
      darkText: 'text-purple-400',
    },
    amber: {
      icon: isDark ? 'text-amber-400' : 'text-amber-600',
      text: 'text-amber-700',
      bg: 'bg-amber-100',
      darkBg: 'bg-amber-500/10',
      darkText: 'text-amber-400',
    }
  };

  const stageLabels: Record<string, string> = {
    initial: 'Nuevos',
    Nuevo: 'Nuevos',
    qualified: 'Calificados',
    Calificado: 'Calificados',
    Contactado: 'Contactados',
    demo_scheduled: 'Demo agendada',
    'Demo Agendada': 'Demo agendada',
    demo_completed: 'Demo completada',
    Propuesta: 'Propuesta',
    Negociacion: 'Negociacion',
    payment_pending: 'Pago pendiente',
    customer: 'Clientes',
    Ganado: 'Ganados',
    Perdido: 'Perdidos',
    cold: 'Frios'
  };

  const stageColors = [
    isDark ? 'bg-cyan-500' : 'bg-cyan-500',
    isDark ? 'bg-amber-500' : 'bg-amber-500',
    isDark ? 'bg-purple-500' : 'bg-purple-500',
    isDark ? 'bg-indigo-500' : 'bg-indigo-500',
    isDark ? 'bg-blue-500' : 'bg-blue-500',
    isDark ? 'bg-emerald-500' : 'bg-emerald-500',
    isDark ? 'bg-red-500' : 'bg-red-500',
  ];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Analiticas
          </h1>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`flex items-center gap-8 pb-6 mb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Total Leads
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {data.totalLeads}
          </p>
        </div>

        <div className={`w-px h-8 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Calificados
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {data.qualifiedLeads}
          </p>
        </div>

        <div className={`w-px h-8 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Tasa Respuesta
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {data.responseRate}%
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainMetrics.map((metric) => {
          const colors = colorClasses[metric.color];
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`
                rounded-xl p-5 transition-colors
                ${isDark
                  ? 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border border-zinc-200 hover:border-zinc-300'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {metric.label}
                </p>
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? colors.darkBg : colors.bg}
                `}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
              </div>
              <p className={`text-2xl font-semibold font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {metric.value.toLocaleString()}
              </p>
              {metric.change !== undefined && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <TrendingUp className="w-3 h-3" />
                  +{metric.change} {metric.changeLabel}
                </p>
              )}
              {metric.subLabel && (
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {metric.subLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Quality */}
        <div className={`
          rounded-xl p-5
          ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}
        `}>
          <h3 className={`text-sm font-medium mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            <Target className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Calidad de leads
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>Leads calificados</span>
                <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {data.qualifiedLeads} / {data.totalLeads}
                </span>
              </div>
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${data.totalLeads > 0 ? (data.qualifiedLeads / data.totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>Tasa de respuesta</span>
                <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {data.responseRate}%
                </span>
              </div>
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${data.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className={`
          rounded-xl p-5
          ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}
        `}>
          <h3 className={`text-sm font-medium mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            Leads por etapa
          </h3>
          <div className="space-y-3">
            {Object.entries(data.stageBreakdown).length > 0 ? (
              Object.entries(data.stageBreakdown).map(([stage, count], index) => {
                const colorClass = stageColors[index % stageColors.length];
                const percentage = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0;

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className={`text-xs w-24 truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {stageLabels[stage] || stage}
                    </span>
                    <div className={`flex-1 rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <div
                        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono w-6 text-right ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {count}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className={`
        mt-6 rounded-xl p-8 text-center
        ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}
      `}>
        <div className={`
          w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center
          ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
        `}>
          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          Mas analiticas proximamente
        </h3>
        <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Graficas de tendencias, analisis de sentimiento y reportes exportables
        </p>
      </div>
    </div>
  );
}

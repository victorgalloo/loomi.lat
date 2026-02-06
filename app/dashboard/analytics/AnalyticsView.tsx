'use client';

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
  const mainMetrics = [
    {
      label: 'leads',
      value: data.totalLeads,
      change: data.newLeadsThisMonth,
      changeLabel: 'este mes',
      icon: Users,
    },
    {
      label: 'conversaciones',
      value: data.totalConversations,
      icon: MessageCircle,
    },
    {
      label: 'mensajes',
      value: data.messagesThisMonth,
      subLabel: 'este mes',
      icon: Mail,
    },
    {
      label: 'citas',
      value: data.appointmentsBooked,
      icon: Calendar,
    }
  ];

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
    Negociacion: 'Negociación',
    payment_pending: 'Pago pendiente',
    customer: 'Clientes',
    Ganado: 'Ganados',
    Perdido: 'Perdidos',
    cold: 'Fríos'
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground font-mono">
            ./analytics_
          </h1>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 pb-6 mb-6 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            total leads
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {data.totalLeads}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            calificados
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-accent-green">
            {data.qualifiedLeads}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            tasa respuesta
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {data.responseRate}%
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl p-5 transition-colors bg-surface border border-border hover:border-muted"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-muted font-mono">
                  {metric.label}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-2">
                  <Icon className="w-4 h-4 text-muted" />
                </div>
              </div>
              <p className="text-2xl font-semibold font-mono text-foreground">
                {metric.value.toLocaleString()}
              </p>
              {metric.change !== undefined && (
                <p className="text-xs mt-1 flex items-center gap-1 text-accent-green font-mono">
                  <TrendingUp className="w-3 h-3" />
                  +{metric.change} {metric.changeLabel}
                </p>
              )}
              {metric.subLabel && (
                <p className="text-xs mt-1 text-muted font-mono">
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
        <div className="rounded-xl p-5 bg-surface border border-border">
          <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground font-mono">
            <Target className="w-4 h-4 text-terminal-green" />
            calidad de leads
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted font-mono">leads calificados</span>
                <span className="font-mono text-foreground">
                  {data.qualifiedLeads} / {data.totalLeads}
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden bg-surface-2">
                <div
                  className="h-full rounded-full bg-terminal-green transition-all duration-500"
                  style={{ width: `${data.totalLeads > 0 ? (data.qualifiedLeads / data.totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted font-mono">tasa de respuesta</span>
                <span className="font-mono text-foreground">
                  {data.responseRate}%
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden bg-surface-2">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${data.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="rounded-xl p-5 bg-surface border border-border">
          <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground font-mono">
            <BarChart3 className="w-4 h-4 text-muted" />
            leads por etapa
          </h3>
          <div className="space-y-3">
            {Object.entries(data.stageBreakdown).length > 0 ? (
              Object.entries(data.stageBreakdown).map(([stage, count]) => {
                const percentage = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0;

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs w-24 truncate text-muted font-mono">
                      {stageLabels[stage] || stage}
                    </span>
                    <div className="flex-1 rounded-full h-1.5 overflow-hidden bg-surface-2">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-6 text-right text-muted">
                      {count}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-center py-4 text-muted font-mono">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="mt-6 rounded-xl p-8 text-center bg-surface border border-border">
        <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-surface-2">
          <BarChart3 className="w-5 h-5 text-muted" />
        </div>
        <h3 className="text-sm font-medium mb-1 text-foreground font-mono">
          más analíticas próximamente
        </h3>
        <p className="text-xs max-w-sm mx-auto text-muted">
          Gráficas de tendencias, análisis de sentimiento y reportes exportables
        </p>
      </div>
    </div>
  );
}

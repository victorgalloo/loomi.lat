'use client';

import { Fragment } from 'react';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';

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
    },
    {
      label: 'conversaciones',
      value: data.totalConversations,
    },
    {
      label: 'mensajes',
      value: data.messagesThisMonth,
      subLabel: 'este mes',
    },
    {
      label: 'citas',
      value: data.appointmentsBooked,
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
    <div className="px-6 py-8">
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
          <p className="text-label uppercase tracking-wider text-muted">
            total leads
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {data.totalLeads}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-label uppercase tracking-wider text-muted">
            calificados
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-info">
            {data.qualifiedLeads}
          </p>
        </div>

        <div className="w-px h-8 bg-border" />

        <div>
          <p className="text-label uppercase tracking-wider text-muted">
            tasa respuesta
          </p>
          <p className="text-xl font-semibold font-mono mt-1 text-foreground">
            {data.responseRate}%
          </p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="flex items-center gap-6 text-sm mb-6 pb-6 border-b border-border flex-wrap">
        {mainMetrics.map((metric, i) => (
          <Fragment key={metric.label}>
            {i > 0 && <div className="w-px h-8 bg-border" />}
            <div>
              <p className="text-label uppercase tracking-wider text-muted">{metric.label}</p>
              <p className="text-xl font-semibold font-mono mt-1 text-foreground">
                {metric.value.toLocaleString()}
              </p>
              {metric.change !== undefined && (
                <p className="text-xs mt-0.5 flex items-center gap-1 text-info">
                  <TrendingUp className="w-3 h-3" /> +{metric.change} {metric.changeLabel}
                </p>
              )}
              {metric.subLabel && (
                <p className="text-xs mt-0.5 text-muted">{metric.subLabel}</p>
              )}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Quality */}
        <div>
          <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground">
            <Target className="w-4 h-4 text-info" />
            calidad de leads
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">leads calificados</span>
                <span className="font-mono text-foreground">
                  {data.qualifiedLeads} / {data.totalLeads}
                </span>
              </div>
              <div className="w-full rounded-full h-2.5 overflow-hidden bg-surface-2">
                <div
                  className="h-full rounded-full bg-info transition-all duration-500"
                  style={{ width: `${data.totalLeads > 0 ? (data.qualifiedLeads / data.totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">tasa de respuesta</span>
                <span className="font-mono text-foreground">
                  {data.responseRate}%
                </span>
              </div>
              <div className="w-full rounded-full h-2.5 overflow-hidden bg-surface-2">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
                  style={{ width: `${data.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground">
            <BarChart3 className="w-4 h-4 text-muted" />
            leads por etapa
          </h3>
          <div className="space-y-3">
            {Object.entries(data.stageBreakdown).length > 0 ? (
              Object.entries(data.stageBreakdown).map(([stage, count]) => {
                const percentage = data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0;

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm w-28 truncate text-muted">
                      {stageLabels[stage] || stage}
                    </span>
                    <div className="flex-1 rounded-full h-2.5 overflow-hidden bg-surface-2">
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
              <p className="text-sm text-center py-4 text-muted">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted">más analíticas próximamente — gráficas de tendencias, análisis de sentimiento y reportes exportables</p>
      </div>
    </div>
  );
}

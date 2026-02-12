'use client';

import { Fragment } from 'react';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

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
  const stageLabels: Record<string, string> = {
    Cold: 'Cold',
    Warm: 'Warm',
    Hot: 'Hot',
    Ganado: 'Ganados',
    Perdido: 'Perdidos',
    // Legacy aliases
    initial: 'Cold',
    Nuevo: 'Cold',
    Contactado: 'Warm',
    qualified: 'Hot',
    Calificado: 'Hot',
    demo_scheduled: 'Hot',
    'Demo Agendada': 'Hot',
    Propuesta: 'Hot',
    Negociacion: 'Hot',
    customer: 'Ganados',
    cold: 'Cold',
  };

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Analytics
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Leads" value={data.totalLeads} subtitle={`+${data.newLeadsThisMonth} este mes`} />
        <StatCard label="Calificados" value={data.qualifiedLeads} />
        <StatCard label="Tasa Respuesta" value={`${data.responseRate}%`} />
        <StatCard label="Citas" value={data.appointmentsBooked} />
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Conversaciones" value={data.totalConversations} />
        <StatCard label="Mensajes" value={data.messagesThisMonth} subtitle="Este mes" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Quality */}
        <div>
          <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground">
            <Target className="w-4 h-4 text-info" />
            Calidad de Leads
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Leads calificados</span>
                <span className="tabular-nums text-foreground">
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
                <span className="text-muted">Tasa de respuesta</span>
                <span className="tabular-nums text-foreground">
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
            Leads por Etapa
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
                    <span className="text-xs tabular-nums w-6 text-right text-muted">
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
        <p className="text-sm text-muted">Más analíticas próximamente — gráficas de tendencias, análisis de sentimiento y reportes exportables</p>
      </div>
    </div>
  );
}

'use client';

import { Target, BarChart3, Filter, Radio } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

interface CapiEvent {
  id: string;
  eventName: string;
  phone: string;
  status: string;
  createdAt: string;
  lastError: string | null;
}

interface AnalyticsData {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalConversations: number;
  messagesThisMonth: number;
  appointmentsBooked: number;
  qualifiedLeads: number;
  responseRate: number;
  stageBreakdown: Record<string, number>;
  funnel: {
    total: number;
    qualified: number;
    demo: number;
    won: number;
    totalDealValue: number;
  };
  capi: {
    counts: { sent: number; pending: number; failed: number };
    events: CapiEvent[];
  };
}

interface AnalyticsViewProps {
  data: AnalyticsData;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD}d`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `•${digits.slice(-4)}`;
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

  const { funnel, capi } = data;

  // Funnel steps with conversion rates
  const funnelSteps = [
    { label: 'Total Leads', value: funnel.total, rate: null },
    { label: 'Calificados', value: funnel.qualified, rate: funnel.total > 0 ? Math.round((funnel.qualified / funnel.total) * 100) : 0 },
    { label: 'Demo Agendada', value: funnel.demo, rate: funnel.qualified > 0 ? Math.round((funnel.demo / funnel.qualified) * 100) : 0 },
    { label: 'Ganados', value: funnel.won, rate: funnel.demo > 0 ? Math.round((funnel.won / funnel.demo) * 100) : 0 },
  ];

  const maxFunnelValue = Math.max(funnel.total, 1);

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

      {/* Embudo de Conversión */}
      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="text-sm font-medium mb-5 flex items-center gap-2 text-foreground">
          <Filter className="w-4 h-4 text-muted" />
          Embudo de Conversión
        </h3>
        <div className="space-y-3">
          {funnelSteps.map((step) => {
            const barWidth = maxFunnelValue > 0 ? (step.value / maxFunnelValue) * 100 : 0;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0 text-muted">
                  {step.label}
                </span>
                <div className="flex-1 rounded-full h-2.5 overflow-hidden bg-surface-2">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums w-8 text-right text-foreground">
                  {step.value}
                </span>
                {step.rate !== null && (
                  <span className="text-xs tabular-nums w-10 text-right text-muted">
                    ({step.rate}%)
                  </span>
                )}
                {step.rate === null && (
                  <span className="w-10" />
                )}
              </div>
            );
          })}
        </div>
        {funnel.totalDealValue > 0 && (
          <p className="text-sm text-muted mt-4">
            Valor total:{' '}
            <span className="text-foreground font-medium font-mono tabular-nums">
              ${funnel.totalDealValue.toLocaleString('es-MX')} MXN
            </span>
          </p>
        )}
      </div>

      {/* Meta CAPI */}
      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
          <Radio className="w-4 h-4 text-muted" />
          Meta CAPI
        </h3>

        {/* Status counts */}
        <div className="flex items-center gap-1 text-sm mb-4">
          <span className="text-terminal-green">Enviados</span>
          <span className="text-terminal-green tabular-nums font-medium">{capi.counts.sent}</span>
          <span className="text-muted mx-1">·</span>
          <span className="text-terminal-yellow">Pendientes</span>
          <span className="text-terminal-yellow tabular-nums font-medium">{capi.counts.pending}</span>
          <span className="text-muted mx-1">·</span>
          <span className="text-terminal-red">Fallidos</span>
          <span className="text-terminal-red tabular-nums font-medium">{capi.counts.failed}</span>
        </div>

        {/* Events table */}
        {capi.events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Tel</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {capi.events.map((event) => (
                  <tr key={event.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-mono text-xs text-foreground">
                      {event.eventName}
                    </td>
                    <td className="py-2 tabular-nums text-muted">
                      {maskPhone(event.phone)}
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${
                        event.status === 'sent'
                          ? 'text-terminal-green'
                          : event.status === 'pending'
                          ? 'text-terminal-yellow'
                          : 'text-terminal-red'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          event.status === 'sent'
                            ? 'bg-terminal-green'
                            : event.status === 'pending'
                            ? 'bg-terminal-yellow'
                            : 'bg-terminal-red'
                        }`} />
                        {event.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-xs text-muted">
                      {timeAgo(event.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-center py-4 text-muted">
            No hay eventos CAPI registrados
          </p>
        )}
      </div>

      {/* Coming Soon */}
      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted">Más analíticas próximamente — gráficas de tendencias, análisis de sentimiento y reportes exportables</p>
      </div>
    </div>
  );
}

'use client';

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
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      label: 'Conversaciones',
      value: data.totalConversations,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'green'
    },
    {
      label: 'Mensajes este mes',
      value: data.messagesThisMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      label: 'Citas agendadas',
      value: data.appointmentsBooked,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' }
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

  return (
    <div className="space-y-8">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainMetrics.map((metric) => {
          const colors = colorClasses[metric.color as keyof typeof colorClasses];
          return (
            <div
              key={metric.label}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value.toLocaleString()}</p>
                  {metric.change !== undefined && (
                    <p className="text-sm text-green-600 mt-1">
                      +{metric.change} {metric.changeLabel}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <span className={colors.icon}>{metric.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Quality */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calidad de leads</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Leads calificados</span>
                <span className="font-medium">{data.qualifiedLeads} / {data.totalLeads}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${data.totalLeads > 0 ? (data.qualifiedLeads / data.totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tasa de respuesta</span>
                <span className="font-medium">{data.responseRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${data.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por etapa</h3>
          <div className="space-y-3">
            {Object.entries(data.stageBreakdown).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stageLabels[stage] || stage}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${data.totalLeads > 0 ? (count / data.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

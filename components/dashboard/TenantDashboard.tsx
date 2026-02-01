'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ConnectionStatus from './ConnectionStatus';
import { Sparkles, MessageCircle, Users, Mail, Calendar, ArrowRight, Zap, Bot } from 'lucide-react';

interface TenantDashboardProps {
  tenant: {
    name: string;
    email: string;
    companyName: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  whatsappAccount: {
    connected: boolean;
    phoneNumber?: string;
    businessName?: string;
  };
  stats: {
    totalConversations: number;
    totalLeads: number;
    messagesThisMonth: number;
    appointmentsBooked: number;
  };
}

export default function TenantDashboard({
  tenant,
  whatsappAccount,
  stats
}: TenantDashboardProps) {
  const statCards = [
    {
      label: 'Conversaciones',
      value: stats.totalConversations,
      icon: MessageCircle,
      color: 'cyan',
      gradient: 'from-cyan-50 to-cyan-100/50'
    },
    {
      label: 'Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'emerald',
      gradient: 'from-emerald-50 to-emerald-100/50'
    },
    {
      label: 'Mensajes este mes',
      value: stats.messagesThisMonth,
      icon: Mail,
      color: 'purple',
      gradient: 'from-purple-50 to-purple-100/50'
    },
    {
      label: 'Citas agendadas',
      value: stats.appointmentsBooked,
      icon: Calendar,
      color: 'amber',
      gradient: 'from-amber-50 to-amber-100/50'
    }
  ];

  const colorClasses: Record<string, { icon: string; text: string; bg: string; border: string }> = {
    cyan: { icon: 'text-cyan-600', text: 'text-cyan-700', bg: 'bg-cyan-100', border: 'border-cyan-200' },
    emerald: { icon: 'text-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    purple: { icon: 'text-purple-600', text: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
    amber: { icon: 'text-amber-600', text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' }
  };

  const tierLabels: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Bienvenido, {tenant.name.split(' ')[0]}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Aqui tienes un resumen de tu cuenta de Loomi.
          </p>
        </div>
      </motion.div>

      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ConnectionStatus
          connected={whatsappAccount.connected}
          phoneNumber={whatsappAccount.phoneNumber}
          businessName={whatsappAccount.businessName}
        />
      </motion.div>

      {/* Quick Actions - Only show if not connected */}
      {!whatsappAccount.connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            Primeros pasos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <Link href="/loomi/dashboard/connect" className="group">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-800">Conectar WhatsApp</h3>
                    <p className="text-sm text-emerald-600">Enlaza tu cuenta Business</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </Link>

            <Link href="/loomi/dashboard/agent" className="group">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Configurar Agente</h3>
                    <p className="text-sm text-gray-600">Personaliza las respuestas</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </Link>

            <Link href="/loomi/dashboard/analytics" className="group">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/50 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Ver Analiticas</h3>
                    <p className="text-sm text-gray-600">Revisa el rendimiento</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const colors = colorClasses[stat.color];
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${colors.text}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Subscription Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Plan actual
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-purple-700">
                {tierLabels[tenant.subscriptionTier] || tenant.subscriptionTier}
              </span>
              <span className={`
                px-2.5 py-0.5 rounded-full text-xs font-medium
                ${tenant.subscriptionStatus === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
                }
              `}>
                {tenant.subscriptionStatus === 'active' ? 'Activo' : tenant.subscriptionStatus}
              </span>
            </div>
          </div>
          <Link
            href="/loomi/dashboard/settings"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ver detalles
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

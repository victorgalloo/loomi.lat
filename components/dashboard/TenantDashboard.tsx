'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import {
  MessageCircle,
  Users,
  Mail,
  Calendar,
  ArrowRight,
  Zap,
  Bot
} from 'lucide-react';

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
  const { isDark } = useTheme();

  const statCards = [
    { label: 'Leads', value: stats.totalLeads, icon: Users },
    { label: 'Conversaciones', value: stats.totalConversations, icon: MessageCircle },
    { label: 'Mensajes', value: stats.messagesThisMonth, icon: Mail },
    { label: 'Citas', value: stats.appointmentsBooked, icon: Calendar },
  ];

  const tierLabels: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Hola, {tenant.name.split(' ')[0]}
        </h1>
        <p className={`mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Resumen de tu cuenta Loomi
        </p>
      </div>

      {/* Connection Status */}
      <div
        className={`
          p-5 rounded-xl border mb-6
          ${whatsappAccount.connected
            ? isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            : isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${whatsappAccount.connected
                ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'
                : isDark ? 'bg-amber-500/10' : 'bg-amber-100'
              }
            `}>
              <MessageCircle className={`w-5 h-5 ${
                whatsappAccount.connected
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-amber-400' : 'text-amber-600'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {whatsappAccount.connected ? 'WhatsApp Conectado' : 'WhatsApp No Conectado'}
              </p>
              {whatsappAccount.connected ? (
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {whatsappAccount.businessName || whatsappAccount.phoneNumber}
                </p>
              ) : (
                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Conecta tu cuenta para empezar
                </p>
              )}
            </div>
          </div>
          {!whatsappAccount.connected && (
            <Link
              href="/loomi/dashboard/connect"
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              `}
            >
              Conectar
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`
                p-4 rounded-xl border
                ${isDark
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-white border-zinc-200'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              </div>
              <p className={`text-2xl font-semibold font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stat.value}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className={`text-sm font-medium mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/loomi/dashboard/crm"
            className={`
              group p-4 rounded-xl border transition-all duration-200
              ${isDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-zinc-200 hover:border-zinc-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
                `}>
                  <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Ver Pipeline
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Gestiona tus leads
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
          </Link>

          <Link
            href="/loomi/dashboard/agent"
            className={`
              group p-4 rounded-xl border transition-all duration-200
              ${isDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-zinc-200 hover:border-zinc-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}
                `}>
                  <Bot className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Configurar Agente
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Personaliza respuestas
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
          </Link>

          <Link
            href="/loomi/dashboard/analytics"
            className={`
              group p-4 rounded-xl border transition-all duration-200
              ${isDark
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-zinc-200 hover:border-zinc-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
                `}>
                  <Zap className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Ver Analytics
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Métricas y reportes
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
          </Link>
        </div>
      </div>

      {/* Plan Info */}
      <div
        className={`
          p-5 rounded-xl border
          ${isDark
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-white border-zinc-200'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Plan actual
            </p>
            <p className={`text-lg font-semibold mt-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {tierLabels[tenant.subscriptionTier] || tenant.subscriptionTier}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`
              px-2.5 py-1 rounded-full text-xs font-medium
              ${tenant.subscriptionStatus === 'active'
                ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'
              }
            `}>
              {tenant.subscriptionStatus === 'active' ? 'Activo' : tenant.subscriptionStatus}
            </span>
            <Link
              href="/loomi/dashboard/settings"
              className={`
                text-sm font-medium transition-colors
                ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}
              `}
            >
              Gestionar →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

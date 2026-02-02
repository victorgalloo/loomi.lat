'use client';

import { useTheme } from '@/components/dashboard/ThemeProvider';
import { MessageCircle, CheckCircle, AlertCircle, Phone, Building, Calendar, Shield, HelpCircle } from 'lucide-react';

interface ConnectViewProps {
  isConnected: boolean;
  whatsappAccount: {
    displayPhoneNumber?: string | null;
    businessName?: string | null;
    wabaId?: string | null;
    connectedAt?: string | null;
  } | null;
}

export default function ConnectView({ isConnected, whatsappAccount }: ConnectViewProps) {
  const { isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            WhatsApp
          </h1>
          <span className={`
            flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium
            ${isConnected
              ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
              : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`flex items-center gap-8 pb-6 mb-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Estado
          </p>
          <p className={`text-xl font-semibold mt-1 ${isConnected ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-amber-400' : 'text-amber-600')}`}>
            {isConnected ? 'Activo' : 'Pendiente'}
          </p>
        </div>

        {isConnected && whatsappAccount?.displayPhoneNumber && (
          <>
            <div className={`w-px h-8 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <div>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Numero
              </p>
              <p className={`text-sm font-mono mt-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {whatsappAccount.displayPhoneNumber}
              </p>
            </div>
          </>
        )}
      </div>

      {isConnected ? (
        /* Connected State */
        <div className="space-y-4">
          {/* Connection Details */}
          <div className={`rounded-xl p-5 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <h2 className={`text-sm font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <CheckCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              Detalles de conexion
            </h2>

            <dl className="space-y-0">
              <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <dt className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <Phone className="w-4 h-4" />
                  Numero de telefono
                </dt>
                <dd className={`text-sm font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {whatsappAccount?.displayPhoneNumber || 'No disponible'}
                </dd>
              </div>

              <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <dt className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <Building className="w-4 h-4" />
                  Nombre del negocio
                </dt>
                <dd className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {whatsappAccount?.businessName || 'No disponible'}
                </dd>
              </div>

              <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <dt className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <Shield className="w-4 h-4" />
                  ID de cuenta
                </dt>
                <dd className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {whatsappAccount?.wabaId || 'No disponible'}
                </dd>
              </div>

              <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
                <dt className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <Calendar className="w-4 h-4" />
                  Conectado desde
                </dt>
                <dd className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {whatsappAccount?.connectedAt ? formatDate(whatsappAccount.connectedAt) : 'No disponible'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className={`rounded-xl p-5 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Acciones
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${isDark
                    ? 'text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white'
                    : 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900'
                  }
                `}
              >
                Reconectar
              </button>
              <form action="/api/whatsapp/connect" method="POST">
                <input type="hidden" name="action" value="disconnect" />
                <button
                  type="submit"
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${isDark
                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                      : 'text-red-600 bg-red-50 hover:bg-red-100'
                    }
                  `}
                >
                  Desconectar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Disconnected State - Connect Flow */
        <div className="space-y-4">
          <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <div className={`
              w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center
              ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
            `}>
              <MessageCircle className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <h3 className={`text-base font-medium mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Conecta tu WhatsApp Business
            </h3>
            <p className={`text-sm mb-6 max-w-sm mx-auto ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Conecta tu cuenta de WhatsApp Business para empezar a recibir y responder mensajes automaticamente
            </p>
            <a
              href="/api/whatsapp/connect"
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              `}
            >
              <MessageCircle className="w-4 h-4" />
              Conectar WhatsApp
            </a>
          </div>

          {/* Requirements */}
          <div className={`rounded-xl p-5 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <HelpCircle className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              Requisitos
            </h3>
            <ul className="space-y-3">
              {[
                'Cuenta de Facebook Business Manager',
                'Numero de telefono que pueda recibir SMS o llamadas',
                'El proceso toma aproximadamente 5 minutos'
              ].map((item, i) => (
                <li key={i} className={`flex items-start gap-3 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

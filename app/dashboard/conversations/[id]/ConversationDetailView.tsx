'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, User, Building, Mail, Tag, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/dashboard/ThemeProvider';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  stage: string;
  industry: string | null;
}

interface ConversationDetailViewProps {
  conversation: {
    id: string;
    started_at: string;
    ended_at: string | null;
    summary: string | null;
  };
  lead: Lead;
  messages: Message[];
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStageStyle(stage: string, isDarkMode: boolean): { label: string; bg: string; text: string } {
  const stages: Record<string, { label: string; lightBg: string; lightText: string; darkBg: string; darkText: string }> = {
    'Nuevo': { label: 'Nuevo', lightBg: 'bg-cyan-50', lightText: 'text-cyan-700', darkBg: 'bg-cyan-500/10', darkText: 'text-cyan-400' },
    'initial': { label: 'Nuevo', lightBg: 'bg-cyan-50', lightText: 'text-cyan-700', darkBg: 'bg-cyan-500/10', darkText: 'text-cyan-400' },
    'Contactado': { label: 'Contactado', lightBg: 'bg-amber-50', lightText: 'text-amber-700', darkBg: 'bg-amber-500/10', darkText: 'text-amber-400' },
    'qualified': { label: 'Calificado', lightBg: 'bg-purple-50', lightText: 'text-purple-700', darkBg: 'bg-purple-500/10', darkText: 'text-purple-400' },
    'Calificado': { label: 'Calificado', lightBg: 'bg-purple-50', lightText: 'text-purple-700', darkBg: 'bg-purple-500/10', darkText: 'text-purple-400' },
    'Demo Agendada': { label: 'Demo Agendada', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', darkBg: 'bg-indigo-500/10', darkText: 'text-indigo-400' },
    'demo_scheduled': { label: 'Demo Agendada', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700', darkBg: 'bg-indigo-500/10', darkText: 'text-indigo-400' },
    'Propuesta': { label: 'Propuesta', lightBg: 'bg-blue-50', lightText: 'text-blue-700', darkBg: 'bg-blue-500/10', darkText: 'text-blue-400' },
    'Negociacion': { label: 'Negociacion', lightBg: 'bg-orange-50', lightText: 'text-orange-700', darkBg: 'bg-orange-500/10', darkText: 'text-orange-400' },
    'Ganado': { label: 'Ganado', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', darkBg: 'bg-emerald-500/10', darkText: 'text-emerald-400' },
    'customer': { label: 'Cliente', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700', darkBg: 'bg-emerald-500/10', darkText: 'text-emerald-400' },
    'Perdido': { label: 'Perdido', lightBg: 'bg-red-50', lightText: 'text-red-700', darkBg: 'bg-red-500/10', darkText: 'text-red-400' },
    'cold': { label: 'Frio', lightBg: 'bg-zinc-100', lightText: 'text-zinc-600', darkBg: 'bg-zinc-700', darkText: 'text-zinc-400' },
  };

  const style = stages[stage] || { label: stage, lightBg: 'bg-zinc-100', lightText: 'text-zinc-600', darkBg: 'bg-zinc-700', darkText: 'text-zinc-400' };

  return {
    label: style.label,
    bg: isDarkMode ? style.darkBg : style.lightBg,
    text: isDarkMode ? style.darkText : style.lightText,
  };
}

export default function ConversationDetailView({ conversation, lead, messages }: ConversationDetailViewProps) {
  const { isDark: isDarkMode } = useTheme();
  const stage = getStageStyle(lead.stage, isDarkMode);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/conversations"
            className={`
              p-2 rounded-lg transition-colors
              ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}
            `}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {lead.name}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.bg} ${stage.text}`}>
              {stage.label}
            </span>
          </div>
        </div>

        <a
          href={`https://wa.me/${lead.phone.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors duration-150
            ${isDarkMode
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }
          `}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>
      </div>

      {/* Stats Bar */}
      <div className={`flex items-center gap-8 pb-6 mb-6 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Mensajes
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {messages.length}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Iniciada
          </p>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {formatDate(conversation.started_at)}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Telefono
          </p>
          <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {lead.phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                <h2 className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  Historial de mensajes
                </h2>
              </div>
            </div>

            <div className={`p-4 h-[500px] overflow-y-auto space-y-3 ${isDarkMode ? 'bg-zinc-950/50' : 'bg-zinc-50'}`}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-2.5
                      ${message.role === "assistant"
                        ? isDarkMode
                          ? 'bg-zinc-800 border border-zinc-700 rounded-bl-sm'
                          : 'bg-white border border-zinc-200 rounded-bl-sm'
                        : isDarkMode
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : 'bg-emerald-500 text-white rounded-br-sm'
                      }
                    `}
                  >
                    <p className={`text-sm whitespace-pre-wrap ${
                      message.role === "assistant"
                        ? isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                        : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1 ${
                      message.role === "assistant"
                        ? isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                        : 'text-emerald-200'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className={`text-center py-12 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay mensajes en esta conversacion</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Info Sidebar */}
        <div className="space-y-4">
          {/* Contact Card */}
          <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <div className="flex items-center gap-4 mb-5">
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium
                ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}
              `}>
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{lead.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{lead.phone}</p>
              </div>
            </div>

            <dl className="space-y-4">
              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <div>
                    <dt className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Email</dt>
                    <dd className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{lead.email}</dd>
                  </div>
                </div>
              )}
              {lead.company && (
                <div className="flex items-start gap-3">
                  <Building className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <div>
                    <dt className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Empresa</dt>
                    <dd className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{lead.company}</dd>
                  </div>
                </div>
              )}
              {lead.industry && (
                <div className="flex items-start gap-3">
                  <Tag className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <div>
                    <dt className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Industria</dt>
                    <dd className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{lead.industry}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Summary Card */}
          {conversation.summary && (
            <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
              <h3 className={`font-medium text-sm mb-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Resumen
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {conversation.summary}
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <h3 className={`font-medium text-sm mb-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              Acciones rapidas
            </h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/crm`}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full
                  ${isDarkMode
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }
                `}
              >
                <User className="w-4 h-4" />
                Ver en Pipeline
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

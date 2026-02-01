'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Moon, Sun, Plus, Search, Filter } from 'lucide-react';
import { KanbanBoard } from '@/components/dashboard/crm';
import { Lead } from '@/components/dashboard/crm/LeadCard';
import { PipelineStage } from '@/components/dashboard/crm/KanbanColumn';

interface CRMViewProps {
  stages: PipelineStage[];
  leads: Lead[];
}

export default function CRMView({ stages, leads }: CRMViewProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = searchQuery
    ? leads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery)
      )
    : leads;

  // Stats
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
  const wonDeals = leads.filter(l => l.stage === 'Ganado');
  const wonValue = wonDeals.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      {/* Top Bar */}
      <div className={`
        sticky top-0 z-40 backdrop-blur-xl border-b
        ${isDarkMode
          ? 'bg-black/80 border-zinc-800'
          : 'bg-white/80 border-zinc-200'
        }
      `}>
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-6">
              <Link
                href="/loomi/dashboard"
                className={`
                  flex items-center gap-2 text-sm transition-colors
                  ${isDarkMode
                    ? 'text-zinc-500 hover:text-zinc-300'
                    : 'text-zinc-400 hover:text-zinc-600'
                  }
                `}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  Pipeline
                </h1>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}
                `}>
                  {totalLeads} leads
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={`
                relative hidden sm:block
              `}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`
                    w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none
                    transition-all duration-200
                    ${isDarkMode
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700'
                      : 'bg-zinc-100 border border-transparent text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white'
                    }
                  `}
                />
              </div>

              {/* Theme Toggle */}
              <motion.button
                onClick={() => setIsDarkMode(!isDarkMode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  p-2 rounded-lg transition-colors
                  ${isDarkMode
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                  }
                `}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.button>

              {/* Add Lead */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${isDarkMode
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }
                `}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Lead</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Pipeline Total
              </p>
              <p className={`text-2xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className={`w-px h-10 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            <div>
              <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Cerrados
              </p>
              <p className={`text-2xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {formatCurrency(wonValue)}
              </p>
            </div>

            <div className={`w-px h-10 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            <div>
              <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Conversion
              </p>
              <p className={`text-2xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {totalLeads > 0 ? Math.round((wonDeals.length / totalLeads) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {filteredLeads.length > 0 || leads.length === 0 ? (
          <KanbanBoard
            stages={stages}
            initialLeads={filteredLeads}
            isDarkMode={isDarkMode}
          />
        ) : (
          <div className="text-center py-12">
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              No se encontraron resultados para &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Empty State */}
        {leads.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className={`
              w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center
              ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}
            `}>
              <svg
                className={`w-8 h-8 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Sin leads aún
            </h3>
            <p className={`text-sm max-w-sm mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Los leads aparecerán automáticamente cuando recibas mensajes por WhatsApp o los agregues manualmente.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                mt-6 px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${isDarkMode
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              `}
            >
              Agregar primer lead
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className={`
        fixed bottom-6 right-6 px-3 py-1.5 rounded-lg text-xs
        ${isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400 shadow-lg border border-zinc-200'}
      `}>
        <span className={`font-mono ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘K</span>
        <span className="ml-2">para buscar</span>
      </div>
    </div>
  );
}

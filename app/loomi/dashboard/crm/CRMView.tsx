'use client';

import { useState } from 'react';
import { Plus, Search, Users, X } from 'lucide-react';
import { KanbanBoard } from '@/components/dashboard/crm';
import { Lead } from '@/components/dashboard/crm/LeadCard';
import { PipelineStage } from '@/components/dashboard/crm/KanbanColumn';
import { useTheme } from '@/components/dashboard/ThemeProvider';

interface CRMViewProps {
  stages: PipelineStage[];
  leads: Lead[];
}

export default function CRMView({ stages, leads: initialLeads }: CRMViewProps) {
  const { isDark: isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState(initialLeads);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    companyName: '',
    contactEmail: '',
    dealValue: ''
  });

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

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.phone) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLead.name,
          phone: newLead.phone,
          company_name: newLead.companyName || null,
          contact_email: newLead.contactEmail || null,
          deal_value: newLead.dealValue ? parseFloat(newLead.dealValue) : null,
          stage: 'Nuevo'
        })
      });

      if (response.ok) {
        const created = await response.json();
        setLeads([{
          id: created.id,
          name: created.name,
          phone: created.phone,
          companyName: created.company_name,
          contactEmail: created.contact_email,
          dealValue: created.deal_value,
          stage: created.stage || 'Nuevo',
          priority: 'medium',
          lastActivityAt: created.created_at,
          conversationCount: 0
        }, ...leads]);
        setShowModal(false);
        setNewLead({ name: '', phone: '', companyName: '', contactEmail: '', dealValue: '' });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLeadMove = async (leadId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (response.ok) {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId ? { ...lead, stage: newStage } : lead
          )
        );
      }
    } catch (error) {
      console.error('Error moving lead:', error);
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Pipeline
          </h1>
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}
          `}>
            {totalLeads} leads
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none
                transition-colors duration-150
                ${isDarkMode
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-700'
                  : 'bg-zinc-100 border border-transparent text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white'
                }
              `}
            />
          </div>

          {/* Add Lead */}
          <button
            onClick={() => setShowModal(true)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isDarkMode
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={`flex items-center gap-8 pb-6 mb-6 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Pipeline Total
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {formatCurrency(totalValue)}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Cerrados
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatCurrency(wonValue)}
          </p>
        </div>

        <div className={`w-px h-8 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div>
          <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Conversion
          </p>
          <p className={`text-xl font-semibold font-mono mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {totalLeads > 0 ? Math.round((wonDeals.length / totalLeads) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-6 px-6">
        {filteredLeads.length > 0 || leads.length === 0 ? (
          <KanbanBoard
            stages={stages}
            initialLeads={filteredLeads}
            isDarkMode={isDarkMode}
            onAddLead={() => setShowModal(true)}
            onLeadMove={handleLeadMove}
          />
        ) : (
          <div className="text-center py-12">
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              No se encontraron resultados para &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-20">
          <div className={`
            w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center
            ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}
          `}>
            <Users className={`w-6 h-6 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
          </div>
          <h3 className={`text-base font-medium mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Sin leads aún
          </h3>
          <p className={`text-sm max-w-sm mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Los leads aparecerán cuando recibas mensajes por WhatsApp
          </p>
          <button
            onClick={() => setShowModal(true)}
            className={`
              mt-4 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isDarkMode
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }
            `}
          >
            Agregar primer lead
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className={`
            relative w-full max-w-md mx-4 rounded-xl shadow-2xl
            ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}
          `}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Nuevo Lead
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Juan Pérez"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm outline-none
                    ${isDarkMode
                      ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                    }
                  `}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm outline-none
                    ${isDarkMode
                      ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                    }
                  `}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Empresa
                </label>
                <input
                  type="text"
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  placeholder="Acme Inc."
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm outline-none
                    ${isDarkMode
                      ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                    }
                  `}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={newLead.contactEmail}
                  onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
                  placeholder="juan@empresa.com"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm outline-none
                    ${isDarkMode
                      ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                    }
                  `}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Valor del deal
                </label>
                <input
                  type="number"
                  value={newLead.dealValue}
                  onChange={(e) => setNewLead({ ...newLead, dealValue: e.target.value })}
                  placeholder="50000"
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm outline-none
                    ${isDarkMode
                      ? 'bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-600'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'
                    }
                  `}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex justify-end gap-2 px-5 py-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button
                onClick={() => setShowModal(false)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isDarkMode
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }
                `}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLead}
                disabled={!newLead.name || !newLead.phone || isCreating}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDarkMode
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }
                `}
              >
                {isCreating ? 'Creando...' : 'Crear Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

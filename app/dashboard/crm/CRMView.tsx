'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Search, Users, X, Zap } from 'lucide-react';
import { KanbanBoard } from '@/components/dashboard/crm';
import { Lead } from '@/components/dashboard/crm/LeadCard';
import { PipelineStage } from '@/components/dashboard/crm/KanbanColumn';
import { createClient } from '@/lib/supabase/client';

interface CRMViewProps {
  stages: PipelineStage[];
  leads: Lead[];
  tenantId: string;
}

export default function CRMView({ stages, leads: initialLeads, tenantId }: CRMViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState(initialLeads);

  // Realtime subscription for leads
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLead = payload.new;
            setLeads(prev => {
              if (prev.some(l => l.id === newLead.id)) return prev;
              return [{
                id: newLead.id,
                name: newLead.name,
                phone: newLead.phone,
                companyName: newLead.company_name,
                contactEmail: newLead.contact_email,
                dealValue: newLead.deal_value,
                stage: newLead.stage || 'Nuevo',
                priority: newLead.priority || 'medium',
                lastActivityAt: newLead.last_activity_at,
                broadcastClassification: newLead.broadcast_classification,
                conversationCount: 0,
              }, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setLeads(prev => prev.map(lead =>
              lead.id === updated.id
                ? {
                    ...lead,
                    name: updated.name,
                    phone: updated.phone,
                    companyName: updated.company_name,
                    contactEmail: updated.contact_email,
                    dealValue: updated.deal_value,
                    stage: updated.stage || 'Nuevo',
                    priority: updated.priority || 'medium',
                    lastActivityAt: updated.last_activity_at,
                    broadcastClassification: updated.broadcast_classification,
                  }
                : lead
            ));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old;
            setLeads(prev => prev.filter(lead => lead.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<{
    total: number;
    classified: number;
    skipped: number;
    results: { hot: number; warm: number; cold: number; bot_autoresponse: number };
  } | null>(null);

  // Auto-hide classify result banner after 8s
  useEffect(() => {
    if (!classifyResult) return;
    const timer = setTimeout(() => setClassifyResult(null), 8000);
    return () => clearTimeout(timer);
  }, [classifyResult]);

  const handleClassifyLeads = async () => {
    setClassifying(true);
    setClassifyResult(null);
    try {
      const response = await fetch('/api/leads/classify', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setClassifyResult(data);
      }
    } catch (error) {
      console.error('Error classifying leads:', error);
    } finally {
      setClassifying(false);
    }
  };

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
  const wonDeals = leads.filter(l => stages.find(s => s.name === l.stage)?.isWon);
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

  const handleExportColumn = useCallback((stage: PipelineStage, columnLeads: Lead[]) => {
    const escapeCSV = (value: string | null | undefined) => {
      if (value == null) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Nombre', 'Teléfono', 'Empresa', 'Email', 'Valor', 'Prioridad', 'Clasificación'];
    const rows = columnLeads.map(lead => [
      escapeCSV(lead.name),
      escapeCSV(lead.phone),
      escapeCSV(lead.companyName),
      escapeCSV(lead.contactEmail),
      lead.dealValue != null ? String(lead.dealValue) : '',
      escapeCSV(lead.priority),
      escapeCSV(lead.broadcastClassification),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stage.name.toLowerCase().replace(/\s+/g, '-')}-leads.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleLeadDelete = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (response.ok) {
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
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
    <div className="px-6 py-8">
      {/* Classify Result Banner */}
      {classifyResult && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevated bg-surface-elevated border border-border animate-in fade-in slide-in-from-top-2">
          <span className="text-terminal-green">&#10003;</span>
          <span className="text-sm text-foreground">
            {classifyResult.classified > 0 ? (
              <>
                <span className="font-medium">{classifyResult.classified} leads analizados</span>
                {' — '}
                {classifyResult.results.hot > 0 && <>{classifyResult.results.hot} hot &middot; </>}
                {classifyResult.results.warm > 0 && <>{classifyResult.results.warm} warm &middot; </>}
                {classifyResult.results.cold > 0 && <>{classifyResult.results.cold} cold &middot; </>}
                {classifyResult.results.bot_autoresponse > 0 && <>{classifyResult.results.bot_autoresponse} bot</>}
              </>
            ) : (
              <span className="font-medium">0 leads por analizar</span>
            )}
          </span>
          <button
            onClick={() => setClassifyResult(null)}
            className="p-0.5 rounded-lg hover:bg-surface-2 text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground font-mono">
            ./pipeline_
          </h1>
          <span className="text-label px-2.5 py-1 rounded-full font-medium bg-surface border border-border text-muted">
            {totalLeads} leads
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9 pr-3 py-1.5 rounded-xl text-sm outline-none transition-colors duration-150 bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-info/30 focus:border-info/50"
            />
          </div>

          {/* Classify Leads */}
          <button
            onClick={handleClassifyLeads}
            disabled={classifying}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 bg-surface border border-border text-foreground hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {classifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {classifying ? 'analizando...' : 'analizar'}
            </span>
          </button>

          {/* Add Lead */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-150 bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">nuevo lead</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 text-sm pb-6 mb-6 border-b border-border">
        <div>
          <span className="text-muted">pipeline total</span>
          <span className="ml-2 font-mono text-foreground">{formatCurrency(totalValue)}</span>
        </div>
        <span className="text-border">·</span>
        <div>
          <span className="text-muted">cerrados</span>
          <span className="ml-2 font-mono text-info">{formatCurrency(wonValue)}</span>
        </div>
        <span className="text-border">·</span>
        <div>
          <span className="text-muted">conversión</span>
          <span className="ml-2 font-mono text-foreground">{totalLeads > 0 ? Math.round((wonDeals.length / totalLeads) * 100) : 0}%</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-6 px-6">
        {filteredLeads.length > 0 || leads.length === 0 ? (
          <KanbanBoard
            stages={stages}
            initialLeads={filteredLeads}
            onAddLead={() => setShowModal(true)}
            onLeadMove={handleLeadMove}
            onLeadDelete={handleLeadDelete}
            onExportColumn={handleExportColumn}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted">
              No se encontraron resultados para &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-surface border border-border">
            <Users className="w-6 h-6 text-muted" />
          </div>
          <h3 className="text-base font-medium mb-1 text-foreground">
            Sin leads aún
          </h3>
          <p className="text-sm max-w-sm mx-auto text-muted">
            Los leads aparecerán cuando recibas mensajes por WhatsApp
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 bg-foreground text-background hover:bg-foreground/90"
          >
            agregar primer lead
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-elevated bg-surface-elevated border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground font-mono">
                nuevo lead
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl transition-colors hover:bg-surface-2 text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-5">
              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  nombre *
                </label>
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-2 border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  teléfono *
                </label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-2 border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  empresa
                </label>
                <input
                  type="text"
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  placeholder="Acme Inc."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-2 border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  email
                </label>
                <input
                  type="email"
                  value={newLead.contactEmail}
                  onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
                  placeholder="juan@empresa.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-2 border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  valor del deal
                </label>
                <input
                  type="number"
                  value={newLead.dealValue}
                  onChange={(e) => setNewLead({ ...newLead, dealValue: e.target.value })}
                  placeholder="50000"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-surface-2 border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-muted hover:text-foreground hover:bg-surface-2"
              >
                cancelar
              </button>
              <button
                onClick={handleCreateLead}
                disabled={!newLead.name || !newLead.phone || isCreating}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-foreground text-background hover:bg-foreground/90 font-mono"
              >
                {isCreating ? 'creando...' : './crear-lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

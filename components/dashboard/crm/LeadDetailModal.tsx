'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { X, MessageCircle, Pencil, ArrowLeft } from 'lucide-react';
import { Lead } from './LeadCard';
import { PipelineStage } from './KanbanColumn';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface LeadDetailModalProps {
  lead: Lead;
  stages: PipelineStage[];
  onClose: () => void;
  onSave: (leadId: string, data: Partial<Lead>) => Promise<void>;
}

function LeadDetailModal({ lead, stages, onClose, onSave }: LeadDetailModalProps) {
  const [formData, setFormData] = useState({
    name: lead.name,
    companyName: lead.companyName || '',
    contactEmail: lead.contactEmail || '',
    dealValue: lead.dealValue || 0,
    stage: lead.stage,
    priority: lead.priority,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch messages immediately on mount
  useEffect(() => {
    fetch(`/api/leads/${lead.id}/messages`)
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(data => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingMessages(false));
  }, [lead.id]);

  useEffect(() => {
    if (!editing) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(lead.id, formData);
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = 'w-full px-3 py-2 rounded-xl text-sm transition-colors duration-150 outline-none bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30';

  const labelClasses = 'block text-xs font-medium mb-1.5 text-muted';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden bg-surface border-border">

          {/* Header */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {editing && (
                  <button
                    onClick={() => setEditing(false)}
                    className="p-1 rounded-xl transition-colors text-muted hover:text-foreground hover:bg-surface-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {lead.name}
                  </h2>
                  <p className="text-xs font-mono mt-0.5 text-muted">
                    {lead.phone} · {lead.stage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-xl transition-colors text-muted hover:text-foreground hover:bg-surface-2"
                    title="Editar lead"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl transition-colors text-muted hover:text-foreground hover:bg-surface-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelClasses}>Nombre</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClasses} placeholder="Nombre del contacto" />
              </div>
              <div>
                <label className={labelClasses}>Empresa</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className={inputClasses} placeholder="Nombre de la empresa" />
              </div>
              <div>
                <label className={labelClasses}>Email</label>
                <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} className={inputClasses} placeholder="email@empresa.com" />
              </div>
              <div>
                <label className={labelClasses}>Valor del trato (MXN)</label>
                <input type="number" value={formData.dealValue} onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })} className={inputClasses} placeholder="0" min="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Etapa</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })} className={inputClasses}>
                    {stages.sort((a, b) => a.position - b.position).map((stage) => (
                      <option key={stage.id} value={stage.name}>{stage.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Prioridad</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })} className={inputClasses}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 text-muted hover:text-foreground hover:bg-surface-2">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-foreground text-background hover:bg-foreground/90">
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {/* Conversation (default view) */}
          {!editing && (
            <div className="flex flex-col" style={{ height: '420px' }}>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-muted" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageCircle className="w-6 h-6 mb-2 text-muted" />
                    <span className="text-xs font-mono text-muted">Sin mensajes</span>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-terminal-green/10 text-foreground rounded-br-sm'
                          : 'bg-surface border border-border rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] mt-1 text-muted">
                          {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LeadDetailModal);

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ExternalLink } from 'lucide-react';
import { Lead } from './LeadCard';
import { PipelineStage } from './KanbanColumn';

interface LeadDetailModalProps {
  lead: Lead;
  stages: PipelineStage[];
  onClose: () => void;
  onSave: (leadId: string, data: Partial<Lead>) => Promise<void>;
  isDarkMode?: boolean;
}

export default function LeadDetailModal({ lead, stages, onClose, onSave, isDarkMode = false }: LeadDetailModalProps) {
  const [formData, setFormData] = useState({
    name: lead.name,
    companyName: lead.companyName || '',
    contactEmail: lead.contactEmail || '',
    dealValue: lead.dealValue || 0,
    stage: lead.stage,
    priority: lead.priority,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(lead.id, formData);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = `
    w-full px-3 py-2 rounded-lg text-sm
    transition-all duration-200 outline-none
    ${isDarkMode
      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700'
      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300'
    }
  `;

  const labelClasses = `block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-black/50'} backdrop-blur-sm`}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`
              relative w-full max-w-md rounded-xl border shadow-2xl overflow-hidden
              ${isDarkMode
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-white border-zinc-200'
              }
            `}
          >
            {/* Header */}
            <div className={`
              flex items-center justify-between px-5 py-4 border-b
              ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}
            `}>
              <div>
                <h2 className={`text-base font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Editar Lead
                </h2>
                <p className={`text-xs font-mono mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {lead.phone}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`
                  p-1.5 rounded-lg transition-colors
                  ${isDarkMode
                    ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                  }
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className={labelClasses}>Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                  placeholder="Nombre del contacto"
                />
              </div>

              {/* Company */}
              <div>
                <label className={labelClasses}>Empresa</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={inputClasses}
                  placeholder="Nombre de la empresa"
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className={inputClasses}
                  placeholder="email@empresa.com"
                />
              </div>

              {/* Deal Value */}
              <div>
                <label className={labelClasses}>Valor del trato (MXN)</label>
                <input
                  type="number"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                  className={inputClasses}
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Stage & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Etapa</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className={inputClasses}
                  >
                    {stages
                      .sort((a, b) => a.position - b.position)
                      .map((stage) => (
                        <option key={stage.id} value={stage.name}>
                          {stage.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                    className={inputClasses}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              {/* Conversation Link */}
              {lead.conversationCount && lead.conversationCount > 0 && (
                <a
                  href={`/loomi/dashboard/conversations?lead=${lead.id}`}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    transition-colors duration-200 group
                    ${isDarkMode
                      ? 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{lead.conversationCount} conversaciones</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}

              {/* Actions */}
              <div className={`flex gap-2 pt-2 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isDarkMode
                      ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
                      : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'
                    }
                  `}
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={isSaving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`
                    flex-1 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDarkMode
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }
                  `}
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

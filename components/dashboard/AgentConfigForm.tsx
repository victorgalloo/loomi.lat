'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MessageSquare, Sliders, Sparkles, Check } from 'lucide-react';

interface AgentConfig {
  businessName: string | null;
  businessDescription: string | null;
  productsServices: string | null;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  customInstructions: string | null;
  autoReplyEnabled: boolean;
  greetingMessage: string | null;
  fallbackMessage: string | null;
}

interface AgentConfigFormProps {
  initialConfig: AgentConfig;
  onSave: (config: Partial<AgentConfig>) => Promise<void>;
}

const toneOptions = [
  { value: 'professional', label: 'Profesional', description: 'Formal pero accesible', color: 'info' },
  { value: 'friendly', label: 'Amigable', description: 'Cercano y conversacional', color: 'info' },
  { value: 'casual', label: 'Casual', description: 'Relajado e informal', color: 'info' },
  { value: 'formal', label: 'Formal', description: 'Muy profesional y serio', color: 'info' },
];

export default function AgentConfigForm({ initialConfig, onSave }: AgentConfigFormProps) {
  const [config, setConfig] = useState<AgentConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await onSave(config);
      setSaveMessage({ type: 'success', text: 'Configuracion guardada exitosamente' });
    } catch {
      setSaveMessage({ type: 'error', text: 'Error al guardar la configuracion' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof AgentConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const inputClasses = `
    w-full px-4 py-3 bg-background border border-border rounded-xl
    text-foreground placeholder:text-muted
    focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info
    transition-all duration-200
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 blur-[60px] rounded-full pointer-events-none" />

        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-info" />
          Informacion del negocio
        </h2>
        <p className="text-sm text-muted mb-6">
          Esta informacion ayuda al agente a entender tu negocio y responder mejor a los clientes.
        </p>

        <div className="space-y-4 relative z-10">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-foreground mb-2">
              Nombre del negocio
            </label>
            <input
              type="text"
              id="businessName"
              value={config.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Ej: Clinica Dental Sonrisa"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="businessDescription" className="block text-sm font-medium text-foreground mb-2">
              Descripcion del negocio
            </label>
            <textarea
              id="businessDescription"
              value={config.businessDescription || ''}
              onChange={(e) => handleChange('businessDescription', e.target.value)}
              rows={3}
              placeholder="Describe brevemente que hace tu negocio..."
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="productsServices" className="block text-sm font-medium text-foreground mb-2">
              Productos o servicios principales
            </label>
            <textarea
              id="productsServices"
              value={config.productsServices || ''}
              onChange={(e) => handleChange('productsServices', e.target.value)}
              rows={3}
              placeholder="Lista los productos o servicios que ofreces..."
              className={inputClasses}
            />
          </div>
        </div>
      </motion.div>

      {/* Tone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-info" />
          Tono de comunicacion
        </h2>
        <p className="text-sm text-muted mb-6">
          Elige como quieres que el agente se comunique con tus clientes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toneOptions.map((option) => {
            const isSelected = config.tone === option.value;
            const colorClasses: Record<string, string> = {
              info: isSelected ? 'border-info bg-info/10' : 'border-border hover:border-info/50 hover:bg-info/5',
            };
            const textColors: Record<string, string> = {
              info: 'text-info',
            };
            const dotColors: Record<string, string> = {
              info: 'bg-info',
            };

            return (
              <motion.label
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300
                  ${colorClasses[option.color]}
                `}
              >
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleChange('tone', option.value as AgentConfig['tone'])}
                  className="sr-only"
                />
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                  ${isSelected ? 'border-info' : 'border-muted'}
                `}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-2.5 h-2.5 rounded-full ${dotColors[option.color]}`}
                    />
                  )}
                </div>
                <div>
                  <span className={`font-medium ${isSelected ? textColors[option.color] : 'text-foreground'}`}>
                    {option.label}
                  </span>
                  <p className="text-sm text-muted">{option.description}</p>
                </div>
                {isSelected && (
                  <Check className={`absolute top-4 right-4 w-4 h-4 ${textColors[option.color]}`} />
                )}
              </motion.label>
            );
          })}
        </div>
      </motion.div>

      {/* Custom Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-info/5 blur-[60px] rounded-full pointer-events-none" />

        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-info" />
          Instrucciones personalizadas
        </h2>
        <p className="text-sm text-muted mb-6">
          Agrega instrucciones especificas para que el agente siga al responder.
        </p>

        <textarea
          id="customInstructions"
          value={config.customInstructions || ''}
          onChange={(e) => handleChange('customInstructions', e.target.value)}
          rows={5}
          placeholder="Ej: Siempre menciona que tenemos envio gratis en compras mayores a $500. No ofrezcas descuentos sin autorizacion..."
          className={inputClasses}
        />
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-info" />
          Mensajes predeterminados
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="greetingMessage" className="block text-sm font-medium text-foreground mb-2">
              Mensaje de saludo (opcional)
            </label>
            <textarea
              id="greetingMessage"
              value={config.greetingMessage || ''}
              onChange={(e) => handleChange('greetingMessage', e.target.value)}
              rows={2}
              placeholder="Mensaje que se envia cuando un nuevo cliente escribe por primera vez..."
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="fallbackMessage" className="block text-sm font-medium text-foreground mb-2">
              Mensaje de fallback (opcional)
            </label>
            <textarea
              id="fallbackMessage"
              value={config.fallbackMessage || ''}
              onChange={(e) => handleChange('fallbackMessage', e.target.value)}
              rows={2}
              placeholder="Mensaje cuando el agente no puede responder..."
              className={inputClasses}
            />
          </div>
        </div>
      </motion.div>

      {/* Auto Reply Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface-elevated rounded-2xl border border-border p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Respuestas automaticas</h2>
            <p className="text-sm text-muted mt-1">
              Cuando esta activo, el agente responde automaticamente a todos los mensajes.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.autoReplyEnabled}
            onClick={() => handleChange('autoReplyEnabled', !config.autoReplyEnabled)}
            className={`
              relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-info/20 focus:ring-offset-2
              ${config.autoReplyEnabled ? 'bg-info' : 'bg-surface-2'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out
                ${config.autoReplyEnabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between pt-4"
      >
        {saveMessage && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-sm flex items-center gap-1 ${saveMessage.type === 'success' ? 'text-info' : 'text-red-600'}`}
          >
            {saveMessage.type === 'success' && <Check className="w-4 h-4" />}
            {saveMessage.text}
          </motion.p>
        )}
        <motion.button
          type="submit"
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            ml-auto px-6 py-3 rounded-xl font-medium transition-all duration-300
            ${isSaving
              ? 'bg-surface-2 text-muted cursor-not-allowed'
              : 'bg-info text-white hover:bg-info/90 shadow-lg shadow-info/20'
            }
          `}
        >
          {isSaving ? 'Guardando...' : 'Guardar configuracion'}
        </motion.button>
      </motion.div>
    </form>
  );
}

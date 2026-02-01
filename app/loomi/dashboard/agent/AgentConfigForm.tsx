'use client';

import { useState } from 'react';
import { useTheme } from '@/components/dashboard/ThemeProvider';

interface AgentConfig {
  businessName: string | null;
  businessDescription: string | null;
  productsServices: string | null;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  customInstructions: string | null;
  autoReplyEnabled: boolean;
}

interface AgentConfigFormProps {
  initialConfig: AgentConfig;
  onSave: (config: Partial<AgentConfig>) => Promise<void>;
}

export default function AgentConfigForm({ initialConfig, onSave }: AgentConfigFormProps) {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<AgentConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);

    try {
      await onSave(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof AgentConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const labelClass = `block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`;
  const inputClass = `
    w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors
    ${isDark
      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-700'
      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'
    }
  `;

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Agente
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Configura cómo responde tu agente AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Info */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre del negocio</label>
            <input
              type="text"
              value={config.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Ej: Clínica Dental Sonrisa"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <textarea
              value={config.businessDescription || ''}
              onChange={(e) => handleChange('businessDescription', e.target.value)}
              rows={3}
              placeholder="Qué hace tu negocio..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Productos o servicios</label>
            <textarea
              value={config.productsServices || ''}
              onChange={(e) => handleChange('productsServices', e.target.value)}
              rows={3}
              placeholder="Lista tus productos o servicios principales..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Tone */}
        <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <label className={labelClass}>Tono</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(['professional', 'friendly', 'casual', 'formal'] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => handleChange('tone', tone)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg transition-colors
                  ${config.tone === tone
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-zinc-900 text-white'
                    : isDark
                      ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }
                `}
              >
                {tone === 'professional' && 'Profesional'}
                {tone === 'friendly' && 'Amigable'}
                {tone === 'casual' && 'Casual'}
                {tone === 'formal' && 'Formal'}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <label className={labelClass}>Instrucciones adicionales</label>
          <textarea
            value={config.customInstructions || ''}
            onChange={(e) => handleChange('customInstructions', e.target.value)}
            rows={4}
            placeholder="Instrucciones específicas para el agente..."
            className={inputClass}
          />
        </div>

        {/* Auto Reply */}
        <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Respuestas automáticas
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                El agente responde automáticamente
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('autoReplyEnabled', !config.autoReplyEnabled)}
              className={`
                w-10 h-6 rounded-full transition-colors relative
                ${config.autoReplyEnabled
                  ? 'bg-emerald-500'
                  : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                }
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${config.autoReplyEnabled ? 'left-5' : 'left-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${saved ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-transparent'}`}>
              Guardado
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                disabled:opacity-50
                ${isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              `}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

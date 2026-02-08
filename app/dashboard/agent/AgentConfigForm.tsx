'use client';

import { useState } from 'react';
import Link from 'next/link';

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

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-medium text-foreground font-mono">
          ./agente_
        </h1>
        <p className="text-sm mt-1 text-muted">
          Configura cómo responde tu agente AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2 text-muted font-mono">nombre del negocio</label>
            <input
              type="text"
              value={config.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Ej: Clínica Dental Sonrisa"
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2 text-muted font-mono">descripción</label>
            <textarea
              value={config.businessDescription || ''}
              onChange={(e) => handleChange('businessDescription', e.target.value)}
              rows={3}
              placeholder="Qué hace tu negocio..."
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2 text-muted font-mono">productos o servicios</label>
            <textarea
              value={config.productsServices || ''}
              onChange={(e) => handleChange('productsServices', e.target.value)}
              rows={3}
              placeholder="Lista tus productos o servicios principales..."
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
          </div>
        </div>

        {/* Tone */}
        <div className="pt-6 border-t border-border">
          <label className="block text-xs font-medium mb-2 text-muted font-mono">tono</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(['professional', 'friendly', 'casual', 'formal'] as const).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => handleChange('tone', tone)}
                className={`px-3 py-1.5 text-sm rounded-xl transition-colors font-mono ${
                  config.tone === tone
                    ? 'bg-foreground text-background'
                    : 'bg-surface text-muted hover:text-foreground border border-border'
                }`}
              >
                {tone === 'professional' && 'profesional'}
                {tone === 'friendly' && 'amigable'}
                {tone === 'casual' && 'casual'}
                {tone === 'formal' && 'formal'}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="pt-6 border-t border-border">
          <label className="block text-xs font-medium mb-2 text-muted font-mono">instrucciones adicionales</label>
          <textarea
            value={config.customInstructions || ''}
            onChange={(e) => handleChange('customInstructions', e.target.value)}
            rows={4}
            placeholder="Instrucciones específicas para el agente..."
            className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
          />
        </div>

        {/* Auto Reply */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">
                Respuestas automáticas
              </p>
              <p className="text-xs mt-0.5 text-muted">
                El agente responde automáticamente
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('autoReplyEnabled', !config.autoReplyEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                config.autoReplyEnabled
                  ? 'bg-terminal-green'
                  : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-background rounded-full transition-transform ${
                  config.autoReplyEnabled ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <span className={`text-sm text-info font-mono ${saved ? 'opacity-100' : 'opacity-0'}`}>
              guardado
            </span>
            <div className="flex gap-3">
              <Link
                href="/dashboard/agent/prompt"
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border font-mono"
              >
                prompt avanzado
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 font-mono"
              >
                {isSaving ? 'guardando...' : './guardar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

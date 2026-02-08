'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FewShotExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

interface PromptConfig {
  systemPrompt: string | null;
  fewShotExamples: FewShotExample[];
  productsCatalog: Record<string, unknown>;
}

interface PromptEditorFormProps {
  initialConfig: PromptConfig;
  onSave: (config: Partial<PromptConfig>) => Promise<void>;
}

export default function PromptEditorForm({ initialConfig, onSave }: PromptEditorFormProps) {
  const [config, setConfig] = useState<PromptConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'examples' | 'products'>('prompt');
  const [newExample, setNewExample] = useState<Partial<FewShotExample>>({
    id: '',
    tags: [],
    context: '',
    conversation: '',
    whyItWorked: ''
  });
  const [tagsInput, setTagsInput] = useState('');

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

  const handlePromptChange = (value: string) => {
    setConfig(prev => ({ ...prev, systemPrompt: value || null }));
  };

  const handleProductsCatalogChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setConfig(prev => ({ ...prev, productsCatalog: parsed }));
    } catch {
      // Invalid JSON, don't update
    }
  };

  const addExample = () => {
    if (!newExample.id || !newExample.context || !newExample.conversation) return;

    const example: FewShotExample = {
      id: newExample.id,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      context: newExample.context,
      conversation: newExample.conversation,
      whyItWorked: newExample.whyItWorked || ''
    };

    setConfig(prev => ({
      ...prev,
      fewShotExamples: [...prev.fewShotExamples, example]
    }));

    setNewExample({
      id: '',
      tags: [],
      context: '',
      conversation: '',
      whyItWorked: ''
    });
    setTagsInput('');
  };

  const removeExample = (id: string) => {
    setConfig(prev => ({
      ...prev,
      fewShotExamples: prev.fewShotExamples.filter(e => e.id !== id)
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header with navigation */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 font-mono">
          <Link
            href="/dashboard/agent"
            className="text-sm text-muted hover:text-foreground"
          >
            ./agente
          </Link>
          <span className="text-sm text-border">/</span>
          <span className="text-sm text-foreground">prompt</span>
        </div>
        <h1 className="text-xl font-medium text-foreground font-mono">
          ./prompt-personalizado_
        </h1>
        <p className="text-sm mt-1 text-muted">
          Personaliza el comportamiento del agente con un prompt custom
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors font-mono ${
            activeTab === 'prompt'
              ? 'bg-foreground text-background'
              : 'text-muted hover:text-foreground hover:bg-surface'
          }`}
        >
          system prompt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('examples')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors font-mono ${
            activeTab === 'examples'
              ? 'bg-foreground text-background'
              : 'text-muted hover:text-foreground hover:bg-surface'
          }`}
        >
          ejemplos ({config.fewShotExamples.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors font-mono ${
            activeTab === 'products'
              ? 'bg-foreground text-background'
              : 'text-muted hover:text-foreground hover:bg-surface'
          }`}
        >
          productos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* System Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                system prompt
                <span className="ml-2 text-xs text-muted/50">
                  (deja vacío para usar el prompt por defecto)
                </span>
              </label>
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={20}
                placeholder={`Eres [Nombre], asistente de [Tu Negocio]...

# QUIEN ERES
Describe la personalidad y rol del agente...

# PRODUCTOS/SERVICIOS
Lista tus productos o servicios...

# COMO RESPONDES
Define el tono y estilo de respuestas...

# HERRAMIENTAS DISPONIBLES
- escalate_to_human: Transferir a humano
- send_payment_link: Enviar link de pago`}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono text-xs leading-relaxed"
              />
              <p className="mt-2 text-xs text-muted">
                El prompt define completamente como se comporta tu agente. Si no defines uno,
                se usará el prompt por defecto optimizado para venta de seguros.
              </p>
            </div>
          </div>
        )}

        {/* Few-Shot Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-6">
            {/* Existing Examples */}
            {config.fewShotExamples.length > 0 && (
              <div className="space-y-4">
                <label className="block text-label font-medium mb-2.5 text-muted">ejemplos guardados</label>
                {config.fewShotExamples.map((example) => (
                  <div
                    key={example.id}
                    className="p-4 rounded-2xl border border-border bg-surface"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground font-mono">
                          {example.id}
                        </span>
                        <span className="ml-2 text-xs text-muted">
                          {example.context}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExample(example.id)}
                        className="text-xs text-terminal-red hover:text-terminal-red/80 font-mono"
                      >
                        eliminar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {example.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded bg-surface-2 text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <pre className="text-xs whitespace-pre-wrap text-muted">
                      {example.conversation.substring(0, 200)}...
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Example */}
            <div className="p-4 rounded-2xl border border-border">
              <label className="block text-label font-medium mb-2.5 text-muted">agregar nuevo ejemplo</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newExample.id || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="ID del ejemplo (ej: new_lead_crypto)"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags separados por coma (ej: hola, bitcoin, precio)"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
                <input
                  type="text"
                  value={newExample.context || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Contexto (ej: Lead nuevo preguntando por Bitcoin)"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
                <textarea
                  value={newExample.conversation || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, conversation: e.target.value }))}
                  rows={6}
                  placeholder={`Conversación de ejemplo:
Cliente: Hola, vi su contenido sobre Bitcoin
Agente: Hola! Qué bueno que escribiste. ¿Qué te interesa saber sobre Bitcoin?`}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
                <input
                  type="text"
                  value={newExample.whyItWorked || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, whyItWorked: e.target.value }))}
                  placeholder="Por qué funcionó (ej: Fue cálido y preguntó qué le interesa)"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
                />
                <button
                  type="button"
                  onClick={addExample}
                  disabled={!newExample.id || !newExample.context || !newExample.conversation}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface text-muted hover:text-foreground border border-border"
                >
                  agregar ejemplo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Catalog Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                catálogo de productos (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.productsCatalog, null, 2)}
                onChange={(e) => handleProductsCatalogChange(e.target.value)}
                rows={15}
                placeholder={`{
  "cursos": [
    {
      "nombre": "Bitcoin Básico",
      "precio": 99,
      "descripcion": "Aprende los fundamentos de Bitcoin"
    }
  ],
  "membresias": [
    {
      "nombre": "Premium",
      "precio_mensual": 29,
      "beneficios": ["Acceso a videos", "Comunidad privada"]
    }
  ]
}`}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono text-xs"
              />
              <p className="mt-2 text-xs text-muted">
                Define tu catálogo de productos/servicios en formato JSON.
                El agente usará esta información para responder preguntas sobre precios y disponibilidad.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <span className={`text-sm text-terminal-green font-mono ${saved ? 'opacity-100' : 'opacity-0'}`}>
              guardado
            </span>
            <div className="flex gap-3">
              <Link
                href="/dashboard/agent"
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border font-mono"
              >
                config básica
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

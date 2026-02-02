'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/dashboard/ThemeProvider';

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
  const { isDark } = useTheme();
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

  const labelClass = `block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`;
  const inputClass = `
    w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors
    ${isDark
      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-700'
      : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'
    }
  `;
  const tabClass = (isActive: boolean) => `
    px-4 py-2 text-sm font-medium rounded-lg transition-colors
    ${isActive
      ? isDark
        ? 'bg-white text-black'
        : 'bg-zinc-900 text-white'
      : isDark
        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
    }
  `;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header with navigation */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard/agent"
            className={`text-sm ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Agente
          </Link>
          <span className={`text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>/</span>
          <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Prompt Personalizado</span>
        </div>
        <h1 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Prompt Personalizado
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Personaliza el comportamiento del agente con un prompt custom
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={tabClass(activeTab === 'prompt')}
        >
          System Prompt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('examples')}
          className={tabClass(activeTab === 'examples')}
        >
          Ejemplos ({config.fewShotExamples.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={tabClass(activeTab === 'products')}
        >
          Productos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* System Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                System Prompt
                <span className={`ml-2 text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  (Deja vacio para usar el prompt por defecto de seguros)
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
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
              <p className={`mt-2 text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                El prompt define completamente como se comporta tu agente. Si no defines uno,
                se usara el prompt por defecto optimizado para venta de seguros.
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
                <label className={labelClass}>Ejemplos Guardados</label>
                {config.fewShotExamples.map((example) => (
                  <div
                    key={example.id}
                    className={`p-4 rounded-lg border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {example.id}
                        </span>
                        <span className={`ml-2 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          {example.context}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExample(example.id)}
                        className={`text-xs ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {example.tags.map(tag => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-xs rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <pre className={`text-xs whitespace-pre-wrap ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {example.conversation.substring(0, 200)}...
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Example */}
            <div className={`p-4 rounded-lg border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <label className={labelClass}>Agregar Nuevo Ejemplo</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newExample.id || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="ID del ejemplo (ej: new_lead_crypto)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Tags separados por coma (ej: hola, bitcoin, precio)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={newExample.context || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Contexto (ej: Lead nuevo preguntando por Bitcoin)"
                  className={inputClass}
                />
                <textarea
                  value={newExample.conversation || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, conversation: e.target.value }))}
                  rows={6}
                  placeholder={`Conversacion de ejemplo:
Cliente: Hola, vi su contenido sobre Bitcoin
Agente: Hola! Que bueno que escribiste. Que te interesa saber sobre Bitcoin?`}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={newExample.whyItWorked || ''}
                  onChange={(e) => setNewExample(prev => ({ ...prev, whyItWorked: e.target.value }))}
                  placeholder="Por que funciono (ej: Fue calido y pregunto que le interesa)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addExample}
                  disabled={!newExample.id || !newExample.context || !newExample.conversation}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDark
                      ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                      : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                    }
                  `}
                >
                  Agregar Ejemplo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Catalog Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Catalogo de Productos (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.productsCatalog, null, 2)}
                onChange={(e) => handleProductsCatalogChange(e.target.value)}
                rows={15}
                placeholder={`{
  "cursos": [
    {
      "nombre": "Bitcoin Basico",
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
                className={`${inputClass} font-mono text-xs`}
              />
              <p className={`mt-2 text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Define tu catalogo de productos/servicios en formato JSON.
                El agente usara esta informacion para responder preguntas sobre precios y disponibilidad.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className={`pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${saved ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-transparent'}`}>
              Guardado
            </span>
            <div className="flex gap-3">
              <Link
                href="/dashboard/agent"
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isDark
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }
                `}
              >
                Configuracion Basica
              </Link>
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
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

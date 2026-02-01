'use client';

import { useState } from 'react';

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
  { value: 'professional', label: 'Profesional', description: 'Formal pero accesible' },
  { value: 'friendly', label: 'Amigable', description: 'Cercano y conversacional' },
  { value: 'casual', label: 'Casual', description: 'Relajado e informal' },
  { value: 'formal', label: 'Formal', description: 'Muy profesional y serio' },
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion del negocio</h2>
        <p className="text-sm text-gray-600 mb-6">
          Esta informacion ayuda al agente a entender tu negocio y responder mejor a los clientes.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              id="businessName"
              value={config.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="Ej: Clinica Dental Sonrisa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion del negocio
            </label>
            <textarea
              id="businessDescription"
              value={config.businessDescription || ''}
              onChange={(e) => handleChange('businessDescription', e.target.value)}
              rows={3}
              placeholder="Describe brevemente que hace tu negocio..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="productsServices" className="block text-sm font-medium text-gray-700 mb-1">
              Productos o servicios principales
            </label>
            <textarea
              id="productsServices"
              value={config.productsServices || ''}
              onChange={(e) => handleChange('productsServices', e.target.value)}
              rows={3}
              placeholder="Lista los productos o servicios que ofreces..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tone */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tono de comunicacion</h2>
        <p className="text-sm text-gray-600 mb-6">
          Elige como quieres que el agente se comunique con tus clientes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toneOptions.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors
                ${config.tone === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={config.tone === option.value}
                onChange={() => handleChange('tone', option.value as AgentConfig['tone'])}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-900">{option.label}</span>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones personalizadas</h2>
        <p className="text-sm text-gray-600 mb-6">
          Agrega instrucciones especificas para que el agente siga al responder.
        </p>

        <textarea
          id="customInstructions"
          value={config.customInstructions || ''}
          onChange={(e) => handleChange('customInstructions', e.target.value)}
          rows={5}
          placeholder="Ej: Siempre menciona que tenemos envio gratis en compras mayores a $500. No ofrezcas descuentos sin autorizacion..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mensajes predeterminados</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="greetingMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de saludo (opcional)
            </label>
            <textarea
              id="greetingMessage"
              value={config.greetingMessage || ''}
              onChange={(e) => handleChange('greetingMessage', e.target.value)}
              rows={2}
              placeholder="Mensaje que se envia cuando un nuevo cliente escribe por primera vez..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="fallbackMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de fallback (opcional)
            </label>
            <textarea
              id="fallbackMessage"
              value={config.fallbackMessage || ''}
              onChange={(e) => handleChange('fallbackMessage', e.target.value)}
              rows={2}
              placeholder="Mensaje cuando el agente no puede responder..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Auto Reply Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Respuestas automaticas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cuando esta activo, el agente responde automaticamente a todos los mensajes.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.autoReplyEnabled}
            onClick={() => handleChange('autoReplyEnabled', !config.autoReplyEnabled)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              ${config.autoReplyEnabled ? 'bg-green-500' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${config.autoReplyEnabled ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {saveMessage && (
          <p className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {saveMessage.text}
          </p>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className={`
            ml-auto px-6 py-3 rounded-lg font-medium text-white transition-colors
            ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          {isSaving ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </form>
  );
}

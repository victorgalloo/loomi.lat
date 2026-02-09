'use client';

import { useState, useTransition } from 'react';
import { AgentConfig } from '@/lib/tenant/context';
import { useRouter } from 'next/navigation';

interface ExtractedConfig {
  systemPrompt: string;
  productContext: string;
  pricingContext: string;
  salesProcessContext: string;
  qualificationContext: string;
  competitorContext: string;
  objectionHandlers: Record<string, string>;
  agentName: string;
  agentRole: string;
  fewShotExamples: Array<{
    id: string;
    tags: string[];
    context: string;
    conversation: string;
    whyItWorked: string;
  }>;
}

interface ProcessResponse {
  extracted: ExtractedConfig;
  confidence: number;
  suggestions: string[];
}

interface AgentSetupWizardProps {
  existingConfig: AgentConfig | null;
  onSave: (config: Partial<Omit<AgentConfig, 'id' | 'tenantId'>>) => Promise<void>;
}

const STEPS = [
  { label: 'Alimentar', title: 'Alimenta a tu agente' },
  { label: 'Revisar', title: 'Revisa y ajusta' },
  { label: 'Activar', title: 'Prompt final' },
];

const LOADING_MESSAGES = [
  'Analizando tu negocio...',
  'Extrayendo productos y servicios...',
  'Entendiendo tu tono de comunicación...',
  'Identificando objeciones comunes...',
  'Generando proceso de venta...',
  'Configurando tu agente...',
];

export default function AgentSetupWizard({ existingConfig, onSave }: AgentSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [rawContent, setRawContent] = useState('');
  const [contentType, setContentType] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedConfig | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSaving, startSaveTransition] = useTransition();

  // Editable fields (step 2)
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [productContext, setProductContext] = useState('');
  const [pricingContext, setPricingContext] = useState('');
  const [salesProcessContext, setSalesProcessContext] = useState('');
  const [qualificationContext, setQualificationContext] = useState('');
  const [competitorContext, setCompetitorContext] = useState('');
  const [objectionHandlers, setObjectionHandlers] = useState<Record<string, string>>({});

  // Step 3
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleProcess = async () => {
    if (!rawContent.trim()) return;

    setIsProcessing(true);
    setError(null);
    setLoadingMsgIndex(0);

    // Cycle through loading messages
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const res = await fetch('/api/agent-setup/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent,
          contentType,
          existingConfig: existingConfig ? {
            businessName: existingConfig.businessName,
            businessDescription: existingConfig.businessDescription,
          } : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar');
      }

      const data: ProcessResponse = await res.json();
      setExtracted(data.extracted);
      setConfidence(data.confidence);
      setSuggestions(data.suggestions);

      // Populate editable fields
      setAgentName(data.extracted.agentName);
      setAgentRole(data.extracted.agentRole);
      setProductContext(data.extracted.productContext);
      setPricingContext(data.extracted.pricingContext);
      setSalesProcessContext(data.extracted.salesProcessContext);
      setQualificationContext(data.extracted.qualificationContext);
      setCompetitorContext(data.extracted.competitorContext);
      setObjectionHandlers(data.extracted.objectionHandlers);
      setSystemPrompt(data.extracted.systemPrompt);

      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await onSave({
          systemPrompt,
          productContext,
          pricingContext,
          salesProcessContext,
          qualificationContext,
          competitorContext,
          objectionHandlers,
          agentName,
          agentRole,
          analysisEnabled: true,
          fewShotExamples: extracted?.fewShotExamples || [],
        });
        router.push('/dashboard/agent');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  };

  const getConfidenceColor = (value: number) => {
    if (value >= 0.7) return 'text-terminal-green';
    if (value >= 0.4) return 'text-terminal-yellow';
    return 'text-terminal-red';
  };

  const getConfidenceBg = (value: number) => {
    if (value >= 0.7) return 'bg-terminal-green/10 border-terminal-green/20';
    if (value >= 0.4) return 'bg-terminal-yellow/10 border-terminal-yellow/20';
    return 'bg-terminal-red/10 border-terminal-red/20';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
          <span className="ml-2 text-sm font-mono text-muted">./agent_setup</span>
        </div>

        {/* Step indicator */}
        <div className="px-4 py-4 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-mono border ${
                i === step
                  ? 'bg-foreground text-background border-foreground'
                  : i < step
                    ? 'bg-terminal-green/20 text-terminal-green border-terminal-green/30'
                    : 'bg-surface-2 text-muted border-border'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-foreground' : 'text-muted'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${i < step ? 'bg-terminal-green/30' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Ingest content */}
      {step === 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {STEPS[0].title}
          </h2>
          <p className="text-body text-muted mb-6">
            Pega aquí todo lo que tengas: conversaciones de WhatsApp, textos de tu web, correos, artículos, catálogos... Entre más le des, mejor te entiende.
          </p>

          {/* Content type hints */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'conversations', label: 'Conversaciones' },
              { value: 'website', label: 'Página web' },
              { value: 'articles', label: 'Emails / Artículos' },
              { value: 'mixed', label: 'Mixto' },
            ].map(ct => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value === contentType ? undefined : ct.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  contentType === ct.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>

          <textarea
            value={rawContent}
            onChange={e => setRawContent(e.target.value)}
            placeholder="Pega aquí el contenido de tu negocio..."
            className="w-full h-64 bg-background border border-border rounded-lg p-4 text-body text-foreground placeholder:text-muted resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted">
              {rawContent.length.toLocaleString()} caracteres
            </span>
            <button
              onClick={handleProcess}
              disabled={!rawContent.trim() || isProcessing}
              className="px-6 py-2.5 bg-foreground text-background rounded-lg font-medium text-body transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {isProcessing ? LOADING_MESSAGES[loadingMsgIndex] : 'Procesar con IA'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-terminal-red/10 border border-terminal-red/20 rounded-lg text-sm text-terminal-red">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Review extracted fields */}
      {step === 1 && extracted && (
        <div className="space-y-4">
          {/* Confidence badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getConfidenceBg(confidence)}`}>
            <span className={`text-sm font-mono ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}% confianza
            </span>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 bg-terminal-yellow/10 border border-terminal-yellow/20 rounded-lg">
              <p className="text-sm font-medium text-terminal-yellow mb-1">Sugerencias para mejorar:</p>
              <ul className="text-sm text-muted space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>- {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent identity */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Identidad del agente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label text-muted mb-1">Nombre</label>
                <input
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="block text-label text-muted mb-1">Rol</label>
                <input
                  value={agentRole}
                  onChange={e => setAgentRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                />
              </div>
            </div>
          </div>

          {/* Editable cards */}
          {[
            { label: 'Producto / Servicio', value: productContext, setter: setProductContext },
            { label: 'Precios', value: pricingContext, setter: setPricingContext },
            { label: 'Proceso de venta', value: salesProcessContext, setter: setSalesProcessContext },
            { label: 'Criterios de calificación', value: qualificationContext, setter: setQualificationContext },
            { label: 'Competencia', value: competitorContext, setter: setCompetitorContext },
          ].map(field => (
            <div key={field.label} className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-2">{field.label}</h3>
              <textarea
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                rows={4}
                className="w-full bg-background border border-border rounded-lg p-3 text-body text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
          ))}

          {/* Objection handlers */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground mb-3">Manejo de objeciones</h3>
            <div className="space-y-3">
              {Object.entries(objectionHandlers).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-label text-muted mb-1 font-mono">{key}</label>
                  <textarea
                    value={value}
                    onChange={e => setObjectionHandlers(prev => ({ ...prev, [key]: e.target.value }))}
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg p-3 text-body text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Volver
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-foreground text-background rounded-lg font-medium text-body hover:opacity-90 transition-opacity"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Final prompt review */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {STEPS[2].title}
            </h2>
            <p className="text-body text-muted mb-4">
              Este es el prompt principal de tu agente. Puedes editarlo antes de activar.
            </p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={24}
              className="w-full bg-background border border-border rounded-lg p-4 text-body text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>

          {error && (
            <div className="p-3 bg-terminal-red/10 border border-terminal-red/20 rounded-lg text-sm text-terminal-red">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-terminal-green text-background rounded-lg font-medium text-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Activar agente'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

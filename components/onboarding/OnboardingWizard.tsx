'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Check,
  CheckCircle,
  Loader2,
  RotateCcw,
  Brain,
  Sparkles,
  Heart,
  Zap,
  MessageSquare,
  TrendingUp,
  Shield,
  CreditCard,
  UserCheck,
  Phone,
  Plus,
  ArrowRight,
  ListChecks,
  ExternalLink
} from 'lucide-react';
import WhatsAppConnectFlow from '@/components/dashboard/WhatsAppConnectFlow';
import TwilioNumberProvisioning from '@/components/dashboard/TwilioNumberProvisioning';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  agentInfo?: AgentInfo;
}

interface AgentInfo {
  escalatedToHuman?: { reason: string; summary: string } | null;
  paymentLinkSent?: { plan: string; email: string } | null;
  detectedIndustry?: string | null;
  saidLater?: boolean;
}

interface ExtractedConfig {
  businessName: string;
  businessDescription: string;
  productsServices: string;
  tone: string;
  industry: string;
}

interface OnboardingWizardProps {
  tenantId: string;
  tenantEmail: string;
  hasWhatsApp?: boolean;
  existingConfig?: Partial<ExtractedConfig>;
}

const INITIAL_MESSAGE = `¡Hola! Voy a ayudarte a configurar tu agente de WhatsApp en menos de 2 minutos.

Empecemos: **¿Cómo se llama tu negocio?**`;

// Analysis steps shown during processing
const ANALYSIS_STEPS = [
  { icon: Brain, text: 'Analizando contexto...', color: 'text-blue-400' },
  { icon: Heart, text: 'Detectando sentimiento...', color: 'text-pink-400' },
  { icon: TrendingUp, text: 'Evaluando intención...', color: 'text-green-400' },
  { icon: Sparkles, text: 'Generando respuesta...', color: 'text-yellow-400' },
];

export function OnboardingWizard({
  tenantId,
  tenantEmail,
  hasWhatsApp = false,
  existingConfig,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<'chat' | 'test' | 'prerequisites' | 'connect' | 'saving'>('chat');
  const [connectMode, setConnectMode] = useState<'choose' | 'new' | 'existing' | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(hasWhatsApp);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedConfig, setExtractedConfig] = useState<ExtractedConfig | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Test chat state
  const [testMessages, setTestMessages] = useState<Message[]>([]);
  const [testInput, setTestInput] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showCapabilities, setShowCapabilities] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, testMessages]);

  // Animate through analysis steps
  useEffect(() => {
    if (isTestLoading) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % ANALYSIS_STEPS.length);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isTestLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }

      if (data.isComplete && data.extractedConfig) {
        setExtractedConfig(data.extractedConfig);
        setGeneratedPrompt(data.generatedPrompt || '');
        setTimeout(() => setStep('test'), 1500);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error. ¿Podrías repetir eso?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async (customMessage?: string) => {
    const msg = customMessage || testInput.trim();
    if (!msg || isTestLoading) return;

    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTestLoading(true);
    setShowCapabilities(false);
    setAnalysisStep(0);

    try {
      const res = await fetch('/api/onboarding/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          customSystemPrompt: generatedPrompt,
          conversationHistory: testMessages,
          ...extractedConfig,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setTestMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          agentInfo: data.agentInfo
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestLoading(false);
    }
  };

  const defaultConfig: ExtractedConfig = {
    businessName: 'Loomi',
    businessDescription: 'Plataforma SaaS de agentes de IA para WhatsApp. Automatiza ventas, califica leads y agenda demos 24/7.',
    productsServices: 'Agentes de IA para WhatsApp, automatización de ventas, calificación de leads, agendamiento de demos',
    tone: 'professional',
    industry: 'saas',
  };

  const saveAndFinish = async (useDefault = false) => {
    setStep('saving');
    const config = useDefault ? defaultConfig : (extractedConfig || defaultConfig);
    const prompt = useDefault ? '' : generatedPrompt;
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          customSystemPrompt: prompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setStep('connect');
    }
  };

  const resetOnboarding = () => {
    setMessages([{ role: 'assistant', content: INITIAL_MESSAGE }]);
    setExtractedConfig(null);
    setGeneratedPrompt('');
    setTestMessages([]);
    setShowCapabilities(true);
    setStep('chat');
  };

  // Quick prompts that showcase agent capabilities
  const quickPrompts = [
    { text: 'Hola, ¿qué ofrecen?', icon: MessageSquare, label: 'Saludo' },
    { text: '¿Cuánto cuesta? Es muy caro para mí', icon: TrendingUp, label: 'Objeción' },
    { text: 'Quiero hablar con una persona real', icon: UserCheck, label: 'Escalación' },
    { text: 'Ok, me interesa. ¿Cómo pago?', icon: CreditCard, label: 'Cierre' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Terminal window */}
        <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-elevated">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-xs text-muted font-mono ml-2">
              {step === 'chat' ? './setup' : step === 'test' ? './loomi-agent --live' : step === 'prerequisites' ? './check_requirements' : step === 'connect' ? './connect_whatsapp' : './deploy'}
            </span>
            {step === 'test' && (
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/20 rounded text-xs font-mono text-terminal-green">
                  <Zap className="w-3 h-3" />
                  GPT-5.2 + o3
                </span>
                <button
                  onClick={resetOnboarding}
                  className="text-muted hover:text-foreground"
                  title="Empezar de nuevo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Step indicators — pill tabs */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            {[
              { key: 'chat', label: 'Configurar' },
              { key: 'test', label: 'Probar' },
              { key: 'prerequisites', label: 'Preparar' },
              { key: 'connect', label: 'WhatsApp' },
            ].map((s) => {
              const steps = ['chat', 'test', 'prerequisites', 'connect', 'saving'];
              const currentIdx = steps.indexOf(step);
              const stepIdx = steps.indexOf(s.key);
              const isActive = step === s.key || (step === 'saving' && s.key === 'connect');
              const isDone = stepIdx < currentIdx;
              return (
                <div
                  key={s.key}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                    isDone ? 'bg-terminal-green/15 text-terminal-green' :
                    isActive ? 'bg-foreground text-background' :
                    'bg-surface-2 text-muted'
                  }`}
                >
                  {s.label}
                </div>
              );
            })}
          </div>

          {/* Prerequisites phase */}
          {step === 'prerequisites' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-terminal-yellow/10 border border-terminal-yellow/20 flex items-center justify-center">
                  <ListChecks className="w-5 h-5 text-terminal-yellow" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground font-mono">
                    Antes de conectar WhatsApp
                  </h2>
                  <p className="text-xs text-muted">
                    Verifica que tienes estos requisitos
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Item 1: Meta account */}
                <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-2xl">
                  <div className="w-5 h-5 rounded-full bg-terminal-green/10 border border-terminal-green/20 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-mono text-terminal-green font-bold">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Cuenta de Meta (Facebook)</p>
                    <p className="text-xs text-muted mt-0.5">Necesitas una cuenta personal de Facebook o Meta</p>
                    <a
                      href="https://www.facebook.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-terminal-green hover:underline mt-1.5 font-mono"
                    >
                      Crear cuenta <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Item 2: Meta Business Portfolio */}
                <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-2xl">
                  <div className="w-5 h-5 rounded-full bg-terminal-green/10 border border-terminal-green/20 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-mono text-terminal-green font-bold">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Meta Business Portfolio</p>
                    <p className="text-xs text-muted mt-0.5">Antes conocido como Business Manager — gestiona tus activos de negocio</p>
                    <a
                      href="https://business.facebook.com/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-terminal-green hover:underline mt-1.5 font-mono"
                    >
                      Crear Business Portfolio <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Item 3: WABA */}
                <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-2xl">
                  <div className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-mono text-muted font-bold">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">WhatsApp Business Account</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-terminal-yellow/10 border border-terminal-yellow/20 rounded text-xs font-mono text-terminal-yellow">
                        <Sparkles className="w-2.5 h-2.5" />
                        Se configura automáticamente
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">Se crea en el siguiente paso al conectar tu número</p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="px-3 py-2.5 bg-terminal-green/5 border border-terminal-green/10 rounded-2xl">
                <p className="text-xs text-terminal-green font-mono">
                  <span className="font-semibold">Tip:</span> Si ya tienes una cuenta de Meta Business, el proceso toma menos de 1 minuto
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setStep('connect')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl font-mono text-sm hover:opacity-90 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  Tengo todo listo
                </button>
                <button
                  onClick={() => saveAndFinish()}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-foreground font-mono transition-colors py-2"
                >
                  saltar y activar después
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Connect WhatsApp phase */}
          {step === 'connect' && (
            <div className="p-5">
              {whatsappConnected ? (
                /* Already connected during this step */
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <CheckCircle className="w-10 h-10 text-terminal-green mx-auto" />
                    <h2 className="text-lg font-semibold text-foreground font-mono">
                      WhatsApp conectado
                    </h2>
                    <p className="text-sm text-muted">
                      Tu agente está listo para responder mensajes
                    </p>
                  </div>
                  <button
                    onClick={() => saveAndFinish()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-green text-background rounded-xl font-mono text-sm hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-4 h-4" />
                    Activar agente
                  </button>
                </div>
              ) : connectMode === 'new' ? (
                <TwilioNumberProvisioning
                  onBack={() => setConnectMode(null)}
                  onConnectWhatsApp={() => setConnectMode('existing')}
                  onNumberPurchased={() => {}}
                />
              ) : connectMode === 'existing' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setConnectMode(null)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors font-mono"
                  >
                    <span>&larr;</span> volver
                  </button>
                  <WhatsAppConnectFlow
                    onSuccess={() => {
                      setWhatsappConnected(true);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-semibold text-foreground font-mono">
                      Conecta tu WhatsApp
                    </h2>
                    <p className="text-sm text-muted">
                      Tu agente necesita un número de WhatsApp para responder mensajes
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConnectMode('new')}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border hover:border-border-hover bg-background shadow-subtle hover:shadow-card transition-all"
                    >
                      <Plus className="w-6 h-6 text-terminal-green" />
                      <span className="text-sm font-medium text-foreground">número nuevo</span>
                      <span className="text-xs text-muted text-center">Compra via Twilio</span>
                    </button>
                    <button
                      onClick={() => setConnectMode('existing')}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border hover:border-border-hover bg-background shadow-subtle hover:shadow-card transition-all"
                    >
                      <Phone className="w-6 h-6 text-foreground" />
                      <span className="text-sm font-medium text-foreground">ya tengo uno</span>
                      <span className="text-xs text-muted text-center">Conectar existente</span>
                    </button>
                  </div>

                  <button
                    onClick={() => saveAndFinish()}
                    className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-foreground font-mono transition-colors py-2"
                  >
                    saltar y activar después
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat phase */}
          {step === 'chat' && (
            <div className="flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-foreground text-background'
                          : 'bg-surface-2 border border-border'
                      }`}
                    >
                      <span dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-2 border border-border px-3 py-2 rounded-2xl">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
                        <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe aquí..."
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/30 shadow-subtle focus:ring-2 focus:ring-accent-green/30"
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-3 py-2 bg-foreground text-background rounded-xl disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setExtractedConfig(defaultConfig);
                    if (whatsappConnected) {
                      saveAndFinish(true);
                    } else {
                      setStep('prerequisites');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-foreground font-mono transition-colors py-1"
                >
                  saltar — se usará la configuración de Loomi por defecto
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Test phase - Enhanced */}
          {step === 'test' && extractedConfig && (
            <div className="flex flex-col h-[520px]">
              {/* Config summary with features */}
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-terminal-green/5 to-blue-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Check className="w-3.5 h-3.5 text-terminal-green" />
                    <span className="text-terminal-green font-medium">{extractedConfig.businessName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-xs text-muted">
                      {extractedConfig.industry}
                    </span>
                    <span className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-xs text-muted">
                      {extractedConfig.tone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="wait">
                  {showCapabilities && testMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center px-4"
                    >
                      {/* Capabilities showcase */}
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-3">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-medium text-blue-400">Multi-Agent AI</span>
                        </div>
                        <p className="text-sm text-muted">
                          Tu agente usa análisis multi-modelo para respuestas inteligentes
                        </p>
                      </div>

                      {/* Feature grid */}
                      <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-sm">
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-2xl shadow-subtle">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-muted">Razonamiento o3</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-2xl shadow-subtle">
                          <Heart className="w-4 h-4 text-pink-400" />
                          <span className="text-xs text-muted">Detección emocional</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-2xl shadow-subtle">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-muted">Escalación inteligente</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-2xl shadow-subtle">
                          <CreditCard className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-muted">Links de pago</span>
                        </div>
                      </div>

                      {/* Quick prompts */}
                      <p className="text-xs text-muted mb-3">Prueba estos escenarios:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickPrompts.map((prompt) => (
                          <button
                            key={prompt.label}
                            onClick={() => sendTestMessage(prompt.text)}
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full hover:border-foreground/30 transition-all"
                          >
                            <prompt.icon className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors" />
                            <span className="text-xs font-mono">{prompt.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      {testMessages.map((msg, i) => (
                        <div key={i}>
                          <div
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                                msg.role === 'user'
                                  ? 'bg-foreground text-background'
                                  : 'bg-surface-2 border border-border'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                          {/* Show agent capabilities used */}
                          {msg.role === 'assistant' && msg.agentInfo && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-1.5 mt-1.5 ml-1"
                            >
                              {msg.agentInfo.detectedIndustry && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  {msg.agentInfo.detectedIndustry}
                                </span>
                              )}
                              {msg.agentInfo.escalatedToHuman && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  Escalado
                                </span>
                              )}
                              {msg.agentInfo.paymentLinkSent && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  Pago enviado
                                </span>
                              )}
                              {msg.agentInfo.saidLater && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                                  <Zap className="w-2.5 h-2.5" />
                                  Follow-up
                                </span>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced loading state with analysis steps */}
                {isTestLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface-2 border border-border px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-2 border-terminal-green/30 rounded-full" />
                          <div className="absolute inset-0 w-8 h-8 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={analysisStep}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-center gap-2 ${ANALYSIS_STEPS[analysisStep].color}`}
                            >
                              {(() => {
                                const StepIcon = ANALYSIS_STEPS[analysisStep].icon;
                                return <StepIcon className="w-3.5 h-3.5" />;
                              })()}
                              <span className="text-xs font-mono">
                                {ANALYSIS_STEPS[analysisStep].text}
                              </span>
                            </motion.div>
                          </AnimatePresence>
                          <div className="flex gap-0.5">
                            {ANALYSIS_STEPS.map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full transition-colors ${
                                  i <= analysisStep ? 'bg-terminal-green' : 'bg-border'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Test input + save */}
              <div className="p-3 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                    placeholder="Escribe como cliente..."
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/30 shadow-subtle focus:ring-2 focus:ring-accent-green/30"
                    disabled={isTestLoading}
                  />
                  <button
                    onClick={() => sendTestMessage()}
                    disabled={!testInput.trim() || isTestLoading}
                    className="px-3 py-2 bg-surface border border-border text-foreground rounded-xl disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (whatsappConnected) {
                      saveAndFinish();
                    } else {
                      setStep('prerequisites');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-green text-background rounded-xl font-mono text-sm hover:opacity-90 transition-opacity"
                >
                  {whatsappConnected ? (
                    <>
                      <Check className="w-4 h-4" />
                      Activar agente
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Conectar WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Saving phase */}
          {step === 'saving' && (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-terminal-green animate-spin mb-4" />
              <p className="text-sm text-muted font-mono">Activando tu agente...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/50 mt-4">
          {tenantEmail}
        </p>
      </motion.div>
    </div>
  );
}

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
  ExternalLink,
  Bot,
  Package,
  DollarSign,
  Target,
  Paperclip,
  LinkIcon,
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

const INITIAL_MESSAGE = `¡Hola! 👋 Soy tu nuevo agente de ventas. Para poder ayudarte, necesito conocer tu negocio. Cuéntame: **¿qué vendes y a quién?**`;

const AGENT_INTERVIEW_QUESTIONS = [
  '¡Hola! 👋 Soy tu nuevo agente de ventas. Para poder ayudarte, necesito conocer tu negocio. Cuéntame: **¿qué vendes y a quién?**',
  'Interesante. **¿Cuánto cuestan tus productos o servicios?** Cuéntame los precios, planes o paquetes que manejes.',
  'Perfecto. **¿Cómo es tu proceso de venta típico?** Desde que alguien te contacta hasta que cierra.',
  'Última pregunta: **¿cuáles son las dudas u objeciones que más recibes** de tus clientes?',
];

const PROCESSING_STEPS = [
  { icon: Brain, label: 'Analizando tu negocio...' },
  { icon: Package, label: 'Extrayendo productos...' },
  { icon: DollarSign, label: 'Identificando precios...' },
  { icon: Shield, label: 'Detectando objeciones...' },
  { icon: Target, label: 'Generando proceso de venta...' },
  { icon: Sparkles, label: 'Configurando tu agente...' },
];

// Analysis steps shown during processing
const ANALYSIS_STEPS = [
  { icon: Brain, text: 'Analizando contexto...', color: 'text-info' },
  { icon: Heart, text: 'Detectando sentimiento...', color: 'text-info' },
  { icon: TrendingUp, text: 'Evaluando intención...', color: 'text-info' },
  { icon: Sparkles, text: 'Generando respuesta...', color: 'text-info' },
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

  // Scripted interview state
  const [interviewIndex, setInterviewIndex] = useState(0);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [isSetupProcessing, setIsSetupProcessing] = useState(false);
  const [processingStepsDone, setProcessingStepsDone] = useState<number[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const interviewIndexRef = useRef(interviewIndex);
  interviewIndexRef.current = interviewIndex;

  // Boot: first agent message
  useEffect(() => {
    if (step === 'chat' && messages.length <= 1 && !chatReady) {
      setIsAgentTyping(true);
      const timer = setTimeout(() => {
        setMessages([{ role: 'assistant', content: AGENT_INTERVIEW_QUESTIONS[0] }]);
        setInterviewIndex(1);
        setIsAgentTyping(false);
        setChatReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, messages.length, chatReady]);

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

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isAgentTyping || isSetupProcessing) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    const qi = interviewIndexRef.current;

    if (qi < AGENT_INTERVIEW_QUESTIONS.length) {
      setIsAgentTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: AGENT_INTERVIEW_QUESTIONS[qi],
        }]);
        setInterviewIndex(q => q + 1);
        setIsAgentTyping(false);
      }, 800 + Math.random() * 600);
    } else if (qi === AGENT_INTERVIEW_QUESTIONS.length) {
      setIsAgentTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '¡Listo! Ya tengo suficiente información. Haz click en **"Crear mi agente"** para continuar. 🚀',
        }]);
        setInterviewIndex(q => q + 1);
        setIsAgentTyping(false);
      }, 800);
    }
  };

  const handleFileUploadChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        sendMessage(`[Archivo: ${file.name}]\n\n${text}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processSetup = async () => {
    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
    if (!userMsgs.trim()) return;

    setIsSetupProcessing(true);
    setProcessingStepsDone([]);

    const interval = setInterval(() => {
      setProcessingStepsDone(prev => {
        if (prev.length >= PROCESSING_STEPS.length) return prev;
        return [...prev, prev.length];
      });
    }, 2500);

    try {
      const res = await fetch('/api/agent-setup/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: userMsgs,
          contentType: 'conversation_interview',
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

      const data = await res.json();

      clearInterval(interval);
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 500));
        setProcessingStepsDone(prev => prev.includes(i) ? prev : [...prev, i]);
      }
      await new Promise(r => setTimeout(r, 400));

      setExtractedConfig({
        businessName: data.extracted.agentName || 'Mi Negocio',
        businessDescription: data.extracted.productContext || '',
        productsServices: data.extracted.productContext || '',
        tone: 'friendly',
        industry: 'general',
      });
      setGeneratedPrompt(data.extracted.systemPrompt || '');
      setStep('test');
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error al procesar. ¿Podrías intentar de nuevo?',
      }]);
    } finally {
      clearInterval(interval);
      setIsSetupProcessing(false);
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
        <div className="rounded-3xl border border-border bg-surface overflow-hidden">
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
                <span className="flex items-center gap-1 px-2 py-0.5 bg-info/10 border border-info/20 rounded text-xs font-mono text-info">
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
                    isDone ? 'bg-info/15 text-info' :
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
                  <div className="w-5 h-5 rounded-full bg-info/10 border border-info/20 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-mono text-info font-bold">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Cuenta de Meta (Facebook)</p>
                    <p className="text-xs text-muted mt-0.5">Necesitas una cuenta personal de Facebook o Meta</p>
                    <a
                      href="https://www.facebook.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-info hover:underline mt-1.5 font-mono"
                    >
                      Crear cuenta <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Item 2: Meta Business Portfolio */}
                <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-2xl">
                  <div className="w-5 h-5 rounded-full bg-info/10 border border-info/20 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-mono text-info font-bold">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Meta Business Portfolio</p>
                    <p className="text-xs text-muted mt-0.5">Antes conocido como Business Manager — gestiona tus activos de negocio</p>
                    <a
                      href="https://business.facebook.com/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-info hover:underline mt-1.5 font-mono"
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
              <div className="px-3 py-2.5 bg-info/5 border border-info/10 rounded-2xl">
                <p className="text-xs text-info font-mono">
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
                    <CheckCircle className="w-10 h-10 text-info mx-auto" />
                    <h2 className="text-lg font-semibold text-foreground font-mono">
                      WhatsApp conectado
                    </h2>
                    <p className="text-sm text-muted">
                      Tu agente está listo para responder mensajes
                    </p>
                  </div>
                  <button
                    onClick={() => saveAndFinish()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-info text-background rounded-xl font-mono text-sm hover:opacity-90 transition-opacity"
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
                      className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-info" />
                      <span className="text-sm font-medium text-foreground">número nuevo</span>
                      <span className="text-xs text-muted text-center">Compra via Twilio</span>
                    </button>
                    <button
                      onClick={() => setConnectMode('existing')}
                      className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border hover:border-foreground/20 transition-colors"
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

          {/* Chat phase — scripted interview */}
          {step === 'chat' && (
            <div className="flex flex-col h-[480px] relative">
              {/* Chat header */}
              <div className="px-4 py-2.5 border-b border-border bg-surface-2/50 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-info/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Tu agente de ventas</p>
                  <p className="text-xs text-muted">
                    {isAgentTyping ? 'Escribiendo...' : 'En línea'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-foreground text-background rounded-br-md'
                          : 'bg-surface-2 border border-border rounded-bl-md'
                      }`}
                    >
                      <span dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    </div>
                  </motion.div>
                ))}

                {isAgentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface-2 border border-border px-3 py-2 rounded-2xl rounded-bl-md">
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 bg-muted rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* "Create agent" CTA */}
              {messages.filter(m => m.role === 'user').length >= 1 && !isSetupProcessing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-2 bg-info/5 border-t border-info/20 flex items-center justify-between">
                    <span className="text-xs text-info">
                      {interviewIndex > AGENT_INTERVIEW_QUESTIONS.length
                        ? '¡Info suficiente!'
                        : 'Ya puedes crear tu agente, o sigue dando contexto.'}
                    </span>
                    <button
                      onClick={processSetup}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-info text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      Crear mi agente
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Input area */}
              <div className="border-t border-border p-3 space-y-2">
                <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUploadChat} className="hidden" />

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-foreground bg-surface-2 border border-border rounded-xl hover:border-foreground/20 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-muted" />
                    Subir archivo
                  </button>
                  <button
                    onClick={() => {
                      setShowUrlInput(prev => !prev);
                      setTimeout(() => urlInputRef.current?.focus(), 100);
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-foreground border rounded-xl transition-colors ${
                      showUrlInput ? 'bg-foreground/5 border-foreground/20' : 'bg-surface-2 border-border hover:border-foreground/20'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-muted" />
                    Pegar URL
                  </button>
                </div>

                {/* URL inline input */}
                <AnimatePresence>
                  {showUrlInput && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <input
                          ref={urlInputRef}
                          value={urlValue}
                          onChange={e => setUrlValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && urlValue.trim()) { sendMessage(`Mi sitio web: ${urlValue.trim()}`); setUrlValue(''); setShowUrlInput(false); }
                            if (e.key === 'Escape') { setShowUrlInput(false); setUrlValue(''); }
                          }}
                          placeholder="https://tusitio.com"
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
                        />
                        <button
                          onClick={() => { if (urlValue.trim()) { sendMessage(`Mi sitio web: ${urlValue.trim()}`); setUrlValue(''); setShowUrlInput(false); } }}
                          disabled={!urlValue.trim()}
                          className="px-3 py-1.5 bg-foreground text-background rounded-lg text-xs disabled:opacity-30"
                        >
                          Enviar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Text input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                    placeholder={chatReady ? 'Escribe tu respuesta...' : 'Espera...'}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-info/30"
                    disabled={!chatReady || isAgentTyping || isSetupProcessing}
                    autoFocus
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || !chatReady || isAgentTyping}
                    className={`px-3 py-2 rounded-xl transition-colors ${
                      input.trim() ? 'bg-foreground text-background' : 'bg-surface-2 text-muted'
                    } disabled:opacity-30`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Skip */}
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
                  saltar y hacerlo después
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Processing overlay */}
              <AnimatePresence>
                {isSetupProcessing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-surface/95 rounded-b-3xl flex items-center justify-center">
                    <div className="w-full max-w-xs space-y-2.5 px-6">
                      <p className="text-sm font-medium text-foreground mb-3 text-center font-mono">Configurando tu agente...</p>
                      {PROCESSING_STEPS.map((ps, i) => {
                        const Icon = ps.icon;
                        const done = processingStepsDone.includes(i);
                        const active = !done && processingStepsDone.length === i;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${done ? 'bg-info/20' : active ? 'bg-foreground/10' : 'bg-surface-2'}`}>
                              {done ? <Check className="w-3.5 h-3.5 text-info" /> : active ? <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" /> : <Icon className="w-3.5 h-3.5 text-muted" />}
                            </div>
                            <span className={`text-xs font-mono ${done ? 'text-info' : active ? 'text-foreground' : 'text-muted'}`}>{ps.label}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Test phase - Enhanced */}
          {step === 'test' && extractedConfig && (
            <div className="flex flex-col h-[520px]">
              {/* Config summary with features */}
              <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-info/5 to-info/3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Check className="w-3.5 h-3.5 text-info" />
                    <span className="text-info font-medium">{extractedConfig.businessName}</span>
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-info/10 border border-info/20 rounded-full mb-3">
                          <Sparkles className="w-4 h-4 text-info" />
                          <span className="text-xs font-medium text-info">Multi-Agent AI</span>
                        </div>
                        <p className="text-sm text-muted">
                          Tu agente usa análisis multi-modelo para respuestas inteligentes
                        </p>
                      </div>

                      {/* Feature grid */}
                      <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-sm">
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl">
                          <Brain className="w-4 h-4 text-info" />
                          <span className="text-xs text-muted">Razonamiento o3</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl">
                          <Heart className="w-4 h-4 text-info" />
                          <span className="text-xs text-muted">Detección emocional</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl">
                          <Shield className="w-4 h-4 text-info" />
                          <span className="text-xs text-muted">Escalación inteligente</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl">
                          <CreditCard className="w-4 h-4 text-info" />
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
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-info/10 border border-info/20 rounded text-xs text-info">
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
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-info/10 border border-info/20 rounded text-xs text-info">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  Pago enviado
                                </span>
                              )}
                              {msg.agentInfo.saidLater && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-info/10 border border-info/20 rounded text-xs text-info">
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
                          <div className="w-8 h-8 border-2 border-info/30 rounded-full" />
                          <div className="absolute inset-0 w-8 h-8 border-2 border-info border-t-transparent rounded-full animate-spin" />
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
                                  i <= analysisStep ? 'bg-info' : 'bg-border'
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
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-info/30"
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-info text-background rounded-xl font-mono text-sm hover:opacity-90 transition-opacity"
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
              <Loader2 className="w-8 h-8 text-info animate-spin mb-4" />
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

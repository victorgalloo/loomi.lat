'use client';

import { useState, useTransition, useRef, useCallback, useEffect } from 'react';
import { AgentConfig } from '@/lib/tenant/context';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button-loomi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Brain,
  Package,
  DollarSign,
  Shield,
  Target,
  Sparkles,
  Check,
  Loader2,
  Upload,
  Rocket,
  ChevronDown,
  Users,
  Send,
  LinkIcon,
  Paperclip,
  Bot,
  ArrowRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ChatMessage {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Conversar', title: 'Cuéntale a tu agente' },
  { label: 'Revisar', title: 'Revisa lo que entendió' },
  { label: 'Activar', title: 'Activa tu agente' },
];

const PROCESSING_STEPS = [
  { icon: Brain, label: 'Analizando tu negocio...' },
  { icon: Package, label: 'Extrayendo productos y servicios...' },
  { icon: DollarSign, label: 'Identificando precios...' },
  { icon: Shield, label: 'Detectando objeciones comunes...' },
  { icon: Target, label: 'Generando proceso de venta...' },
  { icon: Sparkles, label: 'Configurando tu agente...' },
];

// The agent's scripted interview questions
const AGENT_QUESTIONS: { text: string; key: string }[] = [
  {
    key: 'intro',
    text: '¡Hola! 👋 Soy tu nuevo agente de ventas. Para poder ayudarte, necesito conocer tu negocio. Cuéntame: ¿qué vendes y a quién?',
  },
  {
    key: 'pricing',
    text: 'Interesante. ¿Cuánto cuestan tus productos o servicios? Cuéntame los precios, planes o paquetes que manejes.',
  },
  {
    key: 'process',
    text: 'Perfecto. ¿Cómo es tu proceso de venta típico? Desde que alguien te contacta hasta que cierra.',
  },
  {
    key: 'objections',
    text: 'Última pregunta: ¿cuáles son las dudas u objeciones que más recibes de tus clientes?',
  },
];

const COLLAPSIBLE_FIELDS = [
  { key: 'product', label: 'Producto / Servicio', icon: Package },
  { key: 'pricing', label: 'Precios', icon: DollarSign },
  { key: 'sales', label: 'Proceso de venta', icon: Target },
  { key: 'qualification', label: 'Criterios de calificación', icon: Users },
  { key: 'competitor', label: 'Competencia', icon: Shield },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction * 300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -300, opacity: 0 }),
};

// ─── Helper Components ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ConfidenceGauge({ confidence }: { confidence: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - confidence * circumference;
  const color = confidence >= 0.7 ? 'var(--terminal-green)' : confidence >= 0.4 ? 'var(--terminal-yellow)' : 'var(--terminal-red)';
  const label = confidence >= 0.7 ? 'Alta confianza' : confidence >= 0.4 ? 'Media confianza' : 'Baja confianza';
  const variant = confidence >= 0.7 ? 'success' as const : confidence >= 0.4 ? 'warning' as const : 'error' as const;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
          <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }} />
        </svg>
        <motion.span className="absolute inset-0 flex items-center justify-center text-lg font-mono font-semibold text-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {Math.round(confidence * 100)}%
        </motion.span>
      </div>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

function CollapsibleSection({
  label, icon: Icon, isOpen, onToggle, hasContent, children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  hasContent: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-2 transition-colors">
        <Icon className="w-4 h-4 text-muted" />
        <span className="text-sm font-medium text-foreground flex-1 text-left">{label}</span>
        {hasContent && (
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Check className="w-4 h-4 text-terminal-green" />
          </motion.div>
        )}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ['var(--terminal-red)', 'var(--terminal-yellow)', 'var(--terminal-green)', 'var(--info)'][i % 4],
    x: (Math.random() - 0.5) * 500,
    y: (Math.random() - 0.5) * 500,
    rotate: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AgentSetupWizard({ existingConfig, onSave }: AgentSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState<number[]>([]);

  // Extracted data
  const [extracted, setExtracted] = useState<ExtractedConfig | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Saving
  const [isSaving, startSaveTransition] = useTransition();
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Step 1 editable fields
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [productContext, setProductContext] = useState('');
  const [pricingContext, setPricingContext] = useState('');
  const [salesProcessContext, setSalesProcessContext] = useState('');
  const [qualificationContext, setQualificationContext] = useState('');
  const [competitorContext, setCompetitorContext] = useState('');
  const [objectionHandlers, setObjectionHandlers] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Step 2
  const [systemPrompt, setSystemPrompt] = useState('');

  // ─── Boot: first agent message ──────────────────────────────────────────

  useEffect(() => {
    if (messages.length === 0 && !chatReady) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages([{
          role: 'agent',
          text: AGENT_QUESTIONS[0].text,
          timestamp: Date.now(),
        }]);
        setQuestionIndex(1);
        setIsTyping(false);
        setChatReady(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [messages.length, chatReady]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  }, [step]);

  const fieldMap: Record<string, { value: string; setter: (v: string) => void }> = {
    product: { value: productContext, setter: setProductContext },
    pricing: { value: pricingContext, setter: setPricingContext },
    sales: { value: salesProcessContext, setter: setSalesProcessContext },
    qualification: { value: qualificationContext, setter: setQualificationContext },
    competitor: { value: competitorContext, setter: setCompetitorContext },
  };

  const filledFields = [productContext, pricingContext, salesProcessContext, qualificationContext, competitorContext, agentName, agentRole].filter(v => v.trim().length > 0).length;
  const hasObjections = Object.values(objectionHandlers).some(v => v.trim().length > 0);
  const completeness = ((filledFields + (hasObjections ? 1 : 0)) / 8) * 100;

  const userMessages = messages.filter(m => m.role === 'user');
  const canProcess = userMessages.length >= 1;

  // ─── Send message ───────────────────────────────────────────────────────

  // Use a ref so callbacks always see the latest questionIndex
  const questionIndexRef = useRef(questionIndex);
  questionIndexRef.current = questionIndex;

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setCurrentInput('');

    const qi = questionIndexRef.current;

    // Show next agent question or "ready" message
    if (qi < AGENT_QUESTIONS.length) {
      setIsTyping(true);
      const delay = 800 + Math.random() * 600;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: AGENT_QUESTIONS[qi].text,
          timestamp: Date.now(),
        }]);
        setQuestionIndex(q => q + 1);
        setIsTyping(false);
      }, delay);
    } else if (qi === AGENT_QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: '¡Listo! Ya tengo suficiente información. Haz click en "Crear mi agente" y me configuro automáticamente. 🚀',
          timestamp: Date.now(),
        }]);
        setQuestionIndex(q => q + 1);
        setIsTyping(false);
      }, 800);
    }

    // Re-focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const val = (e.target as HTMLTextAreaElement).value;
      sendMessage(val);
    }
  };

  // ─── File upload ────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // ─── Build raw content from chat ────────────────────────────────────────

  const buildRawContent = () => {
    return messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('\n\n');
  };

  // ─── Process ────────────────────────────────────────────────────────────

  const handleProcess = async () => {
    const content = buildRawContent();
    if (!content.trim()) return;

    setIsProcessing(true);
    setError(null);
    setProcessingSteps([]);

    const interval = setInterval(() => {
      setProcessingSteps(prev => {
        if (prev.length >= PROCESSING_STEPS.length) return prev;
        return [...prev, prev.length];
      });
    }, 2500);

    try {
      const res = await fetch('/api/agent-setup/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: content,
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

      const data: ProcessResponse = await res.json();

      clearInterval(interval);
      const allStepIndices = PROCESSING_STEPS.map((_, i) => i);
      for (const idx of allStepIndices) {
        if (!processingSteps.includes(idx)) {
          await new Promise(r => setTimeout(r, 600));
          setProcessingSteps(prev => [...prev, idx]);
        }
      }
      await new Promise(r => setTimeout(r, 500));

      setExtracted(data.extracted);
      setConfidence(data.confidence);
      setSuggestions(data.suggestions);
      setAgentName(data.extracted.agentName);
      setAgentRole(data.extracted.agentRole);
      setProductContext(data.extracted.productContext);
      setPricingContext(data.extracted.pricingContext);
      setSalesProcessContext(data.extracted.salesProcessContext);
      setQualificationContext(data.extracted.qualificationContext);
      setCompetitorContext(data.extracted.competitorContext);
      setObjectionHandlers(data.extracted.objectionHandlers);
      setSystemPrompt(data.extracted.systemPrompt);
      goToStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await onSave({
          systemPrompt, productContext, pricingContext, salesProcessContext,
          qualificationContext, competitorContext, objectionHandlers,
          agentName, agentRole, analysisEnabled: true,
          fewShotExamples: extracted?.fewShotExamples || [],
        });
        setActivationSuccess(true);
        setTimeout(() => { router.push('/dashboard/agent'); router.refresh(); }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar');
      }
    });
  };

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const promptLineCount = systemPrompt.split('\n').length;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
          <span className="ml-2 text-sm text-muted">Setup</span>
        </div>
        <div className="px-4 py-4 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm border',
                  i === step && 'bg-foreground text-background border-foreground',
                  i < step && 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
                  i > step && 'bg-surface-2 text-muted border-border',
                )}
                animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                transition={i === step ? { duration: 1.5, repeat: Infinity, repeatType: 'loop' } : {}}
              >
                {i < step ? (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <Check className="w-3.5 h-3.5" />
                  </motion.div>
                ) : i + 1}
              </motion.div>
              <span className={cn('text-sm', i === step ? 'text-foreground' : 'text-muted')}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <div className="relative w-8 h-px bg-border overflow-hidden">
                  <motion.div className="absolute inset-y-0 left-0 bg-terminal-green" initial={{ width: '0%' }} animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>

        {/* ═══════ STEP 0: Chat Interview ═══════ */}
        {step === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: '70vh', maxHeight: '700px' }}>

              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border bg-surface-2/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-terminal-green/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-terminal-green" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Tu agente de ventas</p>
                  <p className="text-xs text-muted">
                    {isTyping ? 'Escribiendo...' : 'En línea'}
                  </p>
                </div>
                {/* Info pill */}
                <div className="text-xs text-muted bg-surface-2 px-2.5 py-1 rounded-full border border-border">
                  {userMessages.length} respuesta{userMessages.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Example preview - shows before first user message */}
                {userMessages.length === 0 && messages.length > 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mx-auto max-w-sm my-2 p-3 bg-surface-2/50 border border-border/50 rounded-lg"
                  >
                    <p className="text-xs text-muted text-center mb-2">Ejemplo de respuesta:</p>
                    <p className="text-xs text-muted/80 italic text-center">
                      &ldquo;Vendemos cursos de marketing digital para emprendedores. Nuestro curso principal cuesta $199 y dura 8 semanas...&rdquo;
                    </p>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-foreground text-background rounded-br-md'
                        : 'bg-surface-2 text-foreground border border-border rounded-bl-md',
                    )}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-md">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* "Create agent" CTA - appears after enough messages */}
              <AnimatePresence>
                {canProcess && !isProcessing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-terminal-green/5 border-t border-terminal-green/20 flex items-center justify-between">
                      <span className="text-xs text-terminal-green">
                        {questionIndex > AGENT_QUESTIONS.length
                          ? '¡Info suficiente! Crea tu agente.'
                          : 'Ya puedes crear tu agente, o sigue dando más contexto.'}
                      </span>
                      <Button size="sm" onClick={handleProcess} className="bg-terminal-green text-background hover:bg-terminal-green/90">
                        Crear mi agente
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="border-t border-border p-4 bg-surface space-y-3">
                <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />

                {/* Quick actions — big & prominent */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground bg-surface-2 border border-border rounded-xl hover:border-foreground/20 hover:bg-surface transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-muted" />
                    Subir archivo
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowUrlInput(prev => !prev);
                      setTimeout(() => urlInputRef.current?.focus(), 100);
                    }}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground border rounded-xl transition-colors',
                      showUrlInput
                        ? 'bg-foreground/5 border-foreground/20'
                        : 'bg-surface-2 border-border hover:border-foreground/20 hover:bg-surface',
                    )}
                  >
                    <LinkIcon className="w-4 h-4 text-muted" />
                    Pegar URL
                  </motion.button>
                </div>

                {/* Inline URL input */}
                <AnimatePresence>
                  {showUrlInput && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          ref={urlInputRef}
                          value={urlValue}
                          onChange={e => setUrlValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && urlValue.trim()) {
                              sendMessage(`Mi sitio web: ${urlValue.trim()}`);
                              setUrlValue('');
                              setShowUrlInput(false);
                            }
                            if (e.key === 'Escape') {
                              setShowUrlInput(false);
                              setUrlValue('');
                            }
                          }}
                          placeholder="https://tusitio.com"
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (urlValue.trim()) {
                              sendMessage(`Mi sitio web: ${urlValue.trim()}`);
                              setUrlValue('');
                              setShowUrlInput(false);
                            }
                          }}
                          disabled={!urlValue.trim()}
                        >
                          Enviar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Text input */}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={currentInput}
                    onChange={e => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={chatReady ? 'Escribe tu respuesta...' : 'Espera...'}
                    disabled={!chatReady || isTyping || isProcessing}
                    rows={1}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50 max-h-32"
                    style={{ minHeight: '42px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '42px';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage(currentInput)}
                    disabled={!currentInput.trim() || !chatReady || isTyping}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                      currentInput.trim()
                        ? 'bg-foreground text-background'
                        : 'bg-surface-2 text-muted',
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-4 mb-3 p-3 bg-terminal-red/10 border border-terminal-red/20 rounded-lg text-sm text-terminal-red">
                  {error}
                </div>
              )}

              {/* Processing overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-surface/95 rounded-xl flex items-center justify-center">
                    <div className="w-full max-w-sm space-y-3 px-6">
                      <p className="text-sm font-medium text-foreground mb-4 text-center">Configurando tu agente...</p>
                      {PROCESSING_STEPS.map((ps, i) => {
                        const Icon = ps.icon;
                        const isCompleted = processingSteps.includes(i);
                        const isActive = !isCompleted && processingSteps.length === i;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                              isCompleted ? 'bg-terminal-green/20' : isActive ? 'bg-foreground/10' : 'bg-surface-2',
                            )}>
                              {isCompleted ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                                  <Check className="w-4 h-4 text-terminal-green" />
                                </motion.div>
                              ) : isActive ? (
                                <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                              ) : (
                                <Icon className="w-4 h-4 text-muted" />
                              )}
                            </div>
                            <span className={cn('text-sm', isCompleted ? 'text-terminal-green' : isActive ? 'text-foreground' : 'text-muted')}>{ps.label}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ═══════ STEP 1: Revisar ═══════ */}
        {step === 1 && extracted && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <ConfidenceGauge confidence={confidence} />
              <div className="flex-1 min-w-[200px] max-w-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted">Completitud</span>
                  <span className="text-sm font-mono text-foreground">{Math.round(completeness)}%</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-foreground" initial={{ width: '0%' }} animate={{ width: `${completeness}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="p-3 bg-terminal-yellow/10 border border-terminal-yellow/20 rounded-lg">
                <p className="text-sm font-medium text-terminal-yellow mb-1">Sugerencias para mejorar:</p>
                <ul className="text-sm text-muted space-y-1">
                  {suggestions.map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>- {s}</motion.li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-3">Identidad del agente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label text-muted mb-1">Nombre</label>
                  <input value={agentName} onChange={e => setAgentName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                </div>
                <div>
                  <label className="block text-label text-muted mb-1">Rol</label>
                  <input value={agentRole} onChange={e => setAgentRole(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                </div>
              </div>
            </div>

            {COLLAPSIBLE_FIELDS.map(field => (
              <CollapsibleSection key={field.key} label={field.label} icon={field.icon}
                isOpen={!collapsedSections.has(field.key)} onToggle={() => toggleSection(field.key)}
                hasContent={fieldMap[field.key].value.trim().length > 0}>
                <textarea value={fieldMap[field.key].value} onChange={e => fieldMap[field.key].setter(e.target.value)} rows={4}
                  className="w-full bg-background border border-border rounded-lg p-3 text-body text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20" />
              </CollapsibleSection>
            ))}

            <CollapsibleSection label="Manejo de objeciones" icon={Shield}
              isOpen={!collapsedSections.has('objections')} onToggle={() => toggleSection('objections')} hasContent={hasObjections}>
              <div className="space-y-3">
                {Object.entries(objectionHandlers).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-label text-muted mb-1">{key}</label>
                    <textarea value={value} onChange={e => setObjectionHandlers(prev => ({ ...prev, [key]: e.target.value }))} rows={2}
                      className="w-full bg-background border border-border rounded-lg p-3 text-body text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => goToStep(0)}>Volver</Button>
              <Button onClick={() => goToStep(2)}>Siguiente</Button>
            </div>
          </motion.div>
        )}

        {/* ═══════ STEP 2: Activar ═══════ */}
        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-4 relative"
          >
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-lg font-semibold text-foreground mb-2">{STEPS[2].title}</h2>
              <p className="text-body text-muted mb-4">
                Este es el prompt principal de tu agente. Puedes editarlo antes de activar.
              </p>
              <div className="relative">
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={24}
                  className="w-full bg-background border border-border rounded-lg p-4 text-body text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                <span className="absolute bottom-3 right-3 text-xs text-muted font-mono">{promptLineCount} líneas</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-terminal-red/10 border border-terminal-red/20 rounded-lg text-sm text-terminal-red">{error}</div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => goToStep(1)}>Volver</Button>
              <Button onClick={handleSave} disabled={isSaving} glow className="bg-terminal-green text-background hover:bg-terminal-green/90">
                {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activando...</>) : (<><Rocket className="w-4 h-4 mr-2" />Activar agente</>)}
              </Button>
            </div>

            <AnimatePresence>
              {activationSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Confetti />
                  <div className="text-center relative z-10">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-20 h-20 bg-terminal-green/20 border-2 border-terminal-green rounded-full flex items-center justify-center mx-auto mb-6">
                      <Rocket className="w-8 h-8 text-terminal-green" />
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-2xl font-semibold text-foreground mb-2">Agente activado</motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className="text-muted">Tu agente está listo para vender</motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

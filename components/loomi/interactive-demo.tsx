'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Zap,
  Brain,
  Heart,
  TrendingUp,
  Sparkles,
  UserCheck,
  CreditCard,
  MessageSquare,
  Shield,
  Volume2,
  VolumeX,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface AgentInfo {
  escalatedToHuman?: { reason: string; summary: string } | null;
  paymentLinkSent?: { plan: string; email: string } | null;
  detectedIndustry?: string | null;
  saidLater?: boolean;
}

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  label: string;
}

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  agentInfo?: AgentInfo;
  slots?: TimeSlot[];  // For schedule selection
}

// Analysis steps shown during processing
const ANALYSIS_STEPS = [
  { icon: Brain, text: 'Analizando contexto...', color: 'text-blue-400' },
  { icon: Heart, text: 'Detectando sentimiento...', color: 'text-pink-400' },
  { icon: TrendingUp, text: 'Evaluando intención...', color: 'text-green-400' },
  { icon: Sparkles, text: 'Generando respuesta...', color: 'text-yellow-400' },
];

// Quick prompts - all go through real agent
const QUICK_PROMPTS = [
  { text: '¿Cuánto cuesta?', icon: CreditCard, label: 'Precio', iconColor: 'text-green-400', borderColor: 'border-green-500/30 hover:border-green-500/50' },
  { text: '¿Cómo funciona?', icon: MessageSquare, label: 'Info', iconColor: 'text-blue-400', borderColor: 'border-blue-500/30 hover:border-blue-500/50' },
  { text: 'Es muy caro', icon: TrendingUp, label: 'Objeción', iconColor: 'text-orange-400', borderColor: 'border-orange-500/30 hover:border-orange-500/50' },
  { text: 'Ya uso Wati', icon: Shield, label: 'Competencia', iconColor: 'text-red-400', borderColor: 'border-red-500/30 hover:border-red-500/50' },
  { text: 'No confío en bots', icon: Brain, label: 'Escéptico', iconColor: 'text-purple-400', borderColor: 'border-purple-500/30 hover:border-purple-500/50' },
  { text: 'Quiero una demo', icon: Calendar, label: 'Agendar', iconColor: 'text-yellow-400', borderColor: 'border-yellow-500/30 hover:border-yellow-500/50' },
];

export function InteractiveDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, type: 'bot', text: '¿Buscas automatizar ventas por WhatsApp?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Animate through analysis steps while loading
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => (prev + 1) % ANALYSIS_STEPS.length);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  // Generate and play voice for a message
  const playVoice = useCallback(async (text: string) => {
    if (!voiceEnabled) return;

    try {
      setIsPlaying(true);

      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('[Voice] Failed to generate:', response.status);
        setIsPlaying(false);
        return;
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = 1.25;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('[Voice] Error:', error);
      setIsPlaying(false);
    }
  }, [voiceEnabled]);

  // Handle message - all messages go through real agent
  const handleRealMessage = useCallback(async (text: string) => {
    const userMessage: Message = { id: Date.now(), type: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Build history for context
    const history = messages.map(m => ({
      role: m.type === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    setIsTyping(true);
    setAnalysisStep(0);

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await res.json();

      setIsTyping(false);
      if (res.ok && data.response) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: data.response,
          agentInfo: data.agentInfo,
          slots: data.showScheduleList ? data.slots : undefined
        }]);
        playVoice(data.response);
      } else {
        const fallback = '¿Te gustaría agendar una demo para ver más?';
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: fallback
        }]);
        playVoice(fallback);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      const fallback = '¿Te gustaría agendar una demo para ver más?';
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: fallback
      }]);
    }
  }, [messages, playVoice]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    handleRealMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickButton = (text: string) => {
    if (isTyping) return;
    handleRealMessage(text);
  };

  const toggleVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-6 font-mono">
            Pruébalo
          </h2>
          <p className="text-muted text-lg">
            Este es el agente real. Con voz incluida.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface rounded-xl overflow-hidden border border-border shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-xs text-muted font-mono ml-2">loomi --live</span>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  voiceEnabled
                    ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                    : 'bg-surface border border-border text-muted'
                }`}
                title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className={`w-3 h-3 ${isPlaying ? 'animate-pulse' : ''}`} />
                    {isPlaying ? 'Hablando...' : 'Voz ON'}
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3" />
                    Voz OFF
                  </>
                )}
              </button>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-terminal-green/10 border border-terminal-green/20 rounded text-[10px] font-mono text-terminal-green">
                <Zap className="w-3 h-3" />
                GPT-4o
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                <span className="text-xs text-muted font-mono">live</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="h-[320px] p-4 overflow-y-auto bg-background">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`flex mb-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 font-mono text-sm ${
                        message.type === 'user'
                          ? 'bg-foreground text-background'
                          : 'bg-surface-2 border border-border text-foreground'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                  {/* Show schedule slots */}
                  {message.type === 'bot' && message.slots && message.slots.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2 mb-3 ml-1"
                    >
                      {message.slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleRealMessage(`Quiero el ${slot.label}`)}
                          disabled={isTyping}
                          className="flex items-center gap-1.5 px-3 py-2 bg-terminal-green/10 border border-terminal-green/30 hover:border-terminal-green/60 rounded-lg text-xs text-terminal-green font-mono transition-colors disabled:opacity-50"
                        >
                          <Calendar className="w-3 h-3" />
                          {slot.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                  {/* Show agent capabilities used */}
                  {message.type === 'bot' && message.agentInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-1.5 mb-3 ml-1"
                    >
                      {message.agentInfo.detectedIndustry && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-mono">
                          <TrendingUp className="w-2.5 h-2.5" />
                          {message.agentInfo.detectedIndustry}
                        </span>
                      )}
                      {message.agentInfo.escalatedToHuman && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-400 font-mono">
                          <UserCheck className="w-2.5 h-2.5" />
                          Escalado a humano
                        </span>
                      )}
                      {message.agentInfo.paymentLinkSent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-mono">
                          <CreditCard className="w-2.5 h-2.5" />
                          Link de pago
                        </span>
                      )}
                      {message.agentInfo.saidLater && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-mono">
                          <Zap className="w-2.5 h-2.5" />
                          Follow-up programado
                        </span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-surface-2 border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-6 h-6 border-2 border-terminal-green/30 rounded-full" />
                      <div className="absolute inset-0 w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={analysisStep}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className={`flex items-center gap-2 ${ANALYSIS_STEPS[analysisStep].color}`}
                        >
                          {(() => {
                            const StepIcon = ANALYSIS_STEPS[analysisStep].icon;
                            return <StepIcon className="w-3 h-3" />;
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
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-surface-2">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe como cliente..."
                disabled={isTyping}
                className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground text-sm placeholder-muted focus:outline-none focus:border-muted transition-colors font-mono disabled:opacity-50"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 rounded-lg bg-foreground flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-background" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Quick prompts */}
        <div className="mt-8">
          <p className="text-sm text-muted text-center mb-4 font-mono">Prueba estos escenarios <span className="text-terminal-green">→</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickButton(prompt.text)}
                disabled={isTyping}
                className={`group flex items-center gap-2.5 px-4 py-3 text-sm rounded-lg transition-all font-mono disabled:opacity-50 bg-surface hover:bg-surface-2 ${prompt.borderColor}`}
              >
                <prompt.icon className={`w-4 h-4 ${prompt.iconColor}`} />
                <span className="text-foreground text-xs">{prompt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Configura tu propio agente
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

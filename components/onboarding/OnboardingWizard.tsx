'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, Check, Loader2, RotateCcw, ArrowRight } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
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
  existingConfig?: Partial<ExtractedConfig>;
}

const INITIAL_MESSAGE = `¡Hola! 👋 Voy a ayudarte a configurar tu agente de WhatsApp en menos de 2 minutos.

Empecemos: **¿Cómo se llama tu negocio?**`;

export function OnboardingWizard({
  tenantId,
  tenantEmail,
  existingConfig,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<'chat' | 'test' | 'saving'>('chat');
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, testMessages]);

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

      // Check if onboarding chat is complete
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

  const sendTestMessage = async () => {
    if (!testInput.trim() || isTestLoading) return;

    const msg = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTestLoading(true);

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
        setTestMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestLoading(false);
    }
  };

  const saveAndFinish = async () => {
    setStep('saving');
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedConfig,
          customSystemPrompt: generatedPrompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setStep('test');
    }
  };

  const resetOnboarding = () => {
    setMessages([{ role: 'assistant', content: INITIAL_MESSAGE }]);
    setExtractedConfig(null);
    setGeneratedPrompt('');
    setTestMessages([]);
    setStep('chat');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Terminal window */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-xs text-muted font-mono ml-2">
              {step === 'chat' ? './setup' : step === 'test' ? './test-agent' : './saving'}
            </span>
            {step !== 'chat' && (
              <button
                onClick={resetOnboarding}
                className="ml-auto text-muted hover:text-foreground"
                title="Empezar de nuevo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
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
                    <div className="bg-surface-2 border border-border px-3 py-2 rounded-lg">
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

              <div className="p-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe aquí..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-foreground/30"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-3 py-2 bg-foreground text-background rounded-lg disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Test phase */}
          {step === 'test' && extractedConfig && (
            <div className="flex flex-col h-[450px]">
              {/* Config summary */}
              <div className="px-4 py-2 border-b border-border bg-terminal-green/5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Check className="w-3.5 h-3.5 text-terminal-green" />
                  <span className="text-terminal-green">{extractedConfig.businessName}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{extractedConfig.tone}</span>
                </div>
              </div>

              {/* Test chat */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {testMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted mb-3">Prueba tu agente</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {['¿Qué ofrecen?', '¿Cuánto cuesta?', 'Quiero agendar'].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setTestInput(q);
                            setTimeout(() => sendTestMessage(), 100);
                          }}
                          className="px-2.5 py-1 text-xs font-mono bg-background border border-border rounded hover:border-foreground/30"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  testMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-foreground text-background'
                            : 'bg-surface-2 border border-border'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isTestLoading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-2 border border-border px-3 py-2 rounded-lg">
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

              {/* Test input + save */}
              <div className="p-3 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                    placeholder="Prueba un mensaje..."
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-foreground/30"
                    disabled={isTestLoading}
                  />
                  <button
                    onClick={sendTestMessage}
                    disabled={!testInput.trim() || isTestLoading}
                    className="px-3 py-2 bg-surface border border-border text-foreground rounded-lg disabled:opacity-30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={saveAndFinish}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-green text-background rounded-lg font-mono text-sm hover:opacity-90"
                >
                  <Check className="w-4 h-4" />
                  Guardar y continuar
                </button>
              </div>
            </div>
          )}

          {/* Saving phase */}
          {step === 'saving' && (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-terminal-green animate-spin mb-4" />
              <p className="text-sm text-muted font-mono">Guardando configuración...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/50 font-mono mt-4">
          {tenantEmail}
        </p>
      </motion.div>
    </div>
  );
}

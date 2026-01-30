'use client';

import { CodeBlock } from '@/components/ui/code-block';
import { FadeIn } from '@/components/ui/fade-in';
import { motion } from 'framer-motion';

const TECH_STACK = [
  {
    name: 'Next.js 16',
    description: 'App Router + Server Actions',
    gradient: 'from-white to-gray-100',
  },
  {
    name: 'Claude Opus 4',
    description: 'Razonamiento avanzado',
    gradient: 'from-orange-100 to-orange-50',
  },
  {
    name: 'Supabase',
    description: 'PostgreSQL + Realtime',
    gradient: 'from-green-100 to-green-50',
  },
  {
    name: 'Vercel Edge',
    description: 'Serverless global',
    gradient: 'from-gray-100 to-white',
  },
];

const CODE_EXAMPLE = `// lib/agents/simple-agent.ts

// 1. Analizar contexto con chain-of-thought
const reasoning = await generateReasoning(message, context);
const sentiment = detectSentiment(userMessage, history);
const industry = detectIndustry(lead);

// 2. Generar respuesta personalizada
const response = await generateText({
  model: claude('claude-opus-4'),
  system: buildSystemPrompt({
    reasoning,
    sentiment,
    industry,
    memory: lead.memory
  }),
  messages: conversationHistory
});

// 3. Detectar intención de agendar y actuar
if (shouldOfferDemo(response, lead.stage)) {
  const slots = await calendar.getAvailableSlots();
  await followups.schedule(lead.id, 'demo_reminder');
}`;

export function TechStack() {
  return (
    <section id="tech" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-50 to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <div>
            <FadeIn>
              <span className="inline-block px-4 py-1 bg-gray-900 text-white text-sm font-medium rounded-full mb-4">
                Open Source
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Construido para{' '}
                <span className="text-neon-green text-glow-sm">escalar</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Stack moderno, serverless, y completamente open source. Sin vendor lock-in,
                despliega en tu propia infraestructura.
              </p>
            </FadeIn>

            {/* Tech grid */}
            <div className="grid grid-cols-2 gap-4">
              {TECH_STACK.map((tech, index) => (
                <FadeIn key={tech.name} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`bg-gradient-to-br ${tech.gradient} border border-gray-200 rounded-xl p-4 hover:border-neon-green/30 hover:shadow-glow-sm transition-all`}
                  >
                    <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                    <p className="text-sm text-gray-500">{tech.description}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Right - Code */}
          <FadeIn delay={0.3} direction="left">
            <div className="relative">
              {/* Glow behind code */}
              <div className="absolute -inset-4 bg-neon-green/10 rounded-3xl blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-neon-green"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    lib/agents/simple-agent.ts
                  </span>
                </div>
                <CodeBlock code={CODE_EXAMPLE} language="typescript" />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

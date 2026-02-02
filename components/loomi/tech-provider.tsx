'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const STACK_LOGOS = [
  { name: 'WhatsApp', src: '/logos/whatsapp.svg' },
  { name: 'Meta', src: '/logos/meta-logo.png' },
  { name: 'Claude', src: '/logos/claude.svg' },
  { name: 'Supabase', src: '/logos/supabase.svg' },
  { name: 'Vercel', src: '/logos/vercel.svg' },
  { name: 'Stripe', src: '/logos/stripe.svg' },
];

// Static code to display
const CODE_LINES = [
  { text: 'export async function POST(req: Request) {', indent: 0 },
  { text: 'const { message, from } = await req.json()', indent: 1 },
  { text: '', indent: 0 },
  { text: '// Analyze intent with Claude', indent: 1, isComment: true },
  { text: 'const analysis = await claude.analyze({', indent: 1 },
  { text: 'message,', indent: 2 },
  { text: 'context: await getConversation(from)', indent: 2 },
  { text: '})', indent: 1 },
  { text: '', indent: 0 },
  { text: '// Send to Meta Conversions API', indent: 1, isComment: true },
  { text: 'if (analysis.intent === "PURCHASE") {', indent: 1 },
  { text: 'await meta.trackEvent("Purchase", { from })', indent: 2 },
  { text: '}', indent: 1 },
  { text: '', indent: 0 },
  { text: 'return Response.json({ success: true })', indent: 1 },
  { text: '}', indent: 0 },
];

const TERMINAL_LINES = [
  { text: 'pnpm dev', type: 'command' as const },
  { text: '▲ Ready in 847ms', type: 'info' as const },
  { text: '✓ Compiled /api/webhook in 203ms', type: 'success' as const },
  { text: '', type: 'empty' as const },
  { text: 'supabase db push', type: 'command' as const },
  { text: '✓ 3 migrations applied', type: 'success' as const },
  { text: '✓ Database synced', type: 'success' as const },
  { text: '', type: 'empty' as const },
  { text: 'vercel deploy --prod', type: 'command' as const },
  { text: '✓ Build completed', type: 'success' as const },
  { text: '✓ https://loomi.ai', type: 'success' as const },
];

function CodeLine({ line, lineNumber }: { line: typeof CODE_LINES[0]; lineNumber: number }) {
  const indent = '  '.repeat(line.indent);

  // Syntax highlighting
  let content = line.text;
  if (line.isComment) {
    return (
      <div className="flex">
        <span className="w-6 text-right pr-3 text-muted/30 select-none text-xs">{lineNumber}</span>
        <span className="text-muted/60">{indent}{content}</span>
      </div>
    );
  }

  // Keywords
  content = content.replace(/\b(export|async|function|const|await|if|return)\b/g, '<kw>$1</kw>');
  // Strings
  content = content.replace(/(".*?")/g, '<str>$1</str>');
  // Functions/types
  content = content.replace(/\b(POST|Request|Response)\b/g, '<fn>$1</fn>');

  return (
    <div className="flex">
      <span className="w-6 text-right pr-3 text-muted/30 select-none text-xs">{lineNumber}</span>
      <span className="text-foreground/80">
        {indent}
        <span
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/<kw>/g, '<span class="text-foreground">')
              .replace(/<\/kw>/g, '</span>')
              .replace(/<str>/g, '<span class="text-brand">')
              .replace(/<\/str>/g, '</span>')
              .replace(/<fn>/g, '<span class="text-amber-400">')
              .replace(/<\/fn>/g, '</span>')
          }}
        />
      </span>
    </div>
  );
}

function StaticCodeDisplay() {
  return (
    <div className="font-mono text-xs leading-5">
      {/* File path */}
      <div className="flex items-center gap-2 mb-3 text-[10px]">
        <span className="text-muted/50">~/loomi/</span>
        <span className="text-brand/80">api/webhook/route.ts</span>
      </div>

      {/* Code lines */}
      <div className="space-y-0">
        {CODE_LINES.map((line, i) => (
          <CodeLine key={i} line={line} lineNumber={i + 1} />
        ))}
      </div>
    </div>
  );
}

function TerminalDisplay() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= TERMINAL_LINES.length) {
          return 0; // Reset
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-xs leading-5">
      {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
        if (line.type === 'empty') {
          return <div key={i} className="h-5" />;
        }
        if (line.type === 'command') {
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-brand">→</span>
              <span className="text-muted/60">~</span>
              <span className="text-foreground/90">{line.text}</span>
            </div>
          );
        }
        return (
          <div
            key={i}
            className={`pl-5 ${
              line.type === 'success' ? 'text-brand' : 'text-muted/70'
            }`}
          >
            {line.text}
          </div>
        );
      })}
      {/* Cursor */}
      {visibleLines < TERMINAL_LINES.length && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-brand">→</span>
          <span className="text-muted/60">~</span>
          <motion.span
            className="w-2 h-4 bg-foreground/70"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
      )}
    </div>
  );
}

export function TechProvider() {
  const terminalRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: terminalRef,
    offset: ['start end', 'end start']
  });

  const terminalOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section className="py-28 sm:py-40 px-4 sm:px-6 relative overflow-hidden bg-background transition-colors duration-300">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand/5 blur-[150px] rounded-full" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 text-sm text-muted/80 tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Built by engineers
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Código que{' '}
            <span className="text-brand" style={{ textShadow: '0 0 40px rgba(78,205,196,0.3)' }}>
              funciona.
            </span>
          </h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            No somos una agencia que usa herramientas. Somos ingenieros que construyen infraestructura.
          </p>
        </motion.div>

        {/* Stack logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-8 mb-20"
        >
          {STACK_LOGOS.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative w-8 h-8 opacity-40 hover:opacity-80 transition-opacity"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                fill
                className="object-contain grayscale dark:invert-0"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Terminal Section */}
        <motion.div
          ref={terminalRef}
          style={{ opacity: terminalOpacity }}
          className="mb-32"
        >
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Code Editor */}
            <div className="relative rounded-xl overflow-hidden bg-surface border border-border">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <span className="text-xs text-muted/60 ml-2">code</span>
              </div>
              {/* Code content - fixed height */}
              <div className="p-4 h-[340px] overflow-hidden bg-background">
                <StaticCodeDisplay />
              </div>
            </div>

            {/* Terminal */}
            <div className="relative rounded-xl overflow-hidden bg-surface border border-border">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <span className="text-xs text-muted/60 ml-2">terminal</span>
              </div>
              {/* Terminal content - fixed height */}
              <div className="p-4 h-[340px] overflow-hidden bg-background">
                <TerminalDisplay />

                {/* Tech stats */}
                <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted/60">Response time</span>
                    <span className="text-brand font-mono">~0.8s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted/60">Uptime</span>
                    <span className="text-brand font-mono">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted/60">Edge regions</span>
                    <span className="text-brand font-mono">Global</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {['TypeScript', 'Next.js 14', 'Edge Runtime', 'PostgreSQL', 'Real-time'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs font-mono text-muted/60 border border-border rounded-full"
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Key differentiators */}
        <div className="grid md:grid-cols-3 gap-12 lg:gap-20 mb-32">
          {[
            {
              title: 'Tech Provider',
              desc: 'API de WhatsApp directo con Meta. Sin intermediarios.',
              color: 'brand',
            },
            {
              title: 'Server-side',
              desc: 'Conversions API que cierra el loop con Meta Ads.',
              color: 'brand',
            },
            {
              title: 'Edge-first',
              desc: 'Respuestas en <100ms desde cualquier parte del mundo.',
              color: 'brand',
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <h3 className={`text-2xl font-bold text-${item.color} mb-3`}>
                {item.title}
              </h3>
              <p className="text-muted">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-mono text-muted/50 mb-4 tracking-wider">
            // No low-code. No templates. Real engineering.
          </p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Construido por ingenieros,
            <br />
            <span className="text-brand" style={{ textShadow: '0 0 40px rgba(78,205,196,0.3)' }}>
              para escalar.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

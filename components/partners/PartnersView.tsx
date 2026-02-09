'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Sun, Moon, FileText, Code, Database, Layers, Zap } from 'lucide-react';

interface PartnersViewProps {
  userEmail: string;
}

export default function PartnersView({ userEmail }: PartnersViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<string>('tech-stack');

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('loomi-theme', next);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const sections = [
    { id: 'tech-stack', label: 'stack', icon: Code },
    { id: 'architecture', label: 'arquitectura', icon: Layers },
    { id: 'database', label: 'integraciones', icon: Database },
    { id: 'roadmap', label: 'roadmap', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-background border-border">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-terminal-red" />
              <div className="w-2 h-2 rounded-full bg-terminal-yellow" />
              <div className="w-2 h-2 rounded-full bg-terminal-green" />
            </div>
            <span className="text-sm font-semibold text-foreground font-mono">loomi_partners</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted font-mono hidden sm:block">
              {userEmail}
            </span>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded transition-colors text-muted hover:text-foreground"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded transition-colors text-muted hover:text-foreground"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Title */}
          <div className="mb-12">
            <h1 className="text-2xl font-medium text-foreground font-mono">
              resumen_ejecutivo
            </h1>
            <p className="text-sm mt-2 text-muted">
              Documentacion tecnica y estado del proyecto Loomi.lat
            </p>
          </div>

          {/* Section Navigation */}
          <nav className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono transition-all ${
                    activeSection === section.id
                      ? 'bg-foreground text-background'
                      : 'bg-surface border border-border text-muted hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  ./{section.label}
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className="bg-surface-elevated border border-border rounded-xl p-6">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
              </div>
              <span className="text-xs text-muted font-mono ml-2">
                loomi ~ /{activeSection}
              </span>
            </div>

            {/* Dynamic Content Based on Section */}
            {activeSection === 'tech-stack' && <TechStackSection />}
            {activeSection === 'architecture' && <ArchitectureSection />}
            {activeSection === 'database' && <DatabaseSection />}
            {activeSection === 'roadmap' && <RoadmapSection />}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted font-mono text-center">
              $ last_updated: <span className="text-terminal-green">{new Date().toLocaleDateString('es-MX')}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Section Components
function ArchitectureSection() {
  return (
    <div className="space-y-6 text-sm">
      <p className="text-terminal-green font-mono">$ tree arquitectura/</p>

      {/* Sistema Multi-Agente */}
      <div className="space-y-3">
        <h3 className="text-foreground text-lg font-medium">Sistema Multi-Agente de IA</h3>
        <div className="space-y-2 text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terminal-green" />
            <span><span className="text-foreground">Fast path:</span> respuestas en ~1.5s para mensajes simples</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terminal-yellow" />
            <span><span className="text-foreground">Full path:</span> analisis multi-agente (~2-4s) para conversaciones complejas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terminal-green" />
            <span><span className="text-foreground">Deteccion automatica:</span> sentimiento, fase de venta, objeciones, industria (15 tipos)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terminal-green" />
            <span><span className="text-foreground">Few-shot learning:</span> ejemplos personalizables por tenant</span>
          </div>
        </div>
      </div>

      {/* Multi-Tenancy */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-foreground font-medium">Multi-Tenancy Enterprise</h3>
        <div className="space-y-2 text-muted">
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Aislamiento completo de datos (RLS en Supabase)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Credenciales WhatsApp encriptadas (AES-256-GCM)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Cada cliente tiene: prompt custom, knowledge base, herramientas personalizadas</span>
          </div>
        </div>
      </div>

      {/* Sistemas de Soporte */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-foreground font-medium">Sistemas de Soporte</h3>
        <div className="space-y-2 text-muted">
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">✓</span>
            <span>Follow-ups automaticos (recordatorios de demo)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">✓</span>
            <span>Auto-escalacion a humanos en errores</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">✓</span>
            <span>Rate limiting distribuido</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">✓</span>
            <span>Graceful degradation en todas las capas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechStackSection() {
  const stack = [
    {
      tech: 'Next.js 14',
      category: 'Framework',
      description: 'Framework React full-stack. App Router para routing, Server Components para SSR, API Routes para backend. Todo en un solo proyecto.',
      files: 'app/, components/',
    },
    {
      tech: 'TypeScript',
      category: 'Lenguaje',
      description: 'JavaScript con tipos estaticos. Previene errores en compile-time, autocompletado en IDE, documentacion inline.',
      files: '*.ts, *.tsx',
    },
    {
      tech: 'Supabase',
      category: 'Base de datos',
      description: 'PostgreSQL managed + Auth + Realtime. Maneja usuarios, sesiones, y sincroniza cambios en tiempo real al dashboard (Kanban, conversaciones).',
      files: 'lib/supabase/',
    },
    {
      tech: 'OpenAI API',
      category: 'IA',
      description: 'GPT-4o para conversaciones complejas, GPT-4o-mini para analisis rapido. Sistema dual-layer: fast path (1.5s) y full path (2-4s).',
      files: 'lib/agents/',
    },
    {
      tech: 'WhatsApp Cloud API',
      category: 'Mensajeria',
      description: 'API oficial de Meta. Recibe mensajes via webhook, envia respuestas, botones interactivos. Requiere Business Manager verificado.',
      files: 'app/api/webhook/whatsapp/',
    },
    {
      tech: 'Stripe',
      category: 'Pagos',
      description: 'Checkout sessions para suscripciones, webhooks para eventos de pago. Maneja planes starter/growth/business.',
      files: 'app/api/stripe/',
    },
    {
      tech: 'Upstash Redis',
      category: 'Cache',
      description: 'Rate limiting distribuido, cache de sesiones. Serverless-compatible, pago por request.',
      files: 'lib/redis/',
    },
    {
      tech: 'Vercel',
      category: 'Deploy',
      description: 'Hosting serverless. Deploy automatico en cada push a main. Edge functions, preview deployments por PR.',
      files: 'vercel.json',
    },
    {
      tech: 'Temporal.io',
      category: 'Orquestacion',
      description: 'Workflows duraderos para follow-ups y recordatorios. Reintentos automaticos, estado persistente. Opcional.',
      files: 'lib/temporal/',
    },
  ];

  const metrics = [
    { metric: 'Archivos TypeScript', value: '~4,500' },
    { metric: 'Lineas de codigo', value: '~36,500' },
    { metric: 'API Routes', value: '25+' },
    { metric: 'Tablas BD', value: '10+' },
    { metric: 'Componentes UI', value: '50+' },
  ];

  return (
    <div className="space-y-6 text-sm">
      <p className="text-terminal-green font-mono">$ cat package.json | jq &apos;.dependencies&apos;</p>

      {/* Stack Cards */}
      <div className="space-y-3">
        {stack.map((item, i) => (
          <div key={i} className="bg-background/50 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground font-medium">{item.tech}</span>
              <span className="text-xs text-terminal-green bg-terminal-green/10 px-2 py-0.5 rounded">
                {item.category}
              </span>
            </div>
            <p className="text-muted text-xs leading-relaxed mb-2">
              {item.description}
            </p>
            <p className="text-xs text-muted/60">
              <span className="text-terminal-yellow">ubicacion:</span> {item.files}
            </p>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-foreground font-medium mb-3">Metricas</h3>
        <div className="flex items-center gap-5 flex-wrap">
          {metrics.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="text-border">·</span>}
              <div>
                <span className="text-muted text-xs">{item.metric}</span>
                <span className="ml-2 font-mono text-foreground font-bold">{item.value}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function DatabaseSection() {
  return (
    <div className="space-y-6 text-sm">
      <p className="text-terminal-green font-mono">$ psql -c &quot;\dt&quot;</p>

      {/* Integraciones */}
      <div className="space-y-3">
        <h3 className="text-foreground text-lg font-medium">Integraciones Completas</h3>
        <div className="space-y-3">
          <div className="bg-background/50 p-3 rounded-lg border border-border">
            <p className="text-foreground font-medium">WhatsApp Cloud API</p>
            <p className="text-muted text-xs mt-1">mensajes, botones interactivos, escalacion a humanos</p>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border">
            <p className="text-foreground font-medium">Stripe</p>
            <p className="text-muted text-xs mt-1">checkout sessions, webhooks de pago</p>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border">
            <p className="text-foreground font-medium">Meta Conversions API</p>
            <p className="text-muted text-xs mt-1">optimizacion de campanas publicitarias</p>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border">
            <p className="text-foreground font-medium">HubSpot</p>
            <p className="text-muted text-xs mt-1">sincronizacion de leads</p>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border">
            <p className="text-foreground font-medium">Cal.com</p>
            <p className="text-muted text-xs mt-1">agendamiento de demos</p>
          </div>
        </div>
      </div>

      {/* Dashboard y CRM */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-foreground font-medium">Dashboard y CRM</h3>
        <div className="space-y-2 text-muted">
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Pipeline Kanban en tiempo real (Supabase realtime)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Historial de conversaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Configuracion del agente sin codigo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Editor de prompts personalizados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">→</span>
            <span>Analytics basico</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div className="space-y-6 text-sm">
      <p className="text-terminal-green font-mono">$ git log --oneline roadmap</p>

      {/* En desarrollo */}
      <div className="space-y-3">
        <h3 className="text-foreground text-lg font-medium">En Desarrollo</h3>
        <div className="space-y-3">
          <div className="bg-background/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-terminal-yellow animate-pulse" />
              <span className="text-foreground font-medium">Llamadas de voz</span>
            </div>
            <p className="text-muted text-xs">WhatsApp Voice - atencion por voz con IA</p>
          </div>

          <div className="bg-background/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-terminal-yellow animate-pulse" />
              <span className="text-foreground font-medium">Multi-numero</span>
            </div>
            <p className="text-muted text-xs">Multiples numeros WhatsApp por tenant</p>
          </div>

          <div className="bg-background/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-terminal-yellow animate-pulse" />
              <span className="text-foreground font-medium">A/B Testing</span>
            </div>
            <p className="text-muted text-xs">Testing de prompts para optimizar conversiones</p>
          </div>
        </div>
      </div>

      {/* Capacidades Construidas */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-foreground font-medium">Capacidades Construidas</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Sistema Multi-Agente IA',
            'Multi-Tenancy Enterprise',
            'WhatsApp Cloud API',
            'Stripe Payments',
            'Meta Conversions API',
            'HubSpot Sync',
            'Cal.com Scheduling',
            'Pipeline Kanban RT',
            'Follow-ups Auto',
            'Rate Limiting',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-muted">
              <span className="text-terminal-green">✓</span>
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

# Loomi.lat - Contexto del Proyecto

## Descripción
Plataforma SaaS de agentes de IA para WhatsApp. Automatiza ventas, califica leads y agenda demos 24/7.

## Stack Tecnológico
- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + shadcn/ui + Framer Motion
- **Base de datos**: Supabase (PostgreSQL)
- **IA**: OpenAI GPT-5.2 (agente full) / GPT-4o-mini (demo)
- **Pagos**: Stripe
- **Mensajería**: WhatsApp Cloud API
- **Auth**: Supabase Auth

## Estructura Principal

```
app/
├── api/
│   ├── demo/chat/        # POST - demo ligera (gpt-4o-mini)
│   ├── sandbox/          # Demo sandbox completo
│   │   ├── chat/         # POST - chat con agente full
│   │   ├── tenants/      # GET - lista tenants
│   │   ├── tools/        # CRUD herramientas custom
│   │   └── documents/    # CRUD documentos knowledge
│   ├── webhook/whatsapp/ # Webhook de WhatsApp
│   ├── stripe/           # Checkout y webhooks
│   └── leads/            # CRUD de leads
├── dashboard/            # Panel de control (protegido)
│   ├── agent/            # Configuración del agente
│   │   └── prompt/       # Prompt personalizado
│   ├── crm/              # Pipeline Kanban
│   ├── conversations/    # Historial de chats
│   └── settings/         # Configuración cuenta
├── demo/                 # Demo pública completa
├── login/                # Login + solicita acceso
└── page.tsx              # Landing page (/)

lib/
├── graph/
│   ├── graph.ts          # LangGraph entry point (processMessageGraph)
│   ├── state.ts          # Graph state schema + SimpleAgentResult type
│   ├── nodes.ts          # 5 nodes: analyze, route, summarize, generate, persist
│   ├── prompts.ts        # System prompt builder
│   └── memory.ts         # Conversation state persistence
├── agents/
│   ├── defaults.ts       # Default prompts and identity
│   ├── demo-agent.ts     # Agente ligero para landing demo
│   ├── few-shot.ts       # Ejemplos para el prompt
│   └── reasoning.ts      # Análisis con o3-mini
├── tenant/
│   └── context.ts        # Multi-tenancy y configs
└── whatsapp/
    └── send.ts           # Envío de mensajes WA

components/
├── ui/                   # shadcn/ui components
├── dashboard/            # Componentes del dashboard
└── loomi/                # Componentes del landing
    ├── interactive-demo.tsx  # Demo chat en landing
    ├── Hero.tsx
    ├── Features.tsx
    └── ...
```

## Sistema de Diseño: Terminal macOS + Vercel

### Colores (CSS Variables)
```css
:root {
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --surface: #141414;
  --surface-2: #1C1C1C;
  --border: #2A2A2A;
  --muted: #6B6B6B;
  --terminal-red: #FF5F56;
  --terminal-yellow: #FFBD2E;
  --terminal-green: #27C93F;
}

[data-theme="light"] {
  --background: #FFFFFF;
  --foreground: #0A0A0A;
  --surface: #F5F5F5;
  --surface-2: #EBEBEB;
  --border: #E0E0E0;
}
```

### Patrones de UI
- **Headers**: Traffic light dots (●●●) + título font-mono
- **Botones primary**: `bg-foreground text-background`
- **Botones secondary**: `bg-surface border-border`
- **Inputs**: `bg-background border-border font-mono`
- **No Cards para métricas**: No usar tarjetas/cards para mostrar stats, métricas o KPIs. Usar layouts inline compactos (stat bars, rows con separadores `·` o `|`) siguiendo la estética terminal. Las cards de Kanban (LeadCard) son items arrastrables y se mantienen.
- **Status**: `text-terminal-green` (ok), `text-terminal-yellow` (warn), `text-terminal-red` (error)

## Agentes de IA

### Demo Agent (`/api/demo/chat`)
- **Modelo**: gpt-4o-mini
- **Uso**: Landing page demo
- **Características**: Rápido, 1 API call, respuestas cortas
- **Prompt**: Simplificado para ventas

### Full Agent (`/api/sandbox/chat`)
- **Modelo**: gpt-4o (optimizado para velocidad)
- **Uso**: Sandbox y producción
- **Características**:
  - Multi-agent analysis (gpt-4o-mini) - con fast path para mensajes simples
  - Sentiment detection
  - Few-shot learning
  - Memory contextual
  - Custom tools
  - Knowledge documents
- **Latencia**: ~2-4s (vs ~15-25s con modelos reasoning)

## Base de Datos (Supabase)

### Tablas Principales
- `tenants` - Usuarios/empresas
- `agent_configs` - Config del agente por tenant
- `leads` - Contactos/prospectos
- `conversations` - Historial de chats
- `messages` - Mensajes individuales
- `tenant_documents` - Knowledge base por tenant
- `tenant_tools` - Herramientas custom por tenant

### Campos de agent_configs
```sql
- system_prompt TEXT        -- Prompt personalizado
- few_shot_examples JSONB   -- Ejemplos de conversación
- products_catalog JSONB    -- Catálogo de productos
- tone TEXT                 -- 'professional' | 'friendly' | 'casual'
```

## Rutas Importantes

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page con demo interactiva |
| `/login` | Login o solicitar acceso demo |
| `/demo` | Demo completa (tools, docs, prompts) |
| `/dashboard` | Panel principal |
| `/dashboard/agent` | Configurar agente |
| `/dashboard/agent/prompt` | Prompt personalizado |
| `/dashboard/crm` | Pipeline Kanban |

## Comandos

```bash
npm run dev          # Desarrollo (localhost:3000)
npm run build        # Build producción
npx supabase db push # Ejecutar migraciones
```

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
WHATSAPP_VERIFY_TOKEN=
```

## Demo del Landing

El chat en el landing (`InteractiveDemo`) funciona así:

1. **Botones rápidos** ("¿Precio?", etc.) → Respuesta scripted instantánea
2. **Mensaje libre** → Llama a `/api/demo/chat` (gpt-4o-mini, rápido)
3. **Aviso** → "Demo simplificada, solicita acceso completo"

## Demo Completa (`/demo`)

Features:
- Selector de tenant
- Toggle default/custom prompt
- Panel de tools y documentos
- Rate limiting: 10 msg/min
- Usa el agente full (gpt-5.2)

## Commits Recientes

```
feat: add demo-agent for fast landing page responses
feat: add knowledge documents and custom tools to sandbox
style: update sandbox to terminal macOS + Vercel design
feat: add custom prompt selector to sandbox
feat: add sandbox demo for client demonstrations
```

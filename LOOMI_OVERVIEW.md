# LOOMI.LAT - Documentacion Completa del Proyecto

> Plataforma SaaS de agentes de IA para WhatsApp. Automatiza ventas, califica leads y agenda demos 24/7.
> Ultima actualizacion: 11 de febrero 2026

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Arquitectura de Archivos](#3-arquitectura-de-archivos)
4. [Rutas y Paginas](#4-rutas-y-paginas)
5. [API Endpoints (54 rutas)](#5-api-endpoints)
6. [Base de Datos (Supabase)](#6-base-de-datos)
7. [Sistema de Diseno](#7-sistema-de-diseno)
8. [Landing Page](#8-landing-page)
9. [Dashboard](#9-dashboard)
10. [Pipeline de IA (End-to-End)](#10-pipeline-de-ia)
11. [Integraciones](#11-integraciones)
12. [Multi-Tenancy](#12-multi-tenancy)
13. [Auth y Middleware](#13-auth-y-middleware)
14. [Broadcasts](#14-broadcasts)
15. [Sistema de Handoff](#15-sistema-de-handoff)
16. [Follow-ups y Automatizaciones](#16-follow-ups-y-automatizaciones)
17. [Variables de Entorno](#17-variables-de-entorno)
18. [Estado Actual (Git)](#18-estado-actual)

---

## 1. Resumen Ejecutivo

**Loomi.lat** es una plataforma SaaS multi-tenant que proporciona agentes de IA para WhatsApp enfocados en ventas B2B. El agente califica leads, maneja objeciones, agenda demos via Cal.com, envia links de pago via Stripe, y escala a humanos cuando es necesario.

**Metricas clave del producto:**
- Respuesta en ~0.8s
- 100% leads atendidos 24/7
- 3x mas demos agendadas
- -78% no-shows

**Equipo fundador:** Victor Gallo, Carlos Cardona, JJ Cardona (Anthana)
**Etapa:** Pre-seed | Revenue verificado: $45K | TAM: $23B+ (LATAM + MENA)

---

## 2. Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Estilos** | Tailwind CSS, Framer Motion |
| **UI Kit** | shadcn/ui, Lucide Icons |
| **Base de datos** | Supabase (PostgreSQL + RLS + Realtime) |
| **Auth** | Supabase Auth (JWT en cookie) |
| **IA - Generacion** | Claude 3.5 Sonnet (produccion), GPT-4o (fallback) |
| **IA - Analisis** | Claude Haiku 4.5 (multi-agent analysis) |
| **IA - Demo** | GPT-4o-mini (landing page) |
| **AI Framework** | Vercel AI SDK + LangGraph |
| **Mensajeria** | WhatsApp Cloud API |
| **Scheduling** | Cal.com API + Temporal.io (opcional) |
| **Pagos** | Stripe + Stripe Connect |
| **CRM externo** | HubSpot (sync) |
| **Ads** | Meta Conversions API |
| **Telefonia** | Twilio (provisioning numeros) |
| **Rate Limiting** | Upstash Redis |
| **Voz** | ElevenLabs (demo en landing) |
| **Hosting** | Vercel |

---

## 3. Arquitectura de Archivos

```
app/
├── page.tsx                          # Landing page (/)
├── login/page.tsx                    # Login / Signup
├── demo/page.tsx                     # Demo sandbox completo
├── privacy/page.tsx                  # Politica de privacidad
├── terms/page.tsx                    # Terminos de servicio
├── data-deletion/page.tsx            # GDPR data deletion
├── partners/page.tsx                 # Portal de partners (auth)
├── investors/page.tsx                # Data room para inversores
├── api/
│   ├── auth/                         # Signup, confirm, setup-tenant
│   ├── demo/chat/                    # Demo agent (gpt-4o-mini)
│   ├── demo/slots/                   # Slots disponibles (demo)
│   ├── demo/book/                    # Agendar demo
│   ├── sandbox/chat/                 # Full agent sandbox
│   ├── sandbox/tenants/              # Lista tenants demo
│   ├── sandbox/documents/            # CRUD documentos
│   ├── sandbox/tools/                # CRUD herramientas
│   ├── webhook/whatsapp/             # Webhook principal WhatsApp
│   ├── whatsapp/connect/             # Embedded Signup Meta
│   ├── whatsapp/waba/                # Info WABA
│   ├── leads/                        # CRUD leads + classify
│   ├── conversations/[id]/           # Messages, reply, resume
│   ├── broadcasts/                   # CRUD campanas + send
│   ├── broadcasts/templates/         # Templates WhatsApp
│   ├── integrations/calcom/          # OAuth Cal.com (connect/callback/disconnect/credentials)
│   ├── integrations/stripe/          # Stripe Connect (connect/callback/disconnect/credentials)
│   ├── stripe/checkout/              # Crear checkout session
│   ├── stripe/webhook/               # Webhook Stripe
│   ├── twilio/numbers/               # Search, purchase, verify
│   ├── twilio/sms/webhook/           # SMS fallback
│   ├── onboarding/                   # Chat, test-agent, progress, complete, templates
│   ├── agent-setup/process/          # Procesar wizard de config
│   ├── train/                        # Entrenar few-shot
│   ├── eval/                         # Evaluar respuestas
│   ├── voice/generate/               # Voz (ElevenLabs)
│   ├── cron/followups/               # Cron follow-ups
│   ├── cron/meta-conversions/        # Cron Meta CAPI
│   ├── contact/                      # Formulario contacto
│   └── test/                         # Reset test data, test-cal
├── dashboard/
│   ├── page.tsx                      # Overview con stats
│   ├── layout.tsx                    # Layout wrapper
│   ├── agent/
│   │   ├── page.tsx                  # Redirect a setup
│   │   ├── setup/                    # Wizard interactivo (3 pasos)
│   │   ├── prompt/                   # Editor de prompt
│   │   ├── knowledge/                # Knowledge base
│   │   └── tools/                    # Integraciones (Cal.com, Stripe, Twilio)
│   ├── crm/                          # Pipeline Kanban
│   ├── conversations/                # Inbox + [id] detail
│   ├── analytics/                    # Metricas y KPIs
│   ├── settings/                     # Config cuenta
│   └── connect/                      # Conexion WhatsApp + Twilio
└── broadcasts/
    ├── page.tsx                      # Lista campanas
    ├── [id]/page.tsx                 # Detalle campana
    └── [id]/conversations/           # Respuestas broadcast

lib/
├── agents/
│   ├── simple-agent.ts               # Agente principal (1000+ lineas)
│   ├── demo-agent.ts                 # Agente ligero (gpt-4o-mini)
│   ├── multi-agent.ts                # Analisis multi-agente (Haiku)
│   ├── reasoning.ts                  # Razonamiento rapido
│   ├── sentiment.ts                  # Deteccion de sentimiento
│   ├── few-shot.ts                   # Seleccion de ejemplos
│   ├── embeddings.ts                 # Embeddings semanticos
│   ├── industry.ts                   # Deteccion de industria
│   ├── defaults.ts                   # Prompts y configs default
│   ├── model.ts                      # Resolucion de modelo
│   ├── conversation-state.ts         # Estado de conversacion
│   ├── progress-tracker.ts           # Anti-loop y progreso
│   └── response-guard.ts             # Validacion de respuesta
├── graph/
│   ├── state.ts                      # Schema del estado LangGraph
│   ├── graph.ts                      # Compilacion del grafo
│   ├── nodes.ts                      # 5 nodos: analyze, route, summarize, generate, persist
│   ├── prompts.ts                    # Construccion de system prompt
│   └── memory.ts                     # Persistencia de estado
├── tenant/
│   ├── context.ts                    # Lookup de tenant, credenciales
│   └── knowledge.ts                  # Documentos y tools por tenant
├── memory/
│   ├── supabase.ts                   # Queries a Supabase
│   ├── context.ts                    # ConversationContext builder
│   └── generate.ts                   # Generacion de resumenes
├── whatsapp/
│   ├── send.ts                       # Envio de mensajes, templates, schedule lists
│   ├── parse.ts                      # Parseo de webhooks
│   ├── audio.ts                      # Transcripcion de audio (Whisper)
│   └── autoresponder.ts              # Deteccion auto-responders
├── integrations/
│   ├── hubspot.ts                    # Sync leads a HubSpot
│   ├── meta-conversions.ts           # Meta Conversions API
│   └── tenant-integrations.ts        # Gestion tokens OAuth
├── tools/calendar.ts                 # Cal.com availability y booking
├── handoff/index.ts                  # Escalacion a humano
├── followups/scheduler.ts            # Scheduler de follow-ups
├── stripe/checkout.ts                # Checkout sessions
├── knowledge/                        # Knowledge tools para RAG
├── supabase/
│   ├── client.ts                     # Cliente browser
│   └── server.ts                     # Cliente server
├── crypto.ts                         # AES-256-GCM encryption
├── ratelimit.ts                      # Rate limiting (Upstash Redis)
├── bot-pause.ts                      # Pausar/reanudar agente
├── constants.ts                      # Constantes globales
├── formatters.ts                     # Formateadores de texto
├── translations.ts                   # i18n
└── utils.ts                          # Utilidades generales

components/
├── ui/                               # shadcn/ui (button, badge, card, input, etc.)
├── loomi/                            # Landing page sections
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── how-it-works.tsx
│   ├── interactive-demo.tsx
│   ├── meta-loop.tsx
│   ├── Pricing.tsx
│   ├── Testimonials.tsx
│   ├── cta.tsx
│   └── Footer.tsx
├── dashboard/                        # Dashboard components
│   ├── DashboardShell.tsx            # Layout principal
│   ├── TenantDashboard.tsx           # Contenido overview
│   ├── crm/                          # KanbanBoard, KanbanColumn, LeadCard
│   ├── TwilioNumberProvisioning.tsx
│   ├── WhatsAppConnectFlow.tsx
│   └── ConnectionStatus.tsx
└── partners/PartnersView.tsx
```

---

## 4. Rutas y Paginas

### Paginas Publicas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing page con hero, stats, demo interactiva, pricing, testimonios |
| `/login` | Login/Signup con email+password, auto-crea tenant |
| `/demo` | Sandbox completo con selector de tenant, tools, docs |
| `/privacy` | Politica de privacidad |
| `/terms` | Terminos de servicio |
| `/data-deletion` | Solicitud eliminacion de datos (GDPR) |
| `/investors` | Data room: metricas, equipo, documentos, proyecciones |

### Paginas Protegidas

| Ruta | Descripcion |
|------|-------------|
| `/partners` | Portal de partners (email autorizado) |
| `/dashboard` | Overview con stats en tiempo real |
| `/dashboard/agent/setup` | Wizard interactivo de configuracion (3 pasos) |
| `/dashboard/agent/prompt` | Editor de system prompt y few-shot |
| `/dashboard/agent/knowledge` | Subir/gestionar documentos knowledge |
| `/dashboard/agent/tools` | Integraciones: Cal.com, Stripe Connect, Twilio |
| `/dashboard/crm` | Pipeline Kanban drag-and-drop |
| `/dashboard/conversations` | Inbox de conversaciones + detalle |
| `/dashboard/analytics` | Metricas y KPIs |
| `/dashboard/settings` | Config de cuenta y suscripcion |
| `/dashboard/connect` | Conexion WhatsApp + provisioning Twilio |
| `/broadcasts` | Campanas de broadcast |
| `/broadcasts/[id]` | Detalle de campana + respuestas |

---

## 5. API Endpoints

### Auth (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/auth/signup` | Crear cuenta |
| POST | `/api/auth/confirm-signup` | Confirmar email |
| POST | `/api/auth/setup-tenant` | Auto-crear tenant |

### Demo (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/demo/chat` | Demo agent (gpt-4o-mini, rate-limited) |
| POST | `/api/demo/slots` | Slots disponibles |
| POST | `/api/demo/book` | Agendar demo |

### Sandbox (4)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/sandbox/chat` | Full agent con knowledge/tools |
| GET | `/api/sandbox/tenants` | Lista tenants demo |
| POST/DELETE | `/api/sandbox/documents` | CRUD documentos |
| POST/DELETE | `/api/sandbox/tools` | CRUD herramientas |

### WhatsApp (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/webhook/whatsapp` | Webhook principal (recibe/procesa/responde) |
| POST | `/api/whatsapp/connect` | Embedded Signup (conectar WABA) |
| POST | `/api/whatsapp/waba` | Info del WABA |

### Leads (5)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET/POST | `/api/leads` | Listar/crear leads |
| GET/PUT/DELETE | `/api/leads/[id]` | CRUD individual |
| GET | `/api/leads/[id]/messages` | Mensajes del lead |
| POST | `/api/leads/classify` | Clasificacion ML (hot/warm/cold) |

### Conversations (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET | `/api/conversations/[id]/messages` | Mensajes de conversacion |
| POST | `/api/conversations/[id]/reply` | Responder desde dashboard |
| POST | `/api/conversations/[id]/resume` | Reanudar conversacion |

### Broadcasts (6)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET/POST | `/api/broadcasts` | Listar/crear campanas |
| GET | `/api/broadcasts/templates` | Templates WhatsApp aprobados |
| GET/PUT/DELETE | `/api/broadcasts/[id]` | CRUD campana |
| POST | `/api/broadcasts/[id]/send` | Enviar campana |
| GET | `/api/broadcasts/[id]/conversations` | Respuestas de broadcast |

### Integraciones - Cal.com (4)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET | `/api/integrations/calcom/connect` | Iniciar OAuth |
| GET | `/api/integrations/calcom/callback` | Callback OAuth |
| POST | `/api/integrations/calcom/disconnect` | Desconectar |
| GET | `/api/integrations/calcom/credentials` | Obtener credenciales |

### Integraciones - Stripe (6)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET | `/api/integrations/stripe/connect` | Iniciar Stripe Connect |
| GET | `/api/integrations/stripe/callback` | Callback Connect |
| POST | `/api/integrations/stripe/disconnect` | Desconectar |
| GET | `/api/integrations/stripe/credentials` | Info cuenta |
| POST | `/api/stripe/checkout` | Crear checkout session |
| POST | `/api/stripe/webhook` | Webhook Stripe |

### Twilio (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| GET | `/api/twilio/numbers/search` | Buscar numeros disponibles |
| POST | `/api/twilio/numbers` | Comprar numero |
| POST | `/api/twilio/numbers/[id]/verification` | Verificar para WhatsApp |

### Onboarding (5)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/onboarding/chat` | Chat del onboarding |
| POST | `/api/onboarding/test-agent` | Probar agente |
| GET | `/api/onboarding/progress` | Estado del onboarding |
| POST | `/api/onboarding/complete` | Marcar completado |
| GET | `/api/onboarding/templates` | Lista templates WA |

### Agent Setup y Training (3)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/agent-setup/process` | Procesar wizard (extraer config) |
| POST | `/api/train` | Entrenar few-shot examples |
| POST | `/api/eval` | Evaluar respuestas del agente |

### Otros (6)

| Metodo | Endpoint | Proposito |
|--------|----------|-----------|
| POST | `/api/voice/generate` | Generar voz (ElevenLabs) |
| POST | `/api/cron/followups` | Cron: procesar follow-ups |
| POST | `/api/cron/meta-conversions` | Cron: sync Meta CAPI |
| POST | `/api/contact` | Formulario de contacto |
| POST | `/api/test/reset` | Reset datos de test |
| POST | `/api/test-cal` | Test integracion Cal.com |

**Total: 54 endpoints**

---

## 6. Base de Datos

### Tablas Principales (18)

#### `tenants` - Empresas/Usuarios
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
email           TEXT UNIQUE NOT NULL
company_name    TEXT
subscription_tier TEXT DEFAULT 'starter'  -- starter|growth|pro|enterprise
stripe_customer_id TEXT UNIQUE
stripe_subscription_id TEXT
subscription_status TEXT DEFAULT 'pending' -- pending|active|past_due|canceled
meta_business_id TEXT
settings        JSONB DEFAULT '{}'
onboarding_status JSONB DEFAULT '{currentStep, completedSteps, startedAt, ...}'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### `whatsapp_accounts` - Cuentas WhatsApp conectadas
```sql
id                    UUID PRIMARY KEY
tenant_id             UUID FK -> tenants (CASCADE)
waba_id               TEXT NOT NULL
phone_number_id       TEXT NOT NULL UNIQUE
display_phone_number  TEXT
business_name         TEXT
access_token_encrypted TEXT NOT NULL  -- AES-256-GCM
webhook_verify_token  TEXT
status                TEXT DEFAULT 'pending'  -- pending|active|inactive|error
connected_at          TIMESTAMPTZ
UNIQUE(tenant_id, phone_number_id)
```

#### `agent_configs` - Configuracion del agente por tenant
```sql
id                    UUID PRIMARY KEY
tenant_id             UUID FK -> tenants UNIQUE
business_name         TEXT
business_description  TEXT
products_services     TEXT
tone                  TEXT DEFAULT 'professional'  -- professional|friendly|casual|formal
custom_instructions   TEXT
business_hours        JSONB
auto_reply_enabled    BOOLEAN DEFAULT true
greeting_message      TEXT
fallback_message      TEXT
system_prompt         TEXT           -- Prompt personalizado (override)
few_shot_examples     JSONB DEFAULT '[]'
products_catalog      JSONB DEFAULT '{}'
industry              TEXT
product_context       TEXT
pricing_context       TEXT
sales_process_context TEXT
qualification_context TEXT
competitor_context    TEXT
objection_handlers    JSONB DEFAULT '{}'
analysis_enabled      BOOLEAN DEFAULT true
max_response_tokens   INTEGER DEFAULT 250
temperature           NUMERIC(3,2) DEFAULT 0.7
agent_name            TEXT
agent_role            TEXT
model                 TEXT DEFAULT 'gpt-4o'
```

#### `leads` - Contactos/Prospectos
```sql
id                      UUID PRIMARY KEY
phone                   TEXT
name                    TEXT
email                   TEXT
company_name            TEXT
contact_email           TEXT
stage                   TEXT
deal_value              DECIMAL(12,2)
priority                TEXT DEFAULT 'medium'  -- low|medium|high
is_qualified            BOOLEAN DEFAULT FALSE
is_test                 BOOLEAN DEFAULT false
broadcast_classification TEXT  -- hot|warm|cold|bot_autoresponse
challenge               TEXT
message_volume          TEXT
notes                   TEXT
last_activity_at        TIMESTAMPTZ
expected_close_date     DATE
opted_out               BOOLEAN DEFAULT false
opted_out_at            TIMESTAMPTZ
opted_out_reason        TEXT
tenant_id               UUID FK -> tenants
UNIQUE(phone, tenant_id)
```

#### `conversations` - Sesiones de chat
```sql
id          UUID PRIMARY KEY
lead_id     UUID FK -> leads
tenant_id   UUID FK -> tenants
ended_at    TIMESTAMPTZ
bot_paused  BOOLEAN DEFAULT false
paused_at   TIMESTAMPTZ
paused_by   TEXT
state       JSONB DEFAULT NULL  -- PersistedConversationState (LangGraph)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

#### `messages` - Mensajes individuales
```sql
id              UUID PRIMARY KEY
conversation_id UUID FK -> conversations
tenant_id       UUID FK -> tenants
role            TEXT  -- user|assistant|system
content         TEXT
created_at      TIMESTAMPTZ
```

#### `conversation_states` - Estado persistente (LangGraph)
```sql
id                UUID PRIMARY KEY
conversation_id   UUID UNIQUE FK -> conversations (CASCADE)
lead_id           UUID FK -> leads (CASCADE)
phase             VARCHAR(50) DEFAULT 'discovery'
turn_count        INTEGER DEFAULT 0
lead_info         JSONB DEFAULT '{business_type, volume, pain_points[], current_solution, referral_source}'
topics_covered    TEXT[] DEFAULT '{}'
products_offered  TEXT[] DEFAULT '{}'
objections        JSONB DEFAULT '[]'
summary           TEXT
last_summary_turn INTEGER DEFAULT 0
previous_topic    VARCHAR(100)
proposed_datetime JSONB
awaiting_email    BOOLEAN DEFAULT false
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

#### `pipeline_stages` - Etapas CRM personalizables
```sql
id          UUID PRIMARY KEY
tenant_id   UUID FK -> tenants (CASCADE)
name        TEXT NOT NULL
color       TEXT DEFAULT 'gray'
position    INTEGER DEFAULT 0
is_won      BOOLEAN DEFAULT FALSE
is_lost     BOOLEAN DEFAULT FALSE
UNIQUE(tenant_id, name)
```

#### `tenant_documents` - Knowledge base
```sql
id              UUID PRIMARY KEY
tenant_id       UUID FK -> tenants (CASCADE)
name            TEXT NOT NULL
description     TEXT
doc_type        TEXT DEFAULT 'text'  -- text|pdf|url|json
content         TEXT NOT NULL
content_tokens  INTEGER
source_url      TEXT
file_name       TEXT
file_size       INTEGER
is_active       BOOLEAN DEFAULT true
```

#### `tenant_tools` - Herramientas custom
```sql
id              UUID PRIMARY KEY
tenant_id       UUID FK -> tenants (CASCADE)
name            TEXT NOT NULL  -- snake_case
display_name    TEXT NOT NULL
description     TEXT NOT NULL
parameters      JSONB DEFAULT '{}'  -- JSON Schema
execution_type  TEXT DEFAULT 'webhook'  -- webhook|mock|code
webhook_url     TEXT
webhook_method  TEXT DEFAULT 'POST'
webhook_headers JSONB DEFAULT '{}'
mock_response   JSONB
is_active       BOOLEAN DEFAULT true
UNIQUE(tenant_id, name)
```

#### `broadcast_campaigns` - Campanas masivas
```sql
id                  UUID PRIMARY KEY
tenant_id           UUID FK -> tenants
name                TEXT NOT NULL
template_name       TEXT NOT NULL
template_language   TEXT DEFAULT 'es'
template_components JSONB
status              TEXT DEFAULT 'draft'  -- draft|scheduled|sending|completed|failed
total_recipients    INTEGER DEFAULT 0
sent_count          INTEGER DEFAULT 0
failed_count        INTEGER DEFAULT 0
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
```

#### `broadcast_recipients` - Destinatarios por campana
```sql
id            UUID PRIMARY KEY
campaign_id   UUID FK -> broadcast_campaigns (CASCADE)
phone         TEXT NOT NULL
name          TEXT
status        TEXT DEFAULT 'pending'  -- pending|sent|failed|delivered|read
error_message TEXT
wa_message_id TEXT
sent_at       TIMESTAMPTZ
```

#### `tenant_integrations` - OAuth (Cal.com, Stripe)
```sql
id                          UUID PRIMARY KEY
tenant_id                   UUID FK -> tenants (CASCADE)
provider                    TEXT NOT NULL  -- calcom|stripe_connect
status                      TEXT DEFAULT 'disconnected'
access_token_encrypted      TEXT
refresh_token_encrypted     TEXT
token_expires_at            TIMESTAMPTZ
cal_client_id               TEXT
cal_client_secret_encrypted TEXT
cal_event_type_id           TEXT
cal_username                TEXT
stripe_secret_key_encrypted TEXT
stripe_account_id           TEXT
stripe_onboarding_complete  BOOLEAN DEFAULT false
connected_at                TIMESTAMPTZ
error_message               TEXT
settings                    JSONB DEFAULT '{}'
UNIQUE(tenant_id, provider)
```

#### `twilio_provisioned_numbers` - Numeros comprados
```sql
id                          UUID PRIMARY KEY
tenant_id                   UUID FK -> tenants (CASCADE)
twilio_sid                  TEXT NOT NULL UNIQUE
phone_number                TEXT NOT NULL
friendly_name               TEXT
country_code                TEXT DEFAULT 'MX'
status                      TEXT DEFAULT 'active'  -- active|pending_whatsapp|whatsapp_connected|released|error
whatsapp_account_id         UUID FK -> whatsapp_accounts
verification_code           TEXT
verification_code_expires_at TIMESTAMPTZ
monthly_cost                DECIMAL(10,2)
currency                    TEXT DEFAULT 'USD'
```

#### `handoffs` - Escalaciones a humano
```sql
id              UUID PRIMARY KEY
tenant_id       UUID FK -> tenants
conversation_id UUID FK -> conversations
lead_id         UUID FK -> leads
reason          TEXT NOT NULL
priority        TEXT DEFAULT 'normal'
status          TEXT DEFAULT 'pending'
resolved_at     TIMESTAMPTZ
```

#### `conversion_events_queue` - Cola Meta CAPI
```sql
id          UUID PRIMARY KEY
event_name  TEXT NOT NULL
lead_id     UUID FK -> leads
phone       TEXT NOT NULL
email       TEXT
payload     JSONB NOT NULL
status      TEXT DEFAULT 'pending'  -- pending|sent|failed
attempts    INTEGER DEFAULT 0
last_error  TEXT
sent_at     TIMESTAMPTZ
```

#### Tablas adicionales: `accounts`, `clients`, `pricing_tiers`, `knowledge_base`, `case_studies`

### Funciones SQL

| Funcion | Proposito |
|---------|-----------|
| `get_tenant_by_phone_number_id()` | Routing webhook -> tenant |
| `get_or_create_tenant()` | Buscar/crear tenant por email |
| `is_onboarding_complete()` | Verificar onboarding |
| `get_incomplete_onboardings()` | Tenants atascados en onboarding |
| `is_admin_user()` | Verificar si es admin |
| `reset_test_data()` | Limpiar datos de test |

### Realtime (Supabase)

Tablas publicadas para actualizaciones en tiempo real:
`leads`, `conversations`, `messages`, `pipeline_stages`, `handoffs`, `clients`

### Storage Bucket

- **`client-documents`**: Privado, 50MB max, soporta PDF/images/Excel/Word

---

## 7. Sistema de Diseno

### Estetica: Terminal macOS + Vercel

#### Colores (CSS Variables)
```css
:root {
  --background: #0A0A0A;      /* Fondo oscuro */
  --foreground: #FAFAFA;      /* Texto claro */
  --surface: #141414;         /* Superficie 1 */
  --surface-2: #1C1C1C;      /* Superficie 2 */
  --border: #2A2A2A;          /* Bordes */
  --muted: #6B6B6B;           /* Texto muted */
  --terminal-red: #FF5F56;    /* Error / dot rojo */
  --terminal-yellow: #FFBD2E; /* Warning / dot amarillo */
  --terminal-green: #27C93F;  /* Success / dot verde */
}

[data-theme="light"] {
  --background: #FFFFFF;
  --foreground: #0A0A0A;
  --surface: #F5F5F5;
  --surface-2: #EBEBEB;
  --border: #E0E0E0;
}
```

#### Tipografia
- **`font-mono`**: Solo para elementos tipo terminal: titulos como `./pipeline_`, brand `loomi_`, valores numericos/tecnicos, numeros de telefono
- **Lexend (sans-serif)**: Texto body, labels, badges, inputs
- **Tamanos custom**: `text-label` (13px), `text-body` (15px)
- **Minimo**: 12px (nunca `text-[10px]`)
- **Muted contrast**: dark `#8A8A8A`, light `#5C5C5C`

#### Patrones UI
- **Headers**: Traffic light dots (red, yellow, green) + titulo `font-mono`
- **Botones primary**: `bg-foreground text-background`
- **Botones secondary**: `bg-surface border-border`
- **Inputs**: `bg-background border-border font-mono`
- **Status**: `text-terminal-green` (ok), `text-terminal-yellow` (warn), `text-terminal-red` (error)
- **No Cards para metricas**: Layouts inline compactos (stat bars, rows con separadores)
- **Cards Kanban**: Solo para LeadCard (items arrastrables)

---

## 8. Landing Page

Secciones en orden de aparicion (`/`):

### 1. Navbar
- Logo con traffic light dots + "loomi_"
- Links: features, proceso, precios
- Theme toggle, Login, Demo CTA
- Menu mobile responsive

### 2. Hero
- Titulo animado "LOOMI_" con cursor parpadeante
- Tagline: "Agente AI para WhatsApp que vende 24/7"
- Badge "Meta Tech Provider"
- Demo chat (HeroDemo) mostrando conversacion de ventas
- CTA: "agendar-demo" (link WhatsApp)

### 3. Stats
4 metricas animadas en grid:
- 0.8s respuesta
- 100% leads atendidos
- 3x mas demos
- -78% no-shows

### 4. How It Works
"De 'hola' a demo" - 4 pasos con timeline vertical:
1. Lead escribe
2. Loomi responde (0.8s, califica, personaliza)
3. Agenda demo (Cal.com, confirmacion automatica)
4. Tu cierras (lead preparado, contexto completo)

### 5. Interactive Demo
Chat en vivo con el agente real:
- Conecta a `/api/demo/chat` (gpt-4o-mini)
- Voz ON/OFF (ElevenLabs)
- Steps de analisis animados (contexto, sentimiento, intencion, respuesta)
- 6 botones rapidos: Precio, Como funciona, Es caro, Ya uso Wati, No confio en bots, Quiero demo
- Badges de capacidades despues de cada respuesta

### 6. Meta Loop
"Cierra el loop con Meta Ads" - integracion Meta Conversions API:
1. El problema: "Meta no sabe que paso" (rojo)
2. Loomi reporta cada conversion
3. Meta aprende quien compra
4. CPL baja -32% promedio

### 7. Pricing
Toggle mensual/anual (-20%):
| Plan | Mensual | Anual | Mensajes |
|------|---------|-------|----------|
| Starter | $199 | $159 | 100/dia |
| Growth (popular) | $349 | $279 | 300/dia |
| Business | $599 | $479 | 1,000/dia |
| Enterprise | Custom | Custom | Ilimitado |

"14 dias gratis, sin tarjeta"

### 8. Testimonials
3 testimonios rotando (carousel 5s):
- Maria Gonzalez: "+340% demos"
- Carlos Ruiz: "85% calificados"
- Ana Martinez: "-78% no-shows"

### 9. CTA
"Cuantos leads perdiste hoy?" + boton "agendar-demo"

### 10. Footer
Brand, social links (WA, LinkedIn, IG), nav links, Meta Tech Provider badge, "made with love in mexico"

### Pagina Inversores (`/investors`)
Data room con: overview, metricas clave, equipo, documentos descargables (pitch deck, one-pager, business plan), proyecciones financieras 2026-2028, oportunidad de mercado, traccion

---

## 9. Dashboard

### Overview (`/dashboard`)
- Perfil del usuario (nombre, empresa, email)
- Estado de conexion WhatsApp
- Stats en tiempo real (Supabase subscriptions):
  - Total leads
  - Conversaciones activas (24h)
  - Leads warm
  - Leads hot
- Quick links a todas las secciones
- Tier de suscripcion

### CRM / Pipeline (`/dashboard/crm`)
- **Kanban drag-and-drop** con etapas personalizables
- **Default stages**: Nuevo -> Contactado -> Calificado -> Propuesta -> Negociacion -> Ganado / Perdido
- Crear/editar/eliminar leads
- Buscar y filtrar
- Boton "Analizar" para clasificacion ML (hot/warm/cold/bot_autoresponse)
- Valor total del pipeline (currency formatted)
- Export CSV por columna
- Actualizaciones en tiempo real

### Conversations / Inbox (`/dashboard/conversations`)
- Lista de conversaciones ordenadas por clasificacion (hot -> warm -> cold)
- Filtros: Todas, Hot, Warm, Cold
- Busqueda por nombre, telefono, contenido
- **Alertas de handoff** en tiempo real (prioridad, link directo)
- Stats bar: total chats, activos hoy, total mensajes
- **Detalle** (`/dashboard/conversations/[id]`): transcript completo, metadata del lead

### Agent Config (`/dashboard/agent/*`)

#### Setup Wizard (`/agent/setup`)
Wizard de 3 pasos interactivo:
1. **Conversar**: Chat con IA que pregunta sobre tu negocio (que vendes, precios, proceso de venta, objeciones)
2. **Revisar**: Config extraida por IA: system prompt, productos, pricing, proceso, calificacion, objection handlers, few-shot
3. **Activar**: Guardar y activar

#### Prompt Editor (`/agent/prompt`)
- Editar system prompt custom
- Gestionar few-shot examples
- Configurar catalogo de productos

#### Knowledge Base (`/agent/knowledge`)
- Subir documentos (texto, archivos, contenido manual)
- Metadata: nombre, descripcion, tipo
- Tracking de tokens
- Eliminar documentos

#### Integraciones (`/agent/tools`)
- **Cal.com**: Conectar calendario (OAuth), seleccionar event type
- **Stripe Connect**: Configurar pagos (OAuth), gestionar cuenta
- **Custom Tools**: Framework para mas integraciones
- Indicadores de estado (connected/pending/error/disconnected)

### WhatsApp Connection (`/dashboard/connect`)
- Gestionar cuentas WhatsApp conectadas
- Twilio number provisioning (comprar numeros)
- Agregar numeros pre-verificados
- Sync con Meta WABAs
- Estados: active/pending/error

### Analytics (`/dashboard/analytics`)
- Total leads (all-time)
- Leads calificados (count + %)
- Response rate (conversaciones/leads)
- Tendencias mensuales (leads, mensajes, appointments)
- Distribucion por etapa del pipeline (bar charts)
- Coming soon: graficos de tendencia, analisis de sentimiento

### Settings (`/dashboard/settings`)
- Info de cuenta (nombre, email, empresa, miembro desde)
- Plan actual y status de suscripcion
- Info WhatsApp (status, telefono, business name, numeros conectados)
- Danger zone: eliminar cuenta

---

## 10. Pipeline de IA

### Diagrama de Flujo Completo

```
[WhatsApp mensaje entrante]
         |
    [Parse webhook]
         |
    [Dedup check] -----> (duplicado? return)
         |
    [Resolver tenant] (phone_number_id -> tenant_id)
         |
    [Cargar config] (agent_config, documents, tools)
         |
    [Audio?] -----> [Transcribir Whisper]
         |
    [Rate limit + Lock]
         |
    [Mark as read] (blue checkmarks)
         |
    [Build context] (lead, conversation, history 20 msgs, memory)
         |
    [Handlers deterministicos]
    ├── Slot selection? -> Guardar pendingSlot, pedir email
    ├── "Otros dias"? -> Fetch +3 dias Cal.com, enviar lista
    ├── Cambiar hora? -> Clear slot, re-enviar lista
    ├── Email + pendingSlot? -> Crear evento Cal.com, confirmar
    ├── Plan selection? -> Guardar pendingPlan, pedir email
    └── Email + pendingPlan? -> Crear checkout Stripe, enviar link
         |
    (si match deterministico -> return sin LLM)
         |
    [Handoff detection]
    ├── Keywords: "hablar con humano", "frustrad@", "no funciona"
    └── 3+ failures recientes -> escalate
         |
    (si handoff -> notificar operador, return)
         |
    ===== AGENTE LLM =====
         |
    [Build history con time gap awareness]
    (gaps >2h -> inyectar nota de sistema)
         |
    [Few-shot selection]
    (embeddings semanticos -> 2 mejores ejemplos de 20+)
         |
    [Multi-agent analysis] (Claude Haiku 4.5)
    ├── fase_actual (11 fases)
    ├── ya_preguntamos / ya_sabemos
    ├── hay_objecion + tipo_objecion
    ├── nivel_interes (bajo|medio|alto)
    ├── listo_para_demo / listo_para_comprar
    ├── siguiente_paso + pregunta_a_hacer
    ├── sentimiento + tono_recomendado
    ├── industria_detectada + urgencia
    └── (fallback: fast reasoning si falla)
         |
    [Progress tracking]
    (detectar preguntas repetidas, stalling >4 turnos, inyectar pivot)
         |
    [Construir system prompt]
    ├── 1. Base prompt (custom o default "Lu")
    ├── 2. Industria especifica
    ├── 3. Contexto (nombre, memoria)
    ├── 4. Knowledge documents
    ├── 5. Few-shot examples
    ├── 6. Seller instructions (analisis multi-agente)
    ├── 7. Progress alerts (anti-loop)
    ├── 8. Sentiment instruction
    └── 9. Reglas: max 2 oraciones + 1 pregunta, UNA pregunta por mensaje
         |
    [generateText()] (Vercel AI SDK)
    ├── model: Claude 3.5 Sonnet (o tenant override)
    ├── tools: schedule_demo, send_payment_link, escalate_to_human, book_demo, custom
    ├── temperature: 0.7 (default)
    └── maxOutputTokens: 250 (default)
         |
    [Response guard]
    ├── Strip markdown
    ├── Trim a max 3 oraciones
    ├── Forzar single question
    ├── Remover prefijo de nombre
    └── Validar promesas (si promete horarios -> trigger schedule_demo)
         |
    ===== POST-PROCESAMIENTO =====
         |
    [Enviar respuesta WhatsApp]
         |
    [Guardar mensaje en DB]
         |
    [Schedule list?] -> Fetch slots Cal.com, enviar lista interactiva
         |
    ===== BACKGROUND (no-blocking) =====
         |
    ├── Update lead metadata (industria, stage)
    ├── Schedule follow-ups (si dijo "luego" -> 48-72h)
    ├── Demo reminders (si agendo -> T-24h, T-1h)
    ├── Sync HubSpot
    ├── Track Meta Conversions
    ├── Generate memory (cada ~5 mensajes)
    └── Release lock
```

### Fases de Venta (11)

| Fase | Descripcion |
|------|-------------|
| `discovery` | Aprendiendo sobre el negocio |
| `preguntando_volumen` | Preguntando volumen de mensajes |
| `proponer_demo_urgente` | Proponer demo con urgencia |
| `listo_para_demo` | Lead listo, obtener horario |
| `dar_horarios` | Mostrando opciones de horario |
| `esperando_aceptacion` | Esperando que acepte horario |
| `esperando_confirmacion` | Confirmando cita |
| `pedir_email` | Solicitando email |
| `confirmar_y_despedir` | Confirmar y despedirse |
| `pedir_clarificacion_ya` | Pidiendo aclaracion |
| `preguntar_que_tiene` | Preguntando solucion actual |

### Tools del Agente

| Tool | Input | Accion |
|------|-------|--------|
| `schedule_demo` | reason? | Muestra lista interactiva de slots Cal.com |
| `book_demo` | date, time, name, email | Crea evento en Cal.com |
| `send_payment_link` | email, plan | Crea checkout Stripe + envia link WA |
| `escalate_to_human` | reason, summary | Escala a operador humano |
| Custom tools | Definidos por tenant | Webhooks, mocks, code |

### LangGraph Pipeline (Alternativo)

Si `USE_LANGGRAPH=true`:

```
START -> [analyze] -> [route] -> {needsSummary?}
                                      |yes         |no
                                 [summarize]       |
                                      |            |
                                 [generate] <------+
                                      |
                                  [persist] -> END
```

5 nodos:
1. **analyze**: Reasoning + sentiment + industry + topic
2. **route**: Decidir fase + needsSummary
3. **summarize**: Actualizar memoria (condicional, cada ~5 turnos)
4. **generate**: Construir prompt + llamar LLM
5. **persist**: Guardar estado en `conversations.state`

---

## 11. Integraciones

### WhatsApp Cloud API
- **Proposito**: Canal principal de mensajeria
- **Features**: Envio/recepcion, templates, listas interactivas, media, read receipts
- **Multi-tenant**: Access tokens encriptados AES-256-GCM por tenant
- **Webhook**: `/api/webhook/whatsapp`

### Cal.com
- **Proposito**: Agendar demos y reuniones
- **Auth**: OAuth 2.0 por tenant
- **Features**: Disponibilidad, crear eventos, confirmaciones
- **Endpoints**: `/api/integrations/calcom/*`

### Stripe + Stripe Connect
- **Proposito**: Pagos y suscripciones
- **Auth**: Stripe Connect (cuenta por tenant)
- **Features**: Checkout sessions, payment links, webhooks
- **Endpoints**: `/api/integrations/stripe/*`, `/api/stripe/*`

### Twilio
- **Proposito**: Provisioning de numeros telefono
- **Features**: Buscar, comprar, verificar numeros para WhatsApp
- **Endpoints**: `/api/twilio/*`

### HubSpot
- **Proposito**: Sync bidireccional de leads
- **Features**: Crear/actualizar contactos, sync historial
- **Funcion**: `syncLeadToHubSpot()`

### Meta Conversions API
- **Proposito**: Optimizacion de ads (reportar conversiones)
- **Features**: Track demos agendadas, leads calificados
- **Cron**: `/api/cron/meta-conversions`
- **Cola**: tabla `conversion_events_queue`

### ElevenLabs
- **Proposito**: Voz en demo del landing
- **Endpoint**: `/api/voice/generate`

### Temporal.io (Opcional)
- **Proposito**: Scheduling distribuido (follow-ups, reminders)
- **Feature flags**: `USE_TEMPORAL_*`
- **Fallback**: Legacy scheduler si no activo

---

## 12. Multi-Tenancy

### Aislamiento de Datos
- Todas las tablas principales tienen `tenant_id` FK
- RLS (Row Level Security) en todas las tablas sensibles
- Routing webhook: `phone_number_id` -> `tenant_id`
- Cada API route extrae tenant de auth o params

### Configuracion por Tenant
- **Agent config**: System prompt, few-shot, catalogo, tono, modelo
- **WhatsApp**: Multiples numeros por tenant
- **Knowledge base**: Documentos scoped por tenant
- **Custom tools**: Herramientas definidas por tenant
- **Integraciones**: Cal.com y Stripe Connect independientes
- **Pipeline stages**: Etapas CRM personalizables

### RLS Policies

| Nivel | Tablas |
|-------|--------|
| Public read | `pricing_tiers` |
| Authenticated (own data) | `tenants`, `whatsapp_accounts`, `agent_configs`, `pipeline_stages`, `broadcasts`, `handoffs`, `twilio_numbers`, `integrations` |
| Service role (full) | Todas las tablas (para backend APIs) |

---

## 13. Auth y Middleware

### Flujo de Signup
1. Usuario llena form en `/login` (modo signup)
2. `POST /api/auth/signup` -> Supabase Auth
3. On success -> `POST /api/auth/setup-tenant` (auto-crear tenant)
4. Redirect a `/dashboard` o onboarding segun status

### Flujo de Login
1. Email + password en `/login`
2. Supabase Auth verifica
3. Check tenant status
4. Redirect a `/dashboard` o onboarding

### Middleware (`middleware.ts`)
```
Rutas publicas: /, /login, /demo, /api/*, /privacy, /terms
Rutas protegidas: /dashboard/*, /broadcasts/*, /partners

Si no hay auth cookie en ruta protegida -> redirect a /login
```

### Session
- JWT en cookie: `sb-<ref>-auth-token`
- Auto-refresh por Supabase client
- Server-side: `createClient()` + `getUser()`

---

## 14. Broadcasts

### Flujo de Creacion (3 pasos)

1. **Config**: Nombre, seleccionar template WA aprobado, mapear variables
2. **CSV Upload**: Drag-and-drop CSV/TXT, detectar telefonos y nombres, preview
3. **Confirmar**: Review + enviar

### Features
- Templates de WhatsApp aprobados por Meta
- Variables dinamicas ({{1}}, {{2}}) con valor fijo o del CSV
- Tracking por recipiente: pending -> sent -> delivered -> read -> failed
- Captura de respuestas (link a conversaciones)
- Stats: total campanas, mensajes enviados, fallidos

---

## 15. Sistema de Handoff

### Triggers
- **Keywords**: "hablar con humano", "frustrad@", "no funciona", etc.
- **Failures repetidos**: 3+ errores del agente en historia reciente
- **Tool call**: Agente puede llamar `escalate_to_human`

### Flujo
1. Detectar trigger (pre-agente o durante generacion)
2. Crear registro en `handoffs` (reason, priority, status)
3. Notificar operador via dashboard (alerta real-time)
4. Enviar mensaje al cliente: "Te comunico con alguien del equipo"
5. Pausar bot en esa conversacion

### Prioridades
- `critical`: Errores repetidos del agente
- `urgent`: Cliente frustrado
- `normal`: Solicitud explicita

---

## 16. Follow-ups y Automatizaciones

### Tipos de Follow-up

| Trigger | Accion | Timing |
|---------|--------|--------|
| Lead dice "luego" | Mensaje de re-engagement | 48-72h |
| Demo agendada | Recordatorio | T-24h y T-1h |
| Conversacion stalled | Re-engagement | Configurable |
| Opt-out | Cancelar todos los follow-ups | Inmediato |

### Implementacion
- **Temporal.io** (si habilitado): Workflows distribuidos, retry, durabilidad
- **Legacy scheduler** (fallback): Cron + base de datos

---

## 17. Variables de Entorno

### Requeridas
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# WhatsApp
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_ACCESS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_BUSINESS=

# Cal.com
CAL_API_KEY=
CAL_EVENT_TYPE_ID=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Encryption
ENCRYPTION_KEY=  # Para AES-256-GCM
```

### Opcionales
```env
HUBSPOT_API_KEY=
META_BUSINESS_ID=
ELEVENLABS_API_KEY=
```

### Feature Flags
```env
USE_LANGGRAPH=true|false
USE_TEMPORAL_FOLLOWUPS=true|false
USE_TEMPORAL_BOOKING=true|false
USE_TEMPORAL_PAYMENTS=true|false
CAL_MOCK_MODE=true|false
```

---

## 18. Estado Actual

### Commits Recientes
```
f5c9051 fix: update Espacio Cripto agent voice to match newsletter tone
1cb8e8a feat: add tenant payment links + configure Espacio Cripto agent
43963f0 fix: await async getFewShotContext in graph prompts
48458f4 fix: apply time gap awareness to LangGraph pipeline
1ea1c21 fix: schedule list nudge loop + time gap awareness for agent
```

### Cambios Pendientes (no commiteados)

**Modificados:**
- `app/demo/page.tsx` - Updates demo page
- `app/login/page.tsx` - UI login improvements
- `components/dashboard/DashboardShell.tsx` - Dashboard layout
- `components/dashboard/TwilioNumberProvisioning.tsx` - Phone provisioning UI
- `components/loomi/Footer.tsx` - Footer updates
- `components/partners/PartnersView.tsx` - Partners view

**Eliminados:**
- `app/dashboard/agent/tools/ToolsView.tsx` - Movido a IntegrationsView

**Nuevos (untracked):**
- `app/api/integrations/calcom/disconnect/` - Endpoint desconectar Cal.com
- `app/api/integrations/stripe/disconnect/` - Endpoint desconectar Stripe
- `lib/agents/conversation-state.ts` - Modulo estado conversacion
- `supabase/migrations/20260209200000_add_conversation_state.sql` - Migracion estado

### En Progreso
1. Endpoints de desconexion de integraciones (Cal.com + Stripe)
2. Refactor de conversation state a modulo dedicado
3. Mejoras UI del dashboard shell, footer y partners
4. Mejoras en provisioning de numeros Twilio

---

## Resumen Final

| Metrica | Valor |
|---------|-------|
| **Endpoints API** | 54 |
| **Tablas DB** | 18+ |
| **Componentes** | 50+ |
| **Modulos lib** | 20+ |
| **Integraciones** | 8 (WhatsApp, Cal.com, Stripe, Twilio, HubSpot, Meta CAPI, ElevenLabs, Temporal) |
| **Fases de venta** | 11 |
| **Modelos IA** | 3 (Claude 3.5 Sonnet, Claude Haiku 4.5, GPT-4o-mini) |
| **Idioma UI** | Espanol |

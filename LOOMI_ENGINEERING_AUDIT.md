# Loomi.lat — Auditoría de Ingeniería Completa

> Fecha: 13 de Febrero, 2026
> Alcance: Codebase completo — backend, frontend, infra, IA, integraciones
> Método: Análisis estático de código (100% de archivos leídos)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Sistema de Agentes de IA](#3-sistema-de-agentes-de-ia)
4. [API Routes — Análisis de Seguridad](#4-api-routes--análisis-de-seguridad)
5. [Frontend y UI](#5-frontend-y-ui)
6. [Base de Datos e Infraestructura](#6-base-de-datos-e-infraestructura)
7. [Integraciones Externas](#7-integraciones-externas)
8. [Deficiencias Críticas](#8-deficiencias-críticas)
9. [Oportunidades de Mejora](#9-oportunidades-de-mejora)
10. [Scorecard Final](#10-scorecard-final)

---

## 1. Resumen Ejecutivo

Loomi.lat es una plataforma SaaS multi-tenant que conecta agentes de IA con WhatsApp para automatizar ventas, calificar leads y agendar demos. El stack es Next.js 14 (App Router) + Supabase + OpenAI/Anthropic + Stripe + WhatsApp Cloud API.

### Fortalezas Principales
- Arquitectura multi-tenant bien implementada en rutas autenticadas
- Sistema de agentes IA sofisticado con LangGraph, memory, embeddings y conversation state
- Buen uso de patrones async (Promise.all, waitUntil, start-early-await-late)
- Sistema de handoff a humano con detección de triggers y fallos repetidos
- OAuth flows seguros (Cal.com con state cifrado + TTL, Stripe Connect)
- Webhook de Stripe con verificación de firma correcta

### Debilidades Principales
- Rate limiting en memoria (se pierde en cada deploy)
- Sin verificación de firma en webhook de WhatsApp
- Endpoints sandbox públicos permiten contaminación de datos de tenants
- Sin Error Boundaries en frontend
- Sin audit logging centralizado
- Webhook de WhatsApp demasiado largo (~1200 líneas) — alta complejidad ciclomática

### Números Clave
| Métrica | Valor |
|---------|-------|
| API Routes | ~51 endpoints |
| Modelos IA usados | GPT-5.2, GPT-4o, GPT-4o-mini, Claude Haiku 4.5, text-embedding-3-small |
| Integraciones externas | 8 (WhatsApp, Stripe, Cal.com, Twilio, HubSpot, ElevenLabs, OpenAI, Anthropic) |
| Tablas en DB | ~15+ (tenants, leads, conversations, messages, appointments, etc.) |
| Componentes UI | ~30+ (shadcn/ui base + custom) |

---

## 2. Arquitectura General

### 2.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 14 (App Router) + React + Tailwind CSS     │
│  shadcn/ui + Framer Motion + Inter font             │
├─────────────────────────────────────────────────────┤
│                  API LAYER                           │
│  Next.js Route Handlers (~51 endpoints)              │
│  Middleware: Auth guard (Supabase session cookies)   │
├─────────────────────────────────────────────────────┤
│                 AI ENGINE                            │
│  LangGraph (graph-based) + Legacy simple-agent       │
│  GPT-5.2 (prod) / GPT-4o-mini (demo/análisis)      │
│  Claude Haiku 4.5 (conversation state)              │
│  text-embedding-3-small (knowledge retrieval)       │
├─────────────────────────────────────────────────────┤
│               INTEGRATIONS                           │
│  WhatsApp Cloud API │ Stripe │ Cal.com │ Twilio     │
│  HubSpot │ ElevenLabs │ Resend │ Meta CAPI          │
├─────────────────────────────────────────────────────┤
│              DATA LAYER                              │
│  Supabase (PostgreSQL) + Supabase Auth              │
│  Supabase Realtime (dashboard live updates)         │
└─────────────────────────────────────────────────────┘
```

### 2.2 Estructura de Directorios

```
app/
├── api/                    # ~51 route handlers
│   ├── auth/               # signup, confirm, setup-tenant
│   ├── broadcasts/         # campaigns CRUD + send
│   ├── contact/            # contact form (Resend)
│   ├── cron/followups/     # scheduled follow-ups
│   ├── demo/               # chat, book, slots (public)
│   ├── integrations/       # Cal.com, Stripe OAuth flows
│   ├── leads/              # CRUD + classify (AI)
│   ├── onboarding/         # chat + complete
│   ├── sandbox/            # tenants, chat, tools, documents
│   ├── stripe/             # checkout + webhook
│   ├── twilio/             # numbers search/purchase, SMS webhook
│   ├── voice/generate/     # ElevenLabs TTS
│   ├── webhook/whatsapp/   # WhatsApp inbound (1200+ líneas)
│   └── whatsapp/connect/   # WhatsApp Business connection
├── broadcasts/             # Campaign management UI
├── dashboard/              # Protected dashboard
│   ├── agent/              # prompt, knowledge config
│   ├── connect/            # WhatsApp/integrations
│   ├── conversations/      # Chat history
│   ├── crm/                # Kanban pipeline
│   └── settings/           # Account settings
├── demo/                   # Public sandbox demo
├── login/                  # Auth flow
└── page.tsx                # Landing page

lib/
├── agents/                 # AI agent system
│   ├── simple-agent.ts     # Legacy agent (OpenAI function calling)
│   ├── demo-agent.ts       # Lightweight demo agent
│   ├── conversation-state.ts # Haiku-based state tracking
│   ├── few-shot.ts         # Few-shot examples
│   └── reasoning.ts        # Analysis with o3-mini
├── graph/                  # LangGraph implementation
│   ├── graph.ts            # Main graph definition
│   ├── nodes.ts            # Processing nodes
│   ├── state.ts            # Graph state schema
│   ├── prompts.ts          # System prompts
│   └── memory.ts           # Memory management
├── handoff/                # Human handoff system
├── memory/                 # Conversation context + Supabase ops
│   ├── context.ts          # Context builder
│   ├── supabase.ts         # DB operations
│   └── embeddings.ts       # Embedding + cosine similarity
├── tenant/                 # Multi-tenancy
├── whatsapp/               # WhatsApp API helpers
├── integrations/           # Cal.com, Stripe, HubSpot
├── twilio/                 # Twilio number management
└── scheduling/             # Appointment slots

components/
├── ui/                     # shadcn/ui (button, input, card, etc.)
├── dashboard/              # Dashboard-specific components
└── loomi/                  # Landing page components
```

### 2.3 Flujo de Datos Principal

```
Usuario WhatsApp
      │
      ▼
Meta Cloud API ──webhook──▶ /api/webhook/whatsapp
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
              Deterministic   LangGraph      Handoff
              Flow            Agent          System
              (slots,         (GPT-5.2)      (humano)
              buttons,        │
              emails)         ├── Analyze (fast path)
                              ├── Generate response
                              ├── Tool execution
                              ├── Memory update
                              └── Conversation state
                                  │
                                  ▼
                            sendWhatsAppMessage()
                                  │
                                  ▼
                            Save to Supabase
                            + HubSpot sync
                            + Follow-up scheduling
```

---

## 3. Sistema de Agentes de IA

### 3.1 Arquitectura de Agentes

Loomi tiene **3 niveles de agente**:

| Agente | Modelo | Uso | Latencia |
|--------|--------|-----|----------|
| Demo Agent | GPT-4o-mini | Landing page demo | ~1s |
| Simple Agent (legacy) | GPT-4o | Sandbox, fallback | ~2-4s |
| LangGraph Agent | GPT-5.2 + análisis multi-modelo | Producción WhatsApp | ~3-6s |

### 3.2 LangGraph Pipeline

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Analyze  │───▶│ Generate │───▶│ Post-proc │───▶│ Memory   │
│ (fast    │    │ Response │    │ (extract  │    │ Update   │
│  path)   │    │ (GPT-5.2)│    │  actions) │    │ (Haiku)  │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
     │                │
     │ Simple msg?    │ Tools available:
     │ Skip analyze   │ - schedule_demo
     ▼                │ - send_payment_link
  Direct to           │ - check_availability
  Generate            │ - search_knowledge
                      │ - escalate_to_human
```

**Fast Path**: Mensajes simples (saludos, "ok", "gracias") saltan el nodo de análisis para reducir latencia ~40%.

### 3.3 Knowledge Retrieval (RAG)

- Embeddings: `text-embedding-3-small` con cache LRU de 15 min
- Similitud: Cosine similarity manual (no vector DB)
- Threshold: 0.7 para considerar relevante
- Máximo: Top 3 documentos por query
- **Limitación**: Sin vector database — la búsqueda es O(n) sobre todos los documentos del tenant

### 3.4 Conversation State

- Modelo: Claude Haiku 4.5 (barato y rápido)
- Frecuencia: Cada 5 mensajes del usuario
- Persiste: JSON estructurado en `conversations.state`
- Tracking: fase actual, temas cubiertos, objeciones, interés, siguiente acción
- **Bien diseñado**: Preserva estado anterior, no sobrescribe sin razón

### 3.5 Memory System

- Generación de memoria resumida tras conversaciones largas
- Usa `shouldGenerateMemory()` para decidir cuándo (basado en duración + # mensajes)
- Se inyecta al prompt del agente como contexto
- **Deficiencia**: No hay TTL ni garbage collection de memorias antiguas

### 3.6 Handoff a Humano

Sistema sofisticado de escalamiento:

1. **Detección de triggers**: Regex + análisis de contexto (no solo keywords)
2. **Fallos repetidos**: Detecta cuando el bot falla 3+ veces consecutivas
3. **Prioridades**: critical, high, medium
4. **Acciones**: Pausa el bot, notifica al equipo, envía mensaje al usuario
5. **Prevención de falsos positivos**: Analiza historial de conversación para contexto

### 3.7 Deficiencias del Sistema IA

| Problema | Severidad | Impacto |
|----------|-----------|---------|
| Sin timeout en llamadas a OpenAI | Alta | Request puede colgar indefinidamente |
| Sin control de gasto/budget | Alta | Un bug o abuso podría generar costos masivos |
| Sin fallback si OpenAI cae | Alta | Agente no responde, usuario sin respuesta |
| Knowledge retrieval O(n) | Media | Lento con muchos documentos |
| Conversation state cada 5 msgs | Baja | Estado puede estar desactualizado |
| Sin prompt injection protection | Media | Usuario podría manipular al agente |

---

## 4. API Routes — Análisis de Seguridad

### 4.1 Resumen por Categoría

#### Autenticación

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/auth/signup` | None (public) | No | Email regex, password min 6 |
| `/api/auth/confirm-signup` | Token | No | Token required |
| `/api/auth/setup-tenant` | Session | No | Business name required |

#### WhatsApp

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/webhook/whatsapp` | Verify token | No | Message parsing |
| `/api/whatsapp/connect` | Session | No | Code format |
| `/api/conversations/[id]/reply` | Session | No | Message content |

#### CRM/Leads

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/leads` | Session | No | Name, phone required |
| `/api/leads/[id]` | Session | No | Tenant check |
| `/api/leads/classify` | Session | No (150ms delay) | Tenant check |

#### Pagos

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/stripe/checkout` | None | No | Email, plan whitelist |
| `/api/stripe/webhook` | Stripe signature | N/A | Signature verified |

#### Demo/Sandbox (Public)

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/demo/chat` | None | 15 msg/min (memory) | Max 500 chars |
| `/api/demo/book` | None | 3/hour (memory) | Email, date |
| `/api/sandbox/chat` | None | 10 msg/min (memory) | Max 1000 chars |
| `/api/sandbox/documents` | None | No | 50KB max, tenantId |
| `/api/sandbox/tools` | None | No | Snake_case name |

#### Cron

| Endpoint | Auth | Rate Limit | Input Validation |
|----------|------|-----------|-----------------|
| `/api/cron/followups` | CRON_SECRET header | No | N/A |

### 4.2 Problemas Críticos de Seguridad

#### CRITICO: Webhook WhatsApp sin verificación de firma
```
Archivo: app/api/webhook/whatsapp/route.ts
```
El webhook de WhatsApp solo verifica el `verify_token` en GET (subscription), pero **no valida la firma X-Hub-Signature-256 en POST**. Cualquier actor podría enviar mensajes falsos al webhook y triggerear respuestas del agente, crear leads falsos, o abusar del sistema.

**Remediación**: Implementar `crypto.timingSafeEqual()` con `X-Hub-Signature-256` header y `WHATSAPP_APP_SECRET`.

#### CRITICO: Rate limiting en memoria
Todos los rate limiters usan `new Map()` in-memory:
```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
```
Se pierden en cada deploy/restart. En Vercel (serverless), cada invocación puede ser una instancia diferente, haciendo el rate limit **completamente inefectivo**.

**Remediación**: Migrar a Redis (Upstash) o Vercel KV.

#### CRITICO: Cron job sin verificación real
```
Archivo: app/api/cron/followups/route.ts
```
Solo verifica la presencia del header `x-vercel-cron`, que es público y documentado. Cualquiera puede spoofear este header.

**Remediación**: Validar con `CRON_SECRET` obligatorio, eliminar fallback a `x-vercel-cron` sin verificación adicional.

#### ALTO: Sandbox permite contaminar datos de cualquier tenant
```
Archivos: app/api/sandbox/documents/route.ts, app/api/sandbox/tools/route.ts
```
Los endpoints de sandbox aceptan `tenantId` del cliente sin verificar ownership. Un atacante podría inyectar documentos maliciosos o herramientas a cualquier tenant.

**Remediación**: Agregar token de validación o restringir sandbox a tenants de demo.

#### ALTO: Webhook WhatsApp es un God Object (~1200 líneas)
El archivo del webhook procesa:
- Verificación de token
- Parsing de mensajes (text, interactive, button, list)
- Auto-responder detection
- Bot pause check
- Opt-out handling
- Slot selection (citas)
- Button replies
- Email extraction
- Plan selection
- Payment link generation
- LLM flow completo
- Follow-up scheduling
- HubSpot sync
- Memory generation

**Impacto**: Extremadamente difícil de testear, debuggear y mantener. Un cambio en cualquier parte puede romper todo.

**Remediación**: Extraer a handlers modulares — un handler por cada flow determinístico + un handler para el LLM flow.

### 4.3 Scorecard de Seguridad API

| Categoría | Score | Estado |
|-----------|-------|--------|
| Autenticación | 8/10 | Bien en rutas protegidas |
| Autorización | 7/10 | Gaps en sandbox |
| Validación de Input | 6/10 | Inconsistente entre rutas |
| Rate Limiting | 3/10 | In-memory = inefectivo en serverless |
| Protección de Datos | 7/10 | Credentials cifrados |
| Seguridad de API | 5/10 | Sin firma WhatsApp |
| Logging/Auditoría | 3/10 | Sin audit log centralizado |
| Manejo de Errores | 6/10 | Info disclosure en algunos casos |
| **OVERALL** | **5.6/10** | **Necesita mejoras** |

---

## 5. Frontend y UI

### 5.1 Arquitectura de Componentes

```
app/layout.tsx (Server)
├── ThemeProvider
├── SpeedInsights (Vercel)
├── ChatBubble (floating FAB)
└── {children}
    ├── page.tsx (Landing — Server wrapping Client sections)
    │   ├── Hero, Features, HowItWorks, Pricing, etc.
    │   └── InteractiveDemo (Client — chat widget)
    ├── login/page.tsx (Client — auth form)
    ├── demo/page.tsx (Client — sandbox)
    ├── dashboard/layout.tsx (Server — auth guard)
    │   └── DashboardLayoutClient.tsx (Client — sidebar + shell)
    │       ├── Sidebar (collapsible, 3 sections)
    │       └── {children} (dashboard pages)
    └── broadcasts/layout.tsx (Server — auth guard)
        └── BroadcastsView.tsx (Client — campaign manager)
```

**Patrón Server/Client**: Layouts son Server Components que hacen auth + data fetching, luego pasan props a Client Components para interactividad.

### 5.2 Sistema de Diseño

| Aspecto | Implementación |
|---------|---------------|
| Tema | Dark default + Light mode via `data-theme` attribute |
| Tokens | CSS Variables (`:root` + `[data-theme="light"]`) |
| Tipografía | Inter (body) + JetBrains Mono (terminal/brand) |
| Componentes base | shadcn/ui (Button, Input, Card, Dialog, etc.) |
| Animaciones | Framer Motion (scroll triggers, hover, modals, transitions) |
| Iconos | Lucide React |
| Responsive | Mobile-first con breakpoints md/lg/xl |

**Colores clave**:
```
Dark:  bg #0C0C0C, fg #FAFAFA, surface #161616, border #2A2A2A, muted #8A8A8A
Light: bg #FFFFFF, fg #1C1C1C, surface #FAFAFA, border #E5E5E5, muted #71717A
Fixed: terminal-red #FF5F56, terminal-yellow #FFBD2E, terminal-green #27C93F
```

### 5.3 Estado

| Tipo | Herramienta | Uso |
|------|-------------|-----|
| Local | `useState` | Formularios, loading, toggles, errores |
| Persistido | `localStorage` | Theme, sidebar collapsed |
| Sesión | `sessionStorage` | Sandbox demo access, chat history |
| Realtime | Supabase Realtime | Dashboard stats (INSERT/UPDATE listeners) |
| **Global** | **Ninguno** | No hay Redux/Zustand/Context |

**Observación**: La ausencia de estado global funciona para el scope actual, pero limitará la escala si se agregan features que requieran datos compartidos entre componentes distantes.

### 5.4 Rendimiento Frontend

| Aspecto | Estado | Nota |
|---------|--------|------|
| Code-splitting | No implementado | Todo bundleado upfront |
| Dynamic imports | No usados | Oportunidad: sandbox panels, chat |
| Suspense boundaries | Minimal (solo login) | Falta en dashboard, broadcasts |
| React.memo | No usado | Re-renders innecesarios posibles |
| Image optimization | next/image usado | Bien implementado |
| SpeedInsights | Integrado (Vercel) | Monitoreo activo |
| Bundle size | No analizado | Framer Motion añade ~30KB gzipped |

### 5.5 Accesibilidad

| Criterio | Estado |
|----------|--------|
| HTML semántico | Parcial (main, nav, header usados) |
| ARIA labels | Casi ausentes |
| Focus management | Basic (focus:ring en inputs) |
| Keyboard navigation | Enter/Escape en chat/modals |
| Color contrast | Terminal colors pueden fallar WCAG AA |
| Screen readers | Sin skip-to-content, sin aria-live |
| Error Boundaries | **No implementados** |

### 5.6 Deficiencias Frontend

1. **Sin Error Boundaries**: Un error de runtime crashea toda la sección
2. **Sin code-splitting**: Bundle más grande de lo necesario
3. **Sin global state**: Props drilling a escala será problemático
4. **ARIA insuficiente**: No cumple WCAG AA
5. **Animaciones pesadas en landing**: Framer Motion + muchas secciones
6. **Forms sin validación server-side antes de submit**: Solo client-side

---

## 6. Base de Datos e Infraestructura

### 6.1 Tablas Principales

| Tabla | Propósito | Relaciones |
|-------|-----------|------------|
| `tenants` | Empresas/usuarios | → agent_configs, leads, campaigns |
| `agent_configs` | Config del agente por tenant | system_prompt, tone, few_shot |
| `leads` | Contactos/prospectos | → conversations, appointments |
| `conversations` | Sesiones de chat | → messages, state JSON |
| `messages` | Mensajes individuales | role, content, timestamps |
| `appointments` | Citas agendadas | lead_id, scheduled_at, cal_event_id |
| `tenant_documents` | Knowledge base | content, embeddings |
| `tenant_tools` | Herramientas custom | name, type, webhook_url |
| `broadcast_campaigns` | Campañas masivas | → broadcast_recipients |
| `broadcast_recipients` | Destinatarios | phone, name, status |
| `follow_ups` | Follow-ups programados | lead_id, type, scheduled_for |
| `tenant_integrations` | Credenciales OAuth | encrypted credentials |
| `twilio_numbers` | Números Twilio | tenant_id, phone_number |
| `handoffs` | Escalamientos a humano | reason, priority, status |

### 6.2 Supabase Client Patterns

| Tipo | Uso | Seguridad |
|------|-----|-----------|
| `createClient()` (server) | Rutas autenticadas | Session cookies, RLS |
| `createAdminClient()` | Operaciones privilegiadas | Service role key, bypassa RLS |
| `getSupabase()` (lib/memory) | Operaciones de agente | Service role (necesario para webhook) |

**Preocupación**: `createAdminClient()` inicializado a nivel de módulo en algunos archivos:
```typescript
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
```
Esto puede causar problemas en serverless (cold starts) y expondrá credentials en stack traces.

### 6.3 Migraciones

Las migraciones en `supabase/migrations/` cubren:
- Creación de tablas base
- Campos de conversation state (JSONB)
- Índices básicos en tenant_id

**Deficiencias en migraciones**:
- Sin índices compuestos optimizados (e.g., `leads(tenant_id, created_at)`)
- Sin políticas RLS explícitas en migraciones (depende de Supabase dashboard)
- Sin constraints de validación (e.g., CHECK on stages, phone format)
- Sin soft delete (hard delete en leads cascadea todo)

### 6.4 Queries Problemáticos

```typescript
// Sin paginación — puede devolver miles de registros
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false });

// Sin timeout — puede bloquear
const { data } = await supabase
  .from('broadcast_campaigns')
  .select('*')
  .eq('tenant_id', tenantId);
```

### 6.5 Configuración Next.js

- **Middleware**: Auth guard con verificación de sesión Supabase
- **TypeScript**: Configuración estándar (no strict null checks verificado)
- **Tailwind**: Custom tokens via CSS variables, sizes custom (text-label, text-body)
- **Vercel**: SpeedInsights integrado, cron jobs vía `vercel.json`

---

## 7. Integraciones Externas

### 7.1 WhatsApp Cloud API

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| Webhook GET (verify) | Token matching | OK |
| Webhook POST (messages) | Parse + process | Sin firma |
| Send messages | Text, interactive, list, template | OK |
| Credentials | Cifrados en tenant_integrations | OK |
| Multi-tenant routing | Por phoneNumberId | OK |
| Read receipts | mark_read al recibir | OK |

**Complejidad del webhook**: 1200+ líneas con flujos determinísticos entrelazados con LLM. Es el archivo más crítico y más frágil del sistema.

### 7.2 Stripe

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| Checkout sessions | Plan-based pricing | OK |
| Webhook | Firma verificada con constructEvent() | Excelente |
| Subscription management | Created, updated, deleted events | OK |
| Payment failure | Notificación WhatsApp al tenant | OK |
| Stripe Connect | OAuth flow para cobros del tenant | OK |

**Riesgo**: Checkout endpoint sin auth — cualquiera puede crear sessions (Stripe limita el daño, pero es un vector de abuso).

### 7.3 Cal.com

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| OAuth flow | State cifrado con TTL 10 min | Excelente |
| Token storage | Cifrado en tenant_integrations | OK |
| Slot availability | getAvailableTimeSlots() | OK |
| Booking | Per-tenant credentials | OK |
| Token refresh | No implementado | Riesgo |

### 7.4 Twilio

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| Number search | MX/US, area code filter | OK |
| Number purchase | Real + mock mode | OK |
| SMS webhook | Verification code extraction | OK |
| Verification | 6-digit code capture | OK |

**Riesgo**: Subscription check deshabilitado (TODO en código) — cualquier usuario puede comprar números sin suscripción activa.

### 7.5 HubSpot

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| Lead sync | Post-conversation | OK |
| Data mapped | Phone, name, email, stage, messages | OK |
| Error handling | Minimal (catch + log) | Débil |
| Circuit breaker | No implementado | Riesgo |

### 7.6 ElevenLabs

| Aspecto | Implementación | Estado |
|---------|---------------|--------|
| Text-to-speech | POST /api/voice/generate | OK |
| Rate limit | 10/min per IP (memory) | Débil |
| Cache | 24h audio cache | OK |
| Cost control | 500 char limit | Parcial |

### 7.7 Resumen de Riesgos por Integración

```
                    Seguridad   Resiliencia   Cost Control
WhatsApp            ■■□□□       ■■■□□         ■■■■□
Stripe              ■■■■■       ■■■■□         ■■■■■
Cal.com             ■■■■□       ■■■□□         ■■■■□
Twilio              ■■■□□       ■■■□□         ■■□□□
HubSpot             ■■■□□       ■□□□□         ■■■■□
ElevenLabs          ■■□□□       ■■□□□         ■■□□□
OpenAI/Anthropic    ■■■■□       ■□□□□         ■□□□□
```

---

## 8. Deficiencias Críticas

### P0 — Arreglar esta semana

#### 8.1 Webhook WhatsApp sin firma
**Impacto**: Inyección de mensajes falsos, creación de leads spam, abuso del agente IA
**Esfuerzo**: ~50 líneas
**Solución**: Implementar validación `X-Hub-Signature-256` con `crypto.timingSafeEqual()`

#### 8.2 Rate limiting inefectivo
**Impacto**: DDoS en endpoints demo, abuso de API de IA (costos), spam
**Esfuerzo**: ~2 horas con Upstash Redis
**Solución**: Reemplazar `Map<>` con Redis sliding window

#### 8.3 Cron sin auth real
**Impacto**: Ejecución no autorizada de follow-ups, spam a usuarios
**Esfuerzo**: ~20 líneas
**Solución**: Validar CRON_SECRET obligatorio, quitar fallback a header público

### P1 — Arreglar este mes

#### 8.4 Webhook WhatsApp como God Object
**Impacto**: Mantenibilidad, bugs, dificultad para testear
**Esfuerzo**: ~1-2 días de refactor
**Solución**: Extraer handlers por flow en archivos separados

#### 8.5 Sin Error Boundaries en frontend
**Impacto**: Crash de UI completa por error en un componente
**Esfuerzo**: ~2 horas
**Solución**: Agregar ErrorBoundary en dashboard, chat, y forms

#### 8.6 Sandbox contamina datos de tenants
**Impacto**: Inyección de documentos/tools maliciosos a cualquier tenant
**Esfuerzo**: ~1 hora
**Solución**: Validar tenant ownership o restringir a demo tenants

#### 8.7 Sin timeout en llamadas a OpenAI
**Impacto**: Requests colgados, degradación de servicio
**Esfuerzo**: ~30 minutos
**Solución**: `AbortController` con timeout de 30s en todas las llamadas AI

#### 8.8 Sin audit logging
**Impacto**: Imposible investigar incidentes, no cumple SOC2
**Esfuerzo**: ~1 día
**Solución**: Logger estructurado (JSON) + tabla de audit events

### P2 — Arreglar este trimestre

#### 8.9 Sin code-splitting
**Impacto**: Bundle grande, carga lenta en mobile
**Solución**: `next/dynamic` para componentes pesados (sandbox, chat, Framer Motion)

#### 8.10 Knowledge retrieval O(n)
**Impacto**: Lento con muchos documentos por tenant
**Solución**: Migrar a pgvector (Supabase soporta nativo) o Pinecone

#### 8.11 Sin paginación en queries
**Impacto**: DB overload con tenants grandes
**Solución**: Cursor-based pagination en leads, conversations, broadcasts

#### 8.12 Hard delete sin soft delete
**Impacto**: Pérdida irrecuperable de datos
**Solución**: Agregar `deleted_at` timestamp, filtrar en queries

---

## 9. Oportunidades de Mejora

### 9.1 Arquitectura

| Oportunidad | Impacto | Esfuerzo |
|-------------|---------|----------|
| Extraer webhook a microservice | Alta resiliencia, escalabilidad independiente | Alto |
| Queue system (BullMQ/Inngest) para broadcasts | Envíos confiables con retry | Medio |
| pgvector para knowledge retrieval | 100x más rápido con muchos docs | Medio |
| API versioning (v1/) | Compatibilidad a futuro | Bajo |
| OpenAPI/Swagger spec | Documentación auto-generada | Medio |

### 9.2 IA/Agentes

| Oportunidad | Impacto | Esfuerzo |
|-------------|---------|----------|
| Streaming responses | UX percibida mucho mejor | Medio |
| Fallback chain (GPT-5.2 → GPT-4o → cached response) | Zero downtime | Medio |
| Budget tracking por tenant | Control de costos per-customer | Bajo |
| A/B testing de prompts | Optimización de conversión | Medio |
| Prompt injection detection | Seguridad del agente | Bajo |
| Evaluate/benchmark framework | Medir calidad de respuestas | Alto |

### 9.3 Frontend

| Oportunidad | Impacto | Esfuerzo |
|-------------|---------|----------|
| Error boundaries | Resiliencia de UI | Bajo |
| Zustand para estado global | Scalability del state | Bajo |
| Skeleton loading states | UX percibida | Bajo |
| i18n (next-intl) | Expansión a EN, PT | Medio |
| PWA (service worker) | Mobile experience | Medio |
| React Query/SWR | Cache + dedup de requests | Medio |

### 9.4 Infraestructura

| Oportunidad | Impacto | Esfuerzo |
|-------------|---------|----------|
| Redis (Upstash) | Rate limiting real, caching | Bajo |
| Sentry integration | Error monitoring | Bajo |
| Structured logging (Axiom/Logtail) | Observabilidad | Bajo |
| CI/CD tests | Prevención de regresiones | Medio |
| Load testing (k6) | Validar capacidad | Medio |
| Database connection pooling | Perf bajo carga | Bajo |

### 9.5 Negocio/Producto

| Oportunidad | Impacto | Esfuerzo |
|-------------|---------|----------|
| Analytics dashboard (conversiones, retention) | Valor para clientes | Alto |
| Multi-channel (Instagram DM, Telegram) | Más canales = más valor | Alto |
| White-label para partners | Revenue por partners | Alto |
| Webhook outbound para clientes | Extensibilidad | Medio |
| API pública para clientes | Integraciones propias | Alto |

---

## 10. Scorecard Final

### Por Área

| Área | Score | Nota |
|------|-------|------|
| **Arquitectura General** | 7/10 | Sólida para el stage, pero el webhook es un monolito |
| **Sistema IA** | 8/10 | Sofisticado y bien pensado (LangGraph, memory, handoff) |
| **Seguridad API** | 5/10 | Gaps críticos (webhook firma, rate limit, sandbox) |
| **Frontend** | 7/10 | Buen design system, falta error handling y a11y |
| **Base de Datos** | 6/10 | Funcional pero sin optimización (índices, paginación, RLS) |
| **Integraciones** | 7/10 | Muchas y bien conectadas, falta resiliencia |
| **Testing** | 2/10 | Sin tests automatizados visibles |
| **Observabilidad** | 3/10 | Console.log, sin monitoring/alerting |
| **Documentación** | 6/10 | CLAUDE.md bueno, falta API docs |
| **DevOps/CI** | 4/10 | Sin CI pipeline, sin linting enforced |

### Score Ponderado

```
Arquitectura     7/10 × 15% = 1.05
Sistema IA       8/10 × 20% = 1.60
Seguridad API    5/10 × 20% = 1.00
Frontend         7/10 × 10% = 0.70
Base de Datos    6/10 × 10% = 0.60
Integraciones    7/10 × 10% = 0.70
Testing          2/10 × 5%  = 0.10
Observabilidad   3/10 × 5%  = 0.15
Documentación    6/10 × 3%  = 0.18
DevOps           4/10 × 2%  = 0.08
─────────────────────────────
TOTAL                        = 6.16 / 10
```

### Veredicto

**6.2/10 — MVP sólido con deuda técnica manejable**

El sistema de IA es el punto más fuerte — LangGraph, memory, conversation state, y handoff son sofisticados y bien implementados. La arquitectura general es coherente para el stage de la empresa.

Las deficiencias principales están en seguridad (firma de webhook, rate limiting) y operaciones (testing, monitoring). Estas son normales para un early-stage SaaS pero deben abordarse antes de escalar.

### Prioridad de Acción

```
Semana 1:  Firma webhook WhatsApp + Redis rate limiting + Cron auth
Semana 2:  Error boundaries + Sandbox auth + AI timeouts
Semana 3:  Refactor webhook WhatsApp (modularizar)
Semana 4:  Audit logging + Sentry + structured logging
Mes 2:     Tests + CI/CD + pgvector + paginación
Mes 3:     Code-splitting + a11y + API docs + load testing
```

---

> Generado por análisis automatizado de código.
> Todos los archivos del proyecto fueron leídos y analizados.

# LOOMI.LAT - Backend Review Document

> Documento generado para revisión del backend. Última actualización: Febrero 2025

---

## Resumen Ejecutivo

Loomi.lat es una plataforma **multi-tenant de agentes de IA para WhatsApp** que automatiza ventas, califica leads y agenda demos 24/7. El backend está construido con **Next.js 14 (App Router)** + **Supabase** + **OpenAI GPT-4o**.

### Stack Principal
- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL + RLS)
- **IA**: OpenAI GPT-4o (agente principal) / GPT-4o-mini (análisis)
- **Cache/Estado**: Upstash Redis
- **Pagos**: Stripe (subscriptions)
- **Mensajería**: WhatsApp Cloud API
- **CRM Sync**: HubSpot (opcional)
- **Analytics**: Meta Conversions API

---

## 1. API Routes (`/app/api/`)

### Chat & Conversaciones

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/demo/chat` | POST | Demo ligera para landing (gpt-4o-mini, 15 msg/min) |
| `/api/sandbox/chat` | POST | Sandbox completo con custom prompts, tools y docs |

### WhatsApp

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/webhook/whatsapp` | GET | Verificación de webhook |
| `/api/webhook/whatsapp` | POST | Procesamiento de mensajes entrantes |

**Flujo del webhook POST:**
1. Parse mensaje → extraer phone, text, interactive data
2. Detección de duplicados (Redis `isProcessing`)
3. Multi-tenant routing: `phone_number_id` → tenant → credentials
4. Rate limiting: 20 msg/min, 100 msg/hora, 1000 msg/min global
5. **Flujo determinístico** (antes del LLM):
   - Selección de slot → almacenar `pendingSlot`
   - Extracción de email → crear evento Cal.com
   - Selección de plan → almacenar `pendingPlan`
6. **Flujo IA**: handoff detection, multi-agent analysis, response

### Leads & CRM

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/leads` | GET/POST | CRUD de leads (filtrado por tenant) |
| `/api/leads/[id]` | GET/PUT/DELETE | Operaciones individuales |

### Pagos (Stripe)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/stripe/checkout` | POST | Crear checkout session |
| `/api/stripe/webhook` | POST | Eventos de Stripe (signature verified) |

**Eventos manejados:**
- `checkout.session.completed` → Activar cuenta
- `customer.subscription.created/updated` → Update plan
- `customer.subscription.deleted` → Cancelar
- `invoice.payment_failed/succeeded` → Sync status

### Otros

| Ruta | Descripción |
|------|-------------|
| `/api/sandbox/tools` | CRUD herramientas custom |
| `/api/sandbox/documents` | CRUD knowledge docs |
| `/api/sandbox/tenants` | Lista tenants demo |
| `/api/contact` | Formulario de contacto |
| `/api/whatsapp/connect` | Embedded Signup |
| `/api/voice/generate` | Notas de voz (ElevenLabs) |
| `/api/demo/slots` | Slots disponibles (Cal.com) |
| `/api/demo/book` | Agendar demo |
| `/api/cron/followups` | Follow-ups programados |

---

## 2. Base de Datos (Supabase)

### Tablas Core

```sql
-- Leads/Contactos
leads (
  id UUID PK,
  phone TEXT INDEXED,
  name, email, company, industry TEXT,
  stage TEXT,  -- 'new', 'qualified', 'demo_scheduled'
  tenant_id UUID FK,
  is_test BOOLEAN,
  created_at, last_interaction TIMESTAMPZ
)

-- Conversaciones
conversations (
  id UUID PK,
  lead_id UUID FK,
  tenant_id UUID FK,
  started_at, ended_at TIMESTAMPZ
)

-- Mensajes
messages (
  id UUID PK,
  conversation_id UUID FK,
  lead_id, tenant_id UUID FK,
  role TEXT,  -- 'user' | 'assistant'
  content TEXT,
  created_at TIMESTAMPZ
)

-- Citas
appointments (
  id UUID PK,
  lead_id UUID FK,
  scheduled_at TIMESTAMPZ,
  event_id TEXT,  -- Cal.com ID
  status TEXT  -- 'pending', 'completed', 'no_show'
)
```

### Tablas Multi-Tenant

```sql
-- Tenants/Clientes
tenants (
  id UUID PK,
  name, email UNIQUE, company_name TEXT,
  subscription_tier TEXT,  -- starter/growth/pro/enterprise
  subscription_status TEXT,  -- pending/active/past_due/canceled
  stripe_customer_id, stripe_subscription_id TEXT,
  settings JSONB
)

-- Cuentas WhatsApp
whatsapp_accounts (
  id UUID PK,
  tenant_id UUID FK,
  waba_id, phone_number_id TEXT INDEXED,
  display_phone_number, business_name TEXT,
  access_token_encrypted TEXT,  -- AES-256-GCM
  status TEXT  -- pending/active/inactive/error
)

-- Config del Agente
agent_configs (
  id UUID PK,
  tenant_id UUID FK UNIQUE,
  business_name, business_description TEXT,
  tone TEXT,  -- professional/friendly/casual
  system_prompt TEXT,  -- Custom prompt
  few_shot_examples JSONB,
  products_catalog JSONB
)

-- Knowledge Base
tenant_documents (
  id UUID PK,
  tenant_id UUID FK,
  name, content TEXT,
  is_active BOOLEAN
)

-- Custom Tools
tenant_tools (
  id UUID PK,
  tenant_id UUID FK,
  name, display_name, description TEXT,
  parameters JSONB,
  execution_type TEXT,  -- webhook/mock/code
  mock_response JSONB,
  is_active BOOLEAN
)
```

### Row Level Security (RLS)
- Service role: acceso completo
- Users autenticados: solo ven datos de su tenant
- Políticas verifican: `email = auth.jwt()->>'email'`

---

## 3. Sistema de Agentes IA (`/lib/agents/`)

### Simple Agent (Producción)
**Modelo:** GPT-4o
**Archivo:** `simple-agent.ts`

**Arquitectura:**
1. **Fast Path** - Skip multi-agent para mensajes simples
2. **Few-Shot Learning** - Ejemplos de BD inyectados en prompt
3. **Multi-Agent Analysis** (cuando necesario):
   - GPT-4o-mini: Analiza fase, estrategia, objeciones
   - GPT-4o: Genera respuesta con instrucciones
4. **Tools disponibles:**
   - `escalate_to_human` - Transferir a operador
   - `schedule_demo` - Mostrar calendario interactivo
   - `send_payment_link` - Enviar checkout Stripe

**Personalidad:** Lu, growth advisor de Loomi. Español mexicano auténtico.

### Demo Agent (Landing)
**Modelo:** GPT-4o-mini
**Archivo:** `demo-agent.ts`
- Single API call, max 150 tokens
- Prompt simplificado para demo rápida

### Multi-Agent Analysis
**Archivo:** `multi-agent.ts`
- Detecta fase: primer_contacto, descubriendo_dolor, presentando_valor, etc.
- Identifica objeciones: precio, no_confio_ia, ya_tengo, timing
- Retorna instrucciones específicas para Lu

---

## 4. Sistema de Handoff (`/lib/handoff/`)

### Filosofía: NUNCA PERDER UN LEAD

**Razones de escalación:**
- `user_requested` - Cliente pidió humano
- `user_frustrated` - Frustración detectada
- `agent_error` - IA falló
- `repeated_failures` - 2+ errores en conversación
- `enterprise_lead` - Deal de alto valor
- `payment_issue` - Problema de pago

**Prioridades:**
- 🔴 `critical` - 2min respuesta
- 🟠 `urgent` - 5min respuesta
- 🟢 `normal` - 15min respuesta

**Ejecución:**
1. Generar handoff ID
2. Construir mensaje para operador con contexto
3. Enviar a `FALLBACK_PHONE` + backup
4. Notificar cliente con mensaje empático

---

## 5. WhatsApp Integration (`/lib/whatsapp/`)

### Parsing (`parse.ts`)
```typescript
ParsedWhatsAppMessage {
  messageId, phone, name,
  text, timestamp,
  phoneNumberId,  // Para routing multi-tenant
  interactiveType,  // button_reply, list_reply
  interactiveId  // ID de opción seleccionada
}
```

### Sending (`send.ts`)
**Mensajes de texto:**
- `sendWhatsAppMessage(phone, text)`
- `sendWhatsAppLink(phone, url, caption)`

**Mensajes interactivos:**
- `sendScheduleList(phone, slots)` - Selector de horarios
- `sendConfirmationButtons(phone, text)` - Confirmar/Cambiar
- `sendPlanSelection(phone)` - Lista de planes
- `sendChallengeList(phone)` - Onboarding: retos
- `sendVolumeList(phone)` - Onboarding: volumen
- `sendIndustryList(phone)` - Onboarding: industria

**Media:**
- `sendWhatsAppDocument/Image/Video/Audio()`

**Escalación:**
- `escalateToHuman(phone, name, reason)`
- `markAsRead(messageId)`

---

## 6. Multi-Tenancy (`/lib/tenant/`)

### Routing
```typescript
getTenantFromPhoneNumberId(phoneNumberId)
// Cache 5 min → phone_number_id → tenant_id → credentials
```

### Configuración por Tenant
```typescript
getAgentConfig(tenantId)
// → system_prompt, tone, business_info, few_shot_examples
```

### Límites por Plan
| Plan | Msg/día | Msg/mes |
|------|---------|---------|
| Starter | 100 | 3,000 |
| Growth | 300 | 9,000 |
| Pro | 1,000 | 30,000 |
| Enterprise | Ilimitado | Ilimitado |

---

## 7. Rate Limiting & Estado (Redis)

**Rate Limiters:**
- 20 msg/min por teléfono
- 100 msg/hora por teléfono
- 1,000 msg/min global

**Estado en Redis:**
- `processing:{messageId}` - Lock de procesamiento (30s TTL)
- `pending_slot:{phone}` - Slot seleccionado (1h TTL)
- `pending_plan:{phone}` - Plan seleccionado (1h TTL)

---

## 8. Integraciones

### HubSpot (`/lib/integrations/hubspot.ts`)
- Sync de leads a HubSpot CRM
- Properties: phone, email, lifecycle_stage, conversation_summary
- Trigger: eventos significativos de conversación

### Meta Conversions API (`/lib/integrations/meta-conversions.ts`)
- `trackLeadQualified` - Lead calificado
- `trackDemoScheduled` - Demo agendada
- `trackCustomerWon` - Pago completado

### Cal.com (`/lib/tools/calendar.ts`)
- `checkAvailability(dates)` - Obtener slots
- `createEvent(date, time, contact)` - Agendar

### ElevenLabs (`/lib/elevenlabs/voice.ts`)
- Generación de notas de voz para demos

---

## 9. Seguridad

1. **Encriptación**: AES-256-GCM para WhatsApp tokens
2. **RLS**: Row Level Security en todas las tablas multi-tenant
3. **Auth**: Supabase Auth + JWT validation
4. **Rate Limiting**: Redis sliding window
5. **Input Validation**: Longitud de mensajes, formato de teléfono
6. **Webhook Verification**: Stripe signature + WhatsApp token
7. **Handoff Safety Net**: Siempre hay fallback cuando IA falla

---

## 10. Performance

1. **Parallel Queries**: `Promise.all()` para queries concurrentes
2. **Async Routes**: Start promises early, await late
3. **Caching**: 5-min tenant cache, Redis para estado
4. **Fast Path**: Skip multi-agent para mensajes simples
5. **Non-blocking**: `waitUntil()` para operaciones background
6. **Token Optimization**: gpt-4o en vez de gpt-5.2 (más rápido)

---

## 11. Variables de Entorno

### Requeridas
```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_BUSINESS=
STRIPE_WEBHOOK_SECRET=

# WhatsApp
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=

# Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Handoff
FALLBACK_PHONE=
FALLBACK_PHONE_2=
```

### Opcionales
```env
HUBSPOT_ACCESS_TOKEN=
META_PIXEL_ID=
ELEVENLABS_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 12. Estructura de Archivos Backend

```
lib/
├── agents/
│   ├── simple-agent.ts    # Agente principal GPT-4o
│   ├── demo-agent.ts      # Demo ligera GPT-4o-mini
│   ├── multi-agent.ts     # Análisis de ventas
│   ├── reasoning.ts       # Sentiment/industry detection
│   ├── sentiment.ts       # Análisis de tono
│   ├── industry.ts        # Prompts por industria
│   └── few-shot.ts        # Ejemplos dinámicos
├── handoff/
│   └── index.ts           # Sistema de escalación
├── memory/
│   ├── context.ts         # Construcción de contexto
│   ├── supabase.ts        # Operaciones DB
│   └── generate.ts        # Generación de memoria
├── tenant/
│   └── context.ts         # Multi-tenancy
├── whatsapp/
│   ├── parse.ts           # Parsing de webhooks
│   ├── send.ts            # Envío de mensajes
│   └── flows.ts           # WhatsApp Flows
├── integrations/
│   ├── hubspot.ts         # Sync CRM
│   └── meta-conversions.ts # CAPI tracking
├── tools/
│   ├── calendar.ts        # Cal.com integration
│   └── knowledge.ts       # Knowledge base
├── stripe/
│   └── checkout.ts        # Stripe sessions
├── followups/
│   └── scheduler.ts       # Follow-ups programados
└── supabase/
    ├── client.ts          # Browser client
    ├── server.ts          # Server client
    └── crypto.ts          # Encriptación
```

---

## Próximos Pasos Sugeridos

1. **Testing**: Agregar tests unitarios para agentes y handoff
2. **Monitoring**: Implementar logging estructurado (Axiom/Datadog)
3. **Analytics**: Dashboard de métricas de conversación
4. **Webhooks outbound**: Notificaciones a sistemas externos
5. **API pública**: REST API para integraciones enterprise

---

*Documento generado automáticamente. Para preguntas, contactar al equipo de desarrollo.*

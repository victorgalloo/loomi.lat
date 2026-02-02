# Meta Conversions API - Contexto de Integración

## Resumen

Integración con Meta Conversions API para enviar eventos de conversión cuando un lead progresa en el pipeline. Esto permite a Meta optimizar el targeting de anuncios para traer leads de mayor calidad.

## Estado Actual: EN CONFIGURACIÓN

Los eventos se envían correctamente (API devuelve `events_received: 1`) pero no aparecen en Meta Events Manager. Pendiente: configurar API de conversiones en el dataset.

## Credenciales Configuradas

| Variable | Valor | Ubicación |
|----------|-------|-----------|
| `META_PIXEL_ID` | `912267854789790` | `.env.local` + Vercel |
| `META_ACCESS_TOKEN` | `EAALmkL5nVZAgBQm3fqX...` (nuevo token) | `.env.local` + Vercel |
| `META_TEST_EVENT_CODE` | `TEST32143` | `.env.local` + Vercel |

**Dataset:** Loomi (ID: 912267854789790)

## Pipeline CRM (8 etapas)

| # | Etapa | Evento Meta | Disparador |
|---|-------|-------------|------------|
| 1 | Nuevo | - | Lead creado |
| 2 | Contactado | - | Manual |
| 3 | **Calificado** | `Lead` | WhatsApp Flow completado |
| 4 | **Demo Agendada** | `CompleteRegistration` | Demo agendada por WhatsApp |
| 5 | Propuesta | - | Manual |
| 6 | Negociacion | - | Manual |
| 7 | **Ganado** | `Purchase` | Mover a "Ganado" en CRM o pago Stripe |
| 8 | Perdido | - | Manual |

## Eventos Implementados

| Evento Meta | Disparador | Archivo |
|-------------|-----------|---------|
| `Lead` | Lead calificado (completa WhatsApp Flow) → stage `Calificado` | `lib/memory/supabase.ts:saveLeadQualification()` |
| `CompleteRegistration` | Demo agendada → stage `Demo Agendada` | `app/api/webhook/whatsapp/route.ts` |
| `Purchase` | Pago Stripe **o** mover a `Ganado` en CRM | `app/api/stripe/webhook/route.ts` + `app/api/leads/[id]/route.ts` |

## Archivos del Sistema

### `/lib/integrations/meta-conversions.ts`
Servicio principal con:
- `sendConversionEvent()` - Envía evento a Meta API con retry
- `trackLeadQualified()` - Evento Lead
- `trackDemoScheduled()` - Evento CompleteRegistration
- `trackCustomerWon()` - Evento Purchase (siempre incluye value y currency)
- `processEventQueue()` - Procesa cola de eventos fallidos
- Funciones de hash SHA256 y normalización de datos

### `/app/api/leads/[id]/route.ts`
Endpoint para actualizar leads:
- `PATCH /api/leads/:id` - Actualiza propiedades del lead
- Cuando `stage` cambia a `Ganado`, dispara `trackCustomerWon()` con `await`

### `/app/api/cron/meta-conversions/route.ts`
Cron job para procesar eventos fallidos de la cola.

### `/supabase/migrations/20260201100000_add_conversion_events_queue.sql`
Tabla para cola de reintentos.

## Realtime Habilitado

Tablas con Supabase Realtime:
- leads
- conversations
- messages
- appointments
- clients
- pipeline_stages

Páginas con actualizaciones en tiempo real:
- Dashboard principal
- CRM Pipeline
- Conversaciones

## Flujo de Datos

```
[Lead completa WhatsApp Flow]
         │
         ▼
  saveLeadQualification()
         │
         ├──► stage = 'Calificado'
         └──► trackLeadQualified() ──► Meta API (Lead)

[Lead agenda demo por WhatsApp]
         │
         ▼
  WhatsApp webhook (appointmentBooked)
         │
         ├──► stage = 'Demo Agendada'
         └──► trackDemoScheduled() ──► Meta API (CompleteRegistration)

[Lead movido a "Ganado" en CRM]
         │
         ▼
  PATCH /api/leads/:id { stage: 'Ganado' }
         │
         └──► await trackCustomerWon() ──► Meta API (Purchase)

[Lead paga en Stripe]
         │
         ▼
  handleCheckoutCompleted()
         │
         └──► trackCustomerWon() ──► Meta API (Purchase)
```

## Troubleshooting Realizado

### Problema: Eventos no aparecen en Meta Events Manager
- API devuelve `events_received: 1` pero eventos no visibles
- Token verificado: tiene acceso al dataset (puede leer nombre/id)
- test_event_code correcto: TEST32143

### Fixes aplicados:
1. ✅ Corregido: `await trackCustomerWon()` para evitar terminación prematura
2. ✅ Corregido: Siempre incluir `value` y `currency` en Purchase (Meta lo requiere)
3. ✅ Corregido: Stages sincronizados (`Calificado`, `Demo Agendada` en español)
4. ✅ Corregido: Leads con stage `initial` actualizados a `Nuevo`
5. ✅ Corregido: Dataset asignado al System User
6. ✅ Token regenerado después de asignar dataset

### Pendiente:
- Configurar API de conversiones en el dataset de Meta
- Verificar que eventos aparezcan después de configuración

## Verificación

### Para probar manualmente:
```bash
source .env.local && curl -s -X POST "https://graph.facebook.com/v24.0/${META_PIXEL_ID}/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": [{
      \"event_name\": \"Purchase\",
      \"event_time\": $(date +%s),
      \"action_source\": \"system_generated\",
      \"user_data\": {
        \"ph\": [\"$(echo -n '5214779083304' | shasum -a 256 | cut -d' ' -f1)\"]
      },
      \"custom_data\": {
        \"value\": 1000,
        \"currency\": \"MXN\"
      }
    }],
    \"access_token\": \"${META_ACCESS_TOKEN}\",
    \"test_event_code\": \"${META_TEST_EVENT_CODE}\"
  }"
```

## Links Útiles

- [Events Manager](https://business.facebook.com/events_manager2/list/dataset/912267854789790)
- [Business Settings - System Users](https://business.facebook.com/settings/system-users)
- [API de Conversiones Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)

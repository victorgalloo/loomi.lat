# Meta Conversions API - Contexto de Integración

## Resumen

Integración con Meta Conversions API para enviar eventos de conversión cuando un lead progresa en el pipeline. Esto permite a Meta optimizar el targeting de anuncios para traer leads de mayor calidad.

## Credenciales Configuradas

| Variable | Valor | Ubicación |
|----------|-------|-----------|
| `META_PIXEL_ID` | `1309679250691627` | `.env.local` + Vercel |
| `META_ACCESS_TOKEN` | `EAAVS2ZCFjRec...` | `.env.local` + Vercel |
| `META_TEST_EVENT_CODE` | `TEST89740` | `.env.local` + Vercel (remover en prod) |

## Eventos Implementados

| Evento Meta | Disparador | Archivo |
|-------------|-----------|---------|
| `Lead` | Lead calificado (completa WhatsApp Flow) | `lib/memory/supabase.ts:saveLeadQualification()` |
| `CompleteRegistration` | Demo agendada | `app/api/webhook/whatsapp/route.ts` (línea ~590) |
| `Purchase` | Pago completado en Stripe | `app/api/stripe/webhook/route.ts:handleCheckoutCompleted()` |

## Archivos Creados

### `/lib/integrations/meta-conversions.ts`
Servicio principal con:
- `sendConversionEvent()` - Envía evento a Meta API con retry
- `trackLeadQualified()` - Evento Lead
- `trackDemoScheduled()` - Evento CompleteRegistration
- `trackCustomerWon()` - Evento Purchase
- `processEventQueue()` - Procesa cola de eventos fallidos
- Funciones de hash SHA256 y normalización de datos

### `/app/api/cron/meta-conversions/route.ts`
Cron job para procesar eventos fallidos de la cola.

### `/supabase/migrations/20260201100000_add_conversion_events_queue.sql`
Tabla para cola de reintentos:
```sql
conversion_events_queue (
  id, event_name, lead_id, phone, email,
  payload, status, attempts, last_error,
  created_at, sent_at
)
```

## Flujo de Datos

```
[Lead completa WhatsApp Flow]
         │
         ▼
  saveLeadQualification()
         │
         └──► trackLeadQualified() ──► Meta API (Lead)

[Lead agenda demo]
         │
         ▼
  WhatsApp webhook (appointmentBooked)
         │
         └──► trackDemoScheduled() ──► Meta API (CompleteRegistration)

[Lead paga en Stripe]
         │
         ▼
  handleCheckoutCompleted()
         │
         └──► trackCustomerWon() ──► Meta API (Purchase)
```

## Formato de Payload (CRM)

```json
{
  "data": [{
    "event_name": "Lead",
    "event_time": 1706803200,
    "action_source": "system_generated",
    "custom_data": {
      "event_source": "crm",
      "lead_event_source": "Loomi"
    },
    "user_data": {
      "ph": ["<sha256_hash_phone>"],
      "em": ["<sha256_hash_email>"],
      "external_id": ["<sha256_hash_lead_id>"],
      "fn": ["<sha256_hash_first_name>"],
      "country": ["<sha256_hash_mx>"]
    }
  }]
}
```

## Retry Logic

1. **Intento inicial**: Envío directo a Meta API
2. **Si falla**: Retry con backoff exponencial (1s, 2s, 4s)
3. **Después de 3 intentos**: Se guarda en `conversion_events_queue`
4. **Cron job**: Procesa cola cada 10 minutos (configurable en `vercel.json`)

## Verificación

### En Desarrollo (Test Events)
1. Asegurarse que `META_TEST_EVENT_CODE` esté configurado
2. Disparar evento (calificar lead, agendar demo, o pagar)
3. Ver en Events Manager > Test Events

### En Producción
1. Remover `META_TEST_EVENT_CODE` o dejarlo vacío
2. Verificar en Events Manager > Overview
3. Revisar "Event Match Quality" (objetivo: >6/10)
4. Revisar "Diagnósticos" para errores

## Configurar Cron Job (Opcional)

Agregar a `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/meta-conversions",
    "schedule": "*/10 * * * *"
  }]
}
```

## Privacidad

- Todos los datos PII (teléfono, email, nombre) se hashean con SHA256
- El lead ID también se hashea como `external_id`
- Los datos nunca se envían en claro a Meta
- `action_source: "system_generated"` indica origen CRM

## Troubleshooting

### Evento no aparece en Test Events
1. Verificar credenciales en Vercel
2. Revisar logs en Vercel > Functions > Logs
3. Buscar `[Meta]` en los logs

### Error de autenticación
- Regenerar Access Token en Business Settings > System Users
- Asegurarse que el token tenga permisos sobre el Dataset

### Event Match Quality bajo
- Enviar más parámetros (email además de teléfono)
- Asegurar formato correcto de teléfono (E.164 sin +)

## Links Útiles

- [Events Manager](https://business.facebook.com/events_manager)
- [Business Settings](https://business.facebook.com/settings)
- [API de Conversiones Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [CRM Integration Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/guides/crm-integration)

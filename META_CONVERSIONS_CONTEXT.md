# Meta Conversions API - Contexto de Integración

## Estado: ✅ FUNCIONANDO

Integración completada y verificada. Los eventos se envían correctamente y aparecen en Meta Events Manager.

## Credenciales Configuradas

| Variable | Valor | Ubicación |
|----------|-------|-----------|
| `META_PIXEL_ID` | `912267854789790` | `.env.local` + Vercel |
| `META_ACCESS_TOKEN` | `EAALmkL5nVZAgBQm3fqX...` | `.env.local` + Vercel |
| `META_TEST_EVENT_CODE` | `TEST32143` | `.env.local` + Vercel (remover en prod) |

**Dataset:** Loomi (ID: 912267854789790)

## Eventos Configurados en Meta

| Evento | Estado | Descripción |
|--------|--------|-------------|
| **Comprar** (Purchase) | ✅ Activo | Lead movido a "Ganado" o pago Stripe |
| **Cliente potencial** (Lead) | ✅ Activo | Lead calificado via WhatsApp Flow |
| **Completar registro** (CompleteRegistration) | ✅ Configurado | Demo agendada |

## Pipeline CRM (3 etapas)

| # | Etapa | Evento Meta | Disparador |
|---|-------|-------------|------------|
| 1 | **Lead** | `Lead` | Lead creado / WhatsApp Flow completado |
| 2 | **Demo Agendada** | `CompleteRegistration` | Demo agendada por WhatsApp |
| 3 | **Ganado** | `Purchase` | Mover a "Ganado" en CRM o pago Stripe |

## Archivos del Sistema

### `/lib/integrations/meta-conversions.ts`
Servicio principal:
- `sendConversionEvent()` - Envía evento a Meta API con retry
- `trackLeadQualified()` - Evento Lead
- `trackDemoScheduled()` - Evento CompleteRegistration
- `trackCustomerWon()` - Evento Purchase (siempre incluye value y currency)
- `processEventQueue()` - Procesa cola de eventos fallidos

### `/app/api/leads/[id]/route.ts`
- `PATCH /api/leads/:id` - Actualiza lead
- Dispara `await trackCustomerWon()` cuando stage cambia a "Ganado"

### `/app/api/webhook/whatsapp/route.ts`
- Dispara `trackDemoScheduled()` cuando se agenda demo
- Actualiza stage a "Demo Agendada"

### `/lib/memory/supabase.ts`
- `saveLeadQualification()` dispara `trackLeadQualified()`
- Actualiza stage a "Calificado"

## Realtime Habilitado

Tablas con Supabase Realtime:
- leads, conversations, messages, appointments, clients, pipeline_stages

Páginas con actualizaciones en tiempo real:
- Dashboard principal
- CRM Pipeline
- Conversaciones

## Flujo de Datos

```
[Lead entra / completa WhatsApp Flow]
         │
         ▼
  saveLeadQualification()
         │
         ├──► stage = 'Lead'
         └──► trackLeadQualified() ──► Meta API (Lead) ✅

[Lead agenda demo por WhatsApp]
         │
         ▼
  WhatsApp webhook (appointmentBooked)
         │
         ├──► stage = 'Demo Agendada'
         └──► trackDemoScheduled() ──► Meta API (CompleteRegistration) ✅

[Lead movido a "Ganado" en CRM]
         │
         ▼
  PATCH /api/leads/:id { stage: 'Ganado' }
         │
         └──► await trackCustomerWon() ──► Meta API (Purchase) ✅
```

## Configuración Completada

### Pasos realizados:
1. ✅ Crear dataset "Loomi" en Meta Events Manager
2. ✅ Crear System User en Business Settings
3. ✅ Asignar dataset al System User con permiso "Manage"
4. ✅ Generar Access Token con permisos ads_management, ads_read
5. ✅ Configurar variables en `.env.local` y Vercel
6. ✅ Configurar API de conversiones manualmente en Meta
7. ✅ Seleccionar eventos: Comprar, Cliente potencial, Completar registro
8. ✅ Verificar recepción de eventos en Meta Events Manager

## Verificación

### Probar manualmente:
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

### Ver eventos en Meta:
[Events Manager - Loomi](https://business.facebook.com/events_manager2/list/dataset/912267854789790/overview)

## Producción

Para ir a producción:
1. Remover o vaciar `META_TEST_EVENT_CODE` en Vercel
2. Verificar en Events Manager > Diagnóstico que no hay errores
3. Monitorear "Calidad de coincidencias de eventos" (objetivo: >6/10)

## Links Útiles

- [Events Manager - Loomi](https://business.facebook.com/events_manager2/list/dataset/912267854789790)
- [Business Settings](https://business.facebook.com/settings)
- [API de Conversiones Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)

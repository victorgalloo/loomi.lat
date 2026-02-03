# Loomi Temporal Workers

Temporal workflows and activities for durable, reliable background processing.

## Architecture

```
┌─────────────────────────────────────┐
│          Vercel (Edge)              │
│  - /webhook/whatsapp (latency <5s)  │
│  - Rate limiting (Redis)            │
│  - Deterministic flows              │
│  - Triggers Temporal workflows      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Temporal Cloud               │
│  Workflows:                         │
│  - FollowUpWorkflow                 │
│  - DemoBookingWorkflow              │
│  - PaymentWorkflow                  │
│  - IntegrationSyncWorkflow          │
│                                     │
│  Workers: Railway                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  External: OpenAI, WhatsApp,        │
│  Cal.com, Stripe, Supabase          │
└─────────────────────────────────────┘
```

## Workflows

### FollowUpWorkflow
Durable timers for follow-up messages:
- `pre_demo_24h` - 24 hours before demo
- `pre_demo_reminder` - 30 minutes before demo
- `post_demo` - 2 minutes after demo ends
- `said_later` - 12 hours after "I'll look later"
- `cold_lead_reengagement` - Sequence at 24h, 60h, 168h

### DemoBookingWorkflow
Saga pattern for booking demos:
1. Create Cal.com event
2. Create appointment record
3. Update lead stage
4. Send confirmation
5. Start reminder child workflows

Compensations:
- Cancel calendar event on failure
- Mark appointment as cancelled

### PaymentWorkflow
Stripe checkout with reminders:
1. Create checkout session
2. Send payment link
3. Wait for completion (24h)
4. Send reminders at 12h, 20h

### IntegrationSyncWorkflow
Background sync to external services:
- HubSpot CRM sync
- Meta Conversions API
- Memory generation

## Setup

### 1. Temporal Cloud

1. Sign up at [temporal.io/cloud](https://temporal.io/cloud)
2. Create a namespace (e.g., `loomi-production`)
3. Generate mTLS certificates
4. Note the address (e.g., `loomi.tmprl.cloud:7233`)

### 2. Environment Variables

```env
# Temporal Cloud
TEMPORAL_ADDRESS=loomi.tmprl.cloud:7233
TEMPORAL_NAMESPACE=loomi-production
TEMPORAL_CLIENT_CERT=<base64-encoded-cert>
TEMPORAL_CLIENT_KEY=<base64-encoded-key>

# External services (same as main app)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
CAL_API_KEY=...
```

### 3. Local Development

```bash
# Start Temporal dev server
temporal server start-dev

# In packages/temporal-workers:
npm install
npm run dev
```

### 4. Deploy to Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Ir al directorio del worker
cd packages/temporal-workers

# 4. Crear proyecto (primera vez)
railway init

# 5. Deploy
railway up
```

**Variables de entorno en Railway Dashboard** (https://railway.app):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `TEMPORAL_ADDRESS` | Dirección de Temporal Cloud | `loomi.tmprl.cloud:7233` |
| `TEMPORAL_NAMESPACE` | Namespace | `loomi-production` |
| `TEMPORAL_API_KEY` | API Key (recomendado) | `eyJ...` |
| `SUPABASE_URL` | URL de Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJ...` |
| `WHATSAPP_ACCESS_TOKEN` | Token de Meta | `EAA...` |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone ID | `123456789` |
| `OPENAI_API_KEY` | Para memoria | `sk-...` |

**Opcionales:**
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` - Para pagos
- `CAL_API_KEY`, `CAL_EVENT_TYPE_ID` - Para Cal.com
- `HUBSPOT_API_KEY` - Para CRM sync
- `META_PIXEL_ID`, `META_ACCESS_TOKEN` - Para conversions

**Verificar deploy:**
```bash
railway logs -f
# Deberías ver: "Workers are ready to process tasks"
```

### 5. Enable Feature Flags

In Vercel environment variables:
```env
USE_TEMPORAL_FOLLOWUPS=true  # Start with this
USE_TEMPORAL_BOOKING=false
USE_TEMPORAL_PAYMENTS=false
USE_TEMPORAL_INTEGRATIONS=false
```

## Migration Phases

### Phase 1: Follow-ups (Week 1-2)
1. Deploy worker to Railway
2. Set `USE_TEMPORAL_FOLLOWUPS=true`
3. Monitor in Temporal UI
4. Run parallel with cron for 1 week
5. Disable cron

### Phase 2: Demo Booking (Week 3-4)
1. Set `USE_TEMPORAL_BOOKING=true`
2. Test full saga with compensations
3. Monitor child workflows

### Phase 3: Payments (Week 5)
1. Set `USE_TEMPORAL_PAYMENTS=true`
2. Test idempotency
3. Verify Stripe webhook integration

### Phase 4: Integrations (Week 6)
1. Set `USE_TEMPORAL_INTEGRATIONS=true`
2. Remove `waitUntil()` from webhook
3. Verify HubSpot sync

## Monitoring

Access Temporal UI at your cloud namespace URL to:
- View workflow executions
- Debug failed workflows
- Replay workflows for testing
- Check activity retries

## Rollback

Each feature flag is independent:
1. Set `USE_TEMPORAL_X=false` in Vercel
2. Deploy
3. Workflows in progress complete normally
4. New requests use legacy code

## Development

```bash
# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Testing

```bash
# Start local Temporal
temporal server start-dev

# Run worker
npm run dev

# Trigger workflow via Temporal CLI
temporal workflow start \
  --type FollowUpWorkflow \
  --task-queue loomi-main \
  --input '{"leadId":"test-123","type":"said_later","lead":{"id":"test-123","phone":"+521234567890","name":"Test","email":null,"company":null,"industry":null,"stage":"contacted"}}'
```

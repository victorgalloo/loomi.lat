# Plan: Integración Twilio para Provisión de Números Telefónicos

## Contexto

Los tenants actualmente conectan su propio número de WhatsApp via Meta Embedded Signup. Se quiere agregar la opción de que Loomi compre un número nuevo via Twilio para tenants que no tienen uno. Después de la compra, el tenant sigue el flujo normal de Embedded Signup con Meta para registrar ese número en WhatsApp Business. Todo el messaging sigue pasando por Meta Cloud API — Twilio solo se usa para comprar el número y capturar el SMS de verificación de Meta.

## Flujo del usuario

1. Tenant va a Dashboard → Connect → ve dos opciones: "Obtener un número nuevo" o "Ya tengo un número"
2. Si elige "Obtener número": selecciona país (MX/US) → ve números disponibles → compra uno
3. El número queda activo y se configura un webhook SMS en Twilio
4. Tenant hace clic en "Conectar a WhatsApp" → abre Meta Embedded Signup (flujo existente)
5. Durante el Embedded Signup, Meta envía SMS de verificación al número Twilio
6. El webhook captura el código y se lo muestra al usuario en la UI
7. El usuario ingresa el código en Meta → conexión completa

## Archivos nuevos a crear

### 1. `lib/twilio/client.ts` — Singleton del SDK
- Inicializa `Twilio(accountSid, authToken)` con lazy loading
- Valida que las env vars existan

### 2. `lib/twilio/numbers.ts` — Lógica de negocio
Funciones:
- `searchAvailableNumbers(country: 'MX' | 'US', options?)` — busca números disponibles via `twilioClient.availablePhoneNumbers(country).mobile.list()` (MX) o `.local.list()` (US). Filtra `smsEnabled: true`. Retorna max 10.
- `purchaseNumber(phoneNumber, tenantId)` — compra via `twilioClient.incomingPhoneNumbers.create()` con `smsUrl` apuntando al webhook. Inserta en `twilio_provisioned_numbers`.
- `releaseNumber(twilioSid, tenantId)` — libera el número y marca status `released`
- `getProvisionedNumbers(tenantId)` — lista los números del tenant
- `updateVerificationCode(phoneNumber, code)` — guarda el código SMS con expiración de 10 min
- `getVerificationCode(numberId, tenantId)` — retorna el código capturado (si existe y no expiró)

### 3. `app/api/twilio/numbers/search/route.ts` — Buscar números
```
GET /api/twilio/numbers/search?country=MX
Auth: cookie (tenant)
Response: { numbers: [{ phoneNumber, friendlyName, locality, region, monthlyPrice }] }
```

### 4. `app/api/twilio/numbers/purchase/route.ts` — Comprar número
```
POST /api/twilio/numbers/purchase
Body: { phoneNumber: "+5215551234567" }
Auth: cookie (tenant)
Response: { success, number: { id, twilioSid, phoneNumber, status, monthlyPrice } }
```

### 5. `app/api/twilio/numbers/route.ts` — Listar números del tenant
```
GET /api/twilio/numbers
Auth: cookie (tenant)
Response: { numbers: [...] }
```

### 6. `app/api/twilio/numbers/[id]/verification/route.ts` — Poll código de verificación
```
GET /api/twilio/numbers/[id]/verification
Auth: cookie (tenant)
Response: { code: "123456" | null, expiresAt, expired }
```
Frontend hace polling cada 3s durante el Embedded Signup.

### 7. `app/api/twilio/sms/webhook/route.ts` — Webhook SMS (público)
```
POST /api/twilio/sms/webhook
Body: form-encoded (From, To, Body)
```
- Parsea el SMS body para extraer código de 6 dígitos (`/\b(\d{6})\b/`)
- Busca el número en `twilio_provisioned_numbers` por el campo `To`
- Guarda el código con `updateVerificationCode()`
- Retorna TwiML vacío `<Response></Response>`
- Opcionalmente valida firma Twilio via `X-Twilio-Signature`

### 8. `components/dashboard/TwilioNumberProvisioning.tsx` — Componente UI
State machine: `idle → searching → results → confirming → purchasing → purchased`

Pasos:
1. **Seleccionar país**: Botones MX / US
2. **Ver números**: Lista con phone, locality, precio. Botón "Seleccionar" por número.
3. **Confirmar compra**: Muestra número elegido y precio. Botones "Confirmar" / "Cancelar".
4. **Número listo**: Muestra número activo + botón "Conectar a WhatsApp" que inicia Embedded Signup.
5. **Código de verificación**: Panel que hace polling y muestra el código cuando llega, con cuenta regresiva.

Sigue el design system terminal: `bg-surface border border-border rounded-xl`, `font-mono`, traffic light dots.

### 9. `supabase/migrations/20260208000000_twilio_provisioned_numbers.sql` — Migración DB

```sql
CREATE TABLE IF NOT EXISTS twilio_provisioned_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  twilio_sid TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  friendly_name TEXT,
  country_code TEXT NOT NULL DEFAULT 'MX',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_whatsapp', 'whatsapp_connected', 'released', 'error')),
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  monthly_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes, RLS, trigger (same pattern as other tables)
```

## Archivos existentes a modificar

### 10. `app/dashboard/connect/ConnectView.tsx`
- Agregar import de `TwilioNumberProvisioning`
- En estado desconectado: mostrar dos opciones antes del Embedded Signup
  - "Obtener un número nuevo" → muestra `TwilioNumberProvisioning`
  - "Ya tengo un número" → muestra `WhatsAppConnectFlow` (actual)
- En estado conectado ("agregar otro número"): mismo patrón de dos opciones
- Agregar prop `pendingTwilioNumbers` para mostrar números comprados pendientes de conectar

### 11. `app/dashboard/connect/page.tsx`
- Importar función `getProvisionedNumbers` de `lib/twilio/numbers`
- Pasar `pendingTwilioNumbers` como prop a `ConnectView`

### 12. `components/dashboard/WhatsAppConnectFlow.tsx`
- Agregar prop opcional `twilioPhoneNumber?: string`
- Cuando presente, mostrar un banner: "Registrando +52 155 1234 5678 con WhatsApp Business"
- Agregar prop `onVerificationNeeded?: () => void` para activar el panel de verificación

### 13. `package.json` — Agregar `twilio`
### 14. `.env.example` — Agregar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

## Secuencia de implementación

1. **Dependencia + env**: `npm install twilio`, agregar env vars
2. **Migración DB**: Crear tabla `twilio_provisioned_numbers`
3. **Backend**: `lib/twilio/client.ts` + `lib/twilio/numbers.ts`
4. **API routes**: search, purchase, list, verification, sms webhook
5. **UI**: `TwilioNumberProvisioning.tsx`
6. **Integración**: Modificar `ConnectView`, `page.tsx`, `WhatsAppConnectFlow`
7. **Build + test**

## Verificación

1. `npm run build` — sin errores TypeScript
2. `npx supabase db push` — migración exitosa
3. Test manual: buscar números MX via la UI, comprar uno, verificar en Twilio console y DB
4. Test webhook: enviar SMS al número comprado, verificar que el código aparece en la UI
5. Test completo: comprar número → Embedded Signup → verificación → WhatsApp conectado

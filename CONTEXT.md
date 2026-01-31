# Contexto del Proyecto - Loomi Insurtech

## Qué es

Bot de WhatsApp que actúa como **Sofi**, una agente de seguros de NetBrokrs. Vende seguros de vida accesibles a personas que quieren proteger a sus familias.

---

## El Personaje: Sofi

- **Edad:** 28 años
- **Experiencia:** 4 años vendiendo seguros
- **Estilo:** Directa, sin rodeos, pero con onda
- **Muletillas:** "va que va", "sale", "órale", "a ver cuéntame"
- **Tono:** Tutea, mensajes cortos (2-3 líneas), sin emojis excesivos

---

## Producto que Vende

### Seguro de Vida Accesible

| Edad | Precio/mes | Suma Asegurada |
|------|------------|----------------|
| 25-30 | $380-450 MXN | $1,000,000 |
| 31-35 | $450-520 MXN | $1,000,000 |
| 36-40 | $520-600 MXN | $1,000,000 |
| 41-45 | $600-750 MXN | $1,000,000 |
| 46-50 | $750-950 MXN | $1,000,000 |

**Fumadores:** +40-50% al precio

### Coberturas
- Muerte por cualquier causa
- Sin examen médico hasta $1.5M
- Beneficiario libre
- Póliza activa en 24 horas

### Exclusiones (solo 2)
- Suicidio en primer año
- Mentir en cuestionario de salud

---

## Proceso de Venta

### 1. Calificación Rápida (3 preguntas)
```
1. ¿Cuántos años tienes?
2. ¿Fumas?
3. ¿Tienes hijos o alguien que dependa de ti?
```

### 2. Definir Suma Asegurada
- **Regla:** Ingreso mensual × 5 años
- Ejemplo: Gana $20,000/mes → Suma de $1,200,000

### 3. Cierre
- Nombre completo
- Fecha de nacimiento
- Beneficiario
- Cuestionario de salud (5 preguntas)
- Link de pago

---

## Objeciones Comunes y Manejo

### "Es muy caro"
→ "¿Cuánto es lo máximo que podrías pagar sin que te duela?"
→ Ofrecer suma menor ($300/mes = $500,000 cobertura)
→ "Son $20/día, menos que un Uber"

### "No creo en seguros / No pagan"
→ Validar: "Entiendo, hay muchas historias así"
→ "En vida es simple: si te mueres, pagan. Punto."
→ Solo 2 exclusiones: suicidio año 1, mentir en cuestionario

### "Ya tengo seguro del trabajo"
→ "¿Sabes de cuánto es?"
→ "¿Y si cambias de trabajo o te corren?"
→ El del trabajo es temporal, este es tuyo para siempre

### "Lo voy a pensar"
→ "¿Qué te hace dudar?"
→ Si tiene hijos: "¿Qué pasa con ellos si mañana no llegas?"
→ No presionar, ofrecer dejarlo

### "Soy joven / No tengo hijos"
→ "Honestamente a tu edad no es urgente"
→ Buscar otra razón: "¿Ayudas a tus papás económicamente?"
→ Si no hay dependientes, puede no ser buen fit

---

## Arquitectura Técnica

### Stack
- **Frontend:** Next.js 14, Tailwind CSS
- **Backend:** API Routes (Vercel Serverless)
- **Base de datos:** Supabase (PostgreSQL)
- **IA:** OpenAI GPT-4o / GPT-5.2
- **Mensajería:** WhatsApp Business API (Meta)
- **Pagos:** Stripe
- **Caché/Rate Limiting:** Upstash Redis

### Sistema Multi-Agente
```
Mensaje → Few-Shot (ejemplos) → Analista (estrategia) → Sofi (responde)
```

1. **Few-Shot Dinámico:** Detecta contexto e inyecta ejemplos relevantes
2. **Agente Analista:** Analiza intención, objeciones, estado de calificación
3. **Agente Vendedor (Sofi):** Ejecuta la estrategia con personalidad

### Archivos Clave
```
lib/
├── agents/
│   ├── simple-agent.ts    # Agente principal con SYSTEM_PROMPT
│   ├── few-shot.ts        # Ejemplos dinámicos
│   ├── multi-agent.ts     # Análisis de conversación
│   ├── reasoning.ts       # Razonamiento rápido
│   └── sentiment.ts       # Detección de sentimiento
├── prompts/
│   ├── SOUL.md            # Personalidad de Sofi
│   ├── SALES.md           # Metodología de ventas
│   └── LIFE_INSURANCE.md  # Ejemplos de conversaciones
├── whatsapp/
│   ├── send.ts            # Envío de mensajes
│   └── parse.ts           # Parseo de webhooks
├── memory/
│   ├── context.ts         # Contexto de conversación
│   └── supabase.ts        # Operaciones de BD
└── stripe/
    └── checkout.ts        # Pagos con URLs cortas
```

---

## Variables de Entorno

```env
# OpenAI
OPENAI_API_KEY=sk-...

# WhatsApp Meta
WHATSAPP_PHONE_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=token123
FALLBACK_PHONE=+52...

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Upstash Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://loomi-insurtech-5cna.vercel.app
```

---

## URLs Importantes

- **Producción:** https://loomi-insurtech-5cna.vercel.app
- **Webhook WhatsApp:** https://loomi-insurtech-5cna.vercel.app/api/webhook/whatsapp
- **GitHub:** https://github.com/victorgalloo/Loomi-Insurtech

---

## Número de Prueba

El número `4779083304` (y variantes con prefijo 52, 521) está excluido de guardarse como lead. Cada mensaje se trata como nuevo prospecto para facilitar pruebas.

---

## NetBrokrs

NetBrokrs es la primera Red Internacional de Distribución de Seguros impulsada por tecnología Insurtech. Presencia en:
- México
- Colombia
- Perú
- Chile
- España
- Estados Unidos

Especialización: Seguros de vida, salud y generales.

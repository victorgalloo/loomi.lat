# Contexto del Proyecto - NetBrokrs Insurtech

## Qué es

Bot de WhatsApp que actúa como **Sofi**, una agente de seguros de NetBrokrs. Vende seguros de vida de bajo costo a personas que quieren proteger a sus familias.

Este es un **POC (Proof of Concept)** acordado con Pablo Tiscornia de NetBrokrs para demostrar la venta de seguros de vida accesibles a través de WhatsApp con IA.

---

## NetBrokrs

NetBrokrs es la **primera Red Internacional de Distribución de Seguros** impulsada por tecnología Insurtech.

- **Presencia:** México, Colombia, Perú, Chile, España, Estados Unidos
- **Corredores afiliados:** +5,000
- **Plataforma:** "Agent Intelligence" - automatiza el flujo completo del corredor
- **Resultado:** Crecimiento promedio de ventas del 60-70% anual para afiliados
- **Contacto clave:** Pablo Tiscornia

### Problema que resuelven
Los corredores de seguros en Latinoamérica tienen aversión, miedo o falta de acceso a la tecnología. NetBrokrs les provee herramientas que convierten a los escépticos en "amigos de la tecnología" al ver crecer sus ingresos.

---

## El Personaje: Sofi

- **Edad:** 28 años
- **Experiencia:** 4 años ayudando a familias
- **Estilo:** Cálida, empática, genuina - NO es vendedora fría
- **Filosofía:** "Prefiero que NO compre si no le conviene"
- **Muletillas:** "va que va", "sale", "órale", "a ver cuéntame"
- **Tono:** Tutea, mensajes cortos (2-3 líneas), conversacional

---

## Producto que Vende

### Seguro de Vida de BAJO COSTO

**Precio base: desde $400 MXN/mes (~$20-25 USD)**

Este es el producto estrella de NetBrokrs, probado en México, Colombia y Uruguay.

| Edad | Precio/mes | Suma Asegurada |
|------|------------|----------------|
| 25-30 | $350-420 MXN | $500,000-1,000,000 |
| 31-35 | $420-480 MXN | $500,000-1,000,000 |
| 36-40 | $480-550 MXN | $500,000-1,000,000 |
| 41-45 | $550-650 MXN | $500,000-1,000,000 |
| 46-50 | $650-800 MXN | $500,000-1,000,000 |

**Fumadores:** +40% al precio

**Punto de venta clave:** "Son como $15 pesos al día - menos que un café"

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
- **IA Razonamiento:** OpenAI GPT-5.2-pro (análisis de contexto)
- **IA Chat:** OpenAI GPT-5.2-chat (respuestas naturales)
- **Mensajería:** WhatsApp Business API (Meta)
- **Pagos:** Stripe
- **Caché/Rate Limiting:** Upstash Redis

### Sistema de Dos Modelos
```
Mensaje → GPT-5.2-pro (razonamiento) → GPT-5.2-chat (respuesta)
```

1. **GPT-5.2-pro (Razonamiento):**
   - Analiza conversación completa
   - Determina qué ya preguntamos (para no repetir)
   - Identifica qué sabemos del cliente
   - Decide el siguiente paso lógico
   - Da instrucciones específicas al modelo de chat

2. **GPT-5.2-chat (Respuesta):**
   - Recibe instrucciones del modelo pro
   - Genera respuesta con personalidad de Sofi
   - Conversación natural y empática

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

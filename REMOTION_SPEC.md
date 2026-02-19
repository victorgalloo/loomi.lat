# Remotion Video System - Loomi.lat

Especificacion completa para crear videos promocionales, demos y contenido de marketing de Loomi usando [Remotion](https://remotion.dev) (React para video programatico).

---

## Stack Recomendado

```bash
npm create video@latest loomi-videos
cd loomi-videos
npm i @remotion/player @remotion/transitions @remotion/motion-blur
npm i framer-motion tailwindcss @remotion/tailwind
npm i @remotion/noise @remotion/paths  # efectos avanzados
```

### Estructura del Proyecto Remotion

```
loomi-videos/
├── src/
│   ├── Root.tsx                    # Registro de composiciones
│   ├── config/
│   │   ├── colors.ts              # Tokens de color Loomi
│   │   ├── fonts.ts               # JetBrains Mono + Lexend
│   │   └── easings.ts             # Curvas de animacion
│   ├── components/
│   │   ├── TrafficLights.tsx       # Dots rojo/amarillo/verde
│   │   ├── TerminalWindow.tsx      # Ventana estilo terminal macOS
│   │   ├── LoomiLogo.tsx           # Logo animado
│   │   ├── ChatBubble.tsx          # Burbuja de WhatsApp
│   │   ├── TypeWriter.tsx          # Efecto de escritura
│   │   ├── StatCounter.tsx         # Contador animado
│   │   ├── KanbanCard.tsx          # Tarjeta CRM
│   │   ├── PhoneFrame.tsx          # Marco de celular
│   │   ├── BrowserFrame.tsx        # Marco de navegador
│   │   ├── CodeBlock.tsx           # Bloque de codigo
│   │   └── BadgePill.tsx           # Badge estilo Loomi
│   ├── sequences/
│   │   ├── 01-hero/               # Intro/brand
│   │   ├── 02-problem/            # Pain point
│   │   ├── 03-demo-agent/         # Demo del agente
│   │   ├── 04-dashboard/          # Tour del dashboard
│   │   ├── 05-crm/                # CRM Pipeline
│   │   ├── 06-broadcasts/         # Broadcasts
│   │   ├── 07-setup-wizard/       # Configuracion del agente
│   │   ├── 08-meta-loop/          # Meta Ads integration
│   │   ├── 09-integrations/       # Stack tecnologico
│   │   ├── 10-pricing/            # Planes
│   │   ├── 11-testimonials/       # Social proof
│   │   └── 12-cta/                # Call to action final
│   ├── compositions/
│   │   ├── FullPromo.tsx           # Video completo (~90s)
│   │   ├── ShortDemo.tsx           # Demo corto (~30s)
│   │   ├── FeatureSpotlight.tsx    # Feature individual (~15s)
│   │   ├── SocialClip.tsx          # Clip para redes (~10s)
│   │   ├── StoryAd.tsx            # Story vertical (9:16, ~15s)
│   │   └── TestimonialClip.tsx     # Testimonio (~10s)
│   └── utils/
│       ├── spring-config.ts        # Springs reutilizables
│       ├── interpolations.ts       # Helpers de interpolacion
│       └── layout.ts              # Grids y posicionamiento
├── public/
│   ├── fonts/                     # JetBrains Mono, Lexend
│   ├── logos/                     # Logos de integraciones
│   ├── screenshots/               # Capturas del dashboard
│   ├── sounds/                    # SFX opcionales
│   └── lottie/                    # Animaciones Lottie
└── remotion.config.ts
```

---

## Design Tokens para Remotion

### Colores

```ts
// src/config/colors.ts
export const colors = {
  // Base
  background: '#0C0C0C',
  foreground: '#FAFAFA',
  surface: '#161616',
  surface2: '#1E1E1E',
  surface3: '#1A1A1A',
  border: '#2A2A2A',
  border2: '#3A3A3A',

  // Muted
  muted: '#8A8A8A',
  mutedLight: '#5C5C5C',
  mutedSoft: '#A3A3A3',

  // Terminal macOS
  terminalRed: '#FF5F56',
  terminalYellow: '#FFBD2E',
  terminalGreen: '#27C93F',

  // Semantic
  info: '#007AFF',
  warning: '#F59E0B',
  success: '#22C55E',
  error: '#EF4444',

  // WhatsApp
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',

  // Gradients
  heroGlow: 'radial-gradient(ellipse at center, rgba(250,250,250,0.03) 0%, transparent 70%)',
  accentGradient: 'linear-gradient(135deg, #FAFAFA 0%, #A3A3A3 100%)',
} as const;
```

### Tipografia

```ts
// src/config/fonts.ts
import { staticFile } from 'remotion';

export const loadFonts = () => {
  const jetbrains = new FontFace(
    'JetBrains Mono',
    `url('${staticFile('fonts/JetBrainsMono-Regular.woff2')}')`
  );
  const lexend = new FontFace(
    'Lexend',
    `url('${staticFile('fonts/Lexend-Regular.woff2')}')`
  );
  const lexendMedium = new FontFace(
    'Lexend',
    `url('${staticFile('fonts/Lexend-Medium.woff2')}')`,
    { weight: '500' }
  );
  const lexendSemiBold = new FontFace(
    'Lexend',
    `url('${staticFile('fonts/Lexend-SemiBold.woff2')}')`,
    { weight: '600' }
  );
  return Promise.all([
    jetbrains.load(),
    lexend.load(),
    lexendMedium.load(),
    lexendSemiBold.load(),
  ]);
};

export const fontMono = 'JetBrains Mono, SF Mono, monospace';
export const fontSans = 'Lexend, Inter, system-ui, sans-serif';
```

### Animacion

```ts
// src/config/easings.ts
import { spring, SpringConfig } from 'remotion';

// Springs consistentes con el brand Loomi
export const springs = {
  snappy: { damping: 20, mass: 0.5, stiffness: 200 } as SpringConfig,
  smooth: { damping: 15, mass: 0.8, stiffness: 120 } as SpringConfig,
  bouncy: { damping: 12, mass: 0.6, stiffness: 180 } as SpringConfig,
  gentle: { damping: 20, mass: 1, stiffness: 80 } as SpringConfig,
  counter: { damping: 30, mass: 0.5, stiffness: 300 } as SpringConfig,
} as const;

// Timing helpers
export const FRAME_RATE = 30;
export const seconds = (s: number) => Math.round(s * FRAME_RATE);
```

---

## Componentes Base

### TrafficLights

```tsx
// src/components/TrafficLights.tsx
import { interpolate, useCurrentFrame } from 'remotion';
import { colors } from '../config/colors';

export const TrafficLights: React.FC<{
  delay?: number;
  size?: number;
}> = ({ delay = 0, size = 12 }) => {
  const frame = useCurrentFrame();
  const dots = [colors.terminalRed, colors.terminalYellow, colors.terminalGreen];

  return (
    <div style={{ display: 'flex', gap: size * 0.65 }}>
      {dots.map((color, i) => {
        const opacity = interpolate(
          frame - delay - i * 3,
          [0, 8],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const scale = interpolate(
          frame - delay - i * 3,
          [0, 6, 10],
          [0.3, 1.1, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity,
              transform: `scale(${scale})`,
            }}
          />
        );
      })}
    </div>
  );
};
```

### TerminalWindow

```tsx
// src/components/TerminalWindow.tsx
import { interpolate, useCurrentFrame, spring } from 'remotion';
import { TrafficLights } from './TrafficLights';
import { colors } from '../config/colors';
import { fontMono } from '../config/fonts';
import { springs } from '../config/easings';

export const TerminalWindow: React.FC<{
  title: string;
  children: React.ReactNode;
  delay?: number;
  width?: number;
  height?: number;
}> = ({ title, children, delay = 0, width = 800, height = 500 }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  const scaleUp = spring({ frame: frame - delay, fps, config: springs.smooth });
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: colors.surface,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        opacity,
        transform: `scale(${scaleUp})`,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 44,
          backgroundColor: colors.surface2,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}
      >
        <TrafficLights delay={delay + 5} size={11} />
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 13,
            color: colors.muted,
            marginLeft: 8,
          }}
        >
          {title}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: 20, height: height - 44 }}>
        {children}
      </div>
    </div>
  );
};
```

### TypeWriter

```tsx
// src/components/TypeWriter.tsx
import { useCurrentFrame, interpolate } from 'remotion';
import { fontMono, fontSans } from '../config/fonts';
import { colors } from '../config/colors';

export const TypeWriter: React.FC<{
  text: string;
  startFrame?: number;
  speed?: number; // frames por caracter
  mono?: boolean;
  fontSize?: number;
  color?: string;
  cursor?: boolean;
}> = ({
  text,
  startFrame = 0,
  speed = 2,
  mono = false,
  fontSize = 16,
  color = colors.foreground,
  cursor = true,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  const charsVisible = Math.min(
    Math.floor(Math.max(0, elapsed) / speed),
    text.length
  );
  const cursorOpacity = Math.round(frame / 15) % 2 === 0 ? 1 : 0;

  return (
    <span
      style={{
        fontFamily: mono ? fontMono : fontSans,
        fontSize,
        color,
        letterSpacing: mono ? -0.5 : 0,
      }}
    >
      {text.slice(0, charsVisible)}
      {cursor && charsVisible < text.length && (
        <span style={{ opacity: cursorOpacity, color: colors.foreground }}>|</span>
      )}
    </span>
  );
};
```

### StatCounter

```tsx
// src/components/StatCounter.tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontMono, fontSans } from '../config/fonts';
import { colors } from '../config/colors';
import { springs } from '../config/easings';

export const StatCounter: React.FC<{
  value: string;       // "0.8s", "100%", "3x", "-78%"
  label: string;
  delay?: number;
  color?: string;
}> = ({ value, label, delay = 0, color = colors.foreground }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numericPart = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const suffix = value.replace(/[0-9.-]/g, '');

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springs.counter,
  });

  const currentValue = numericPart * progress;
  const displayValue = Number.isInteger(numericPart)
    ? Math.round(currentValue).toString()
    : currentValue.toFixed(1);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 48,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value.startsWith('-') && '-'}
        {displayValue.replace('-', '')}
        {suffix}
      </div>
      <div
        style={{
          fontFamily: fontSans,
          fontSize: 14,
          color: colors.muted,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};
```

### ChatBubble (WhatsApp)

```tsx
// src/components/ChatBubble.tsx
import { interpolate, useCurrentFrame, spring } from 'remotion';
import { fontSans } from '../config/fonts';
import { colors } from '../config/colors';
import { springs } from '../config/easings';

export const ChatBubble: React.FC<{
  message: string;
  isAgent?: boolean;
  delay?: number;
  agentName?: string;
}> = ({ message, isAgent = false, delay = 0, agentName = 'Loomi' }) => {
  const frame = useCurrentFrame();

  const slideY = interpolate(
    spring({ frame: frame - delay, fps: 30, config: springs.snappy }),
    [0, 1],
    [30, 0]
  );
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isAgent ? 'flex-start' : 'flex-end',
        opacity,
        transform: `translateY(${slideY}px)`,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: 16,
          borderTopLeftRadius: isAgent ? 4 : 16,
          borderTopRightRadius: isAgent ? 16 : 4,
          backgroundColor: isAgent ? colors.surface2 : colors.foreground,
          color: isAgent ? colors.foreground : colors.background,
          fontFamily: fontSans,
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {isAgent && (
          <div style={{ fontSize: 12, color: colors.terminalGreen, marginBottom: 4, fontWeight: 600 }}>
            {agentName}
          </div>
        )}
        {message}
      </div>
    </div>
  );
};
```

### PhoneFrame

```tsx
// src/components/PhoneFrame.tsx
import { colors } from '../config/colors';

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  scale?: number;
}> = ({ children, scale = 1 }) => {
  return (
    <div
      style={{
        width: 375 * scale,
        height: 812 * scale,
        borderRadius: 40 * scale,
        border: `3px solid ${colors.border2}`,
        backgroundColor: colors.background,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 150 * scale,
          height: 30 * scale,
          backgroundColor: colors.background,
          borderBottomLeftRadius: 20 * scale,
          borderBottomRightRadius: 20 * scale,
          zIndex: 10,
        }}
      />
      {/* Content */}
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};
```

---

## Secuencias del Video

### Secuencia 1: Hero / Brand Intro (~5s)

**Concepto**: Pantalla negra -> aparecen traffic lights -> `LOOMI_` se escribe en grande con cursor -> tagline fade in

```
Frame 0-15:   Fondo negro, sutil glow central
Frame 15-25:  Traffic lights aparecen uno a uno (red, yellow, green)
Frame 25-80:  "LOOMI_" se escribe caracter a caracter (font-mono, ~80px)
Frame 80-110: Cursor parpadea 2 veces
Frame 110-150: Tagline fade in: "Tu agente de IA para WhatsApp"
              + Badge "Meta Tech Provider" slide in
```

**Props clave**:
- Fondo: `#0C0C0C` con radial glow sutil
- Texto: `font-mono`, blanco `#FAFAFA`, peso bold
- Cursor: blinking `|` al final del texto
- Badge Meta: borde `#2A2A2A`, texto `#8A8A8A`

---

### Secuencia 2: Problema (~8s)

**Concepto**: Mostrar el dolor de no responder leads a tiempo

```
Frame 0-30:   Texto: "Tu equipo duerme." (typewriter)
Frame 30-50:  Texto: "Tus leads no." (typewriter, mas rapido)
Frame 50-90:  Simulacion WhatsApp:
              - Mensaje del lead: "Hola, vi su anuncio..." (slide in)
              - Pasan 2h (reloj animado acelerado)
              - Lead: "?" (aparece)
              - Lead: "Ya encontre otra opcion" (aparece)
Frame 90-120: Stat animado: "78% de leads se pierden en la primera hora"
              - Numero en rojo terminal (#FF5F56)
Frame 120-150: Fade a negro
```

---

### Secuencia 3: Solucion - Demo del Agente (~20s)

**Concepto**: Conversacion real en WhatsApp con el agente Loomi

```
Frame 0-20:   Terminal window aparece: titulo "whatsapp_live"
Frame 20-40:  Bubble cliente: "Hola, vi su anuncio de Meta. Cuanto cuesta el plan Growth?"
Frame 40-60:  Indicador "analizando..." con icono cerebro animado
              (simular las 4 etapas: Brain, Heart, TrendingUp, Sparkles)
Frame 60-100: Bubble Loomi: "Hola! El plan Growth es $349/mes e incluye..."
              (typewriter dentro de la burbuja)
Frame 100-120: Bubble cliente: "Me interesa, pero es caro comparado con Botmaker"
Frame 120-150: Indicador analisis (rapido, ~10 frames)
Frame 150-200: Bubble Loomi maneja objecion con datos especificos
Frame 200-230: Bubble Loomi: "Te puedo agendar una demo de 15 min?"
Frame 230-260: Notificacion Cal.com slide in desde arriba:
               "Demo agendada - Martes 14:00"
               + badge verde "agendada"
Frame 260-290: Badge "0.8s" aparece: "Tiempo de respuesta promedio"
```

**Detalle visual**:
- PhoneFrame con WhatsApp header (verde `#25D366`)
- Burbujas con sombra sutil
- Indicador typing (3 dots animados) antes de cada respuesta del agente
- Badge de clasificacion aparece: "hot 🔥" despues de la objecion

---

### Secuencia 4: Dashboard Tour (~15s)

**Concepto**: Zoom out del celular al dashboard completo

```
Frame 0-30:   Transicion: celular se minimiza a esquina
              Dashboard aparece detras con fade in
Frame 30-50:  Sidebar se despliega con items apareciendo staggered
              Traffic lights + "loomi_" en header
Frame 50-80:  Vista Home con stats inline:
              "Pipeline: $45,000 · Cerrados: 12 · Conversion: 34%"
              (contadores animados)
Frame 80-120: Highlight navega a CRM:
              - Active indicator se mueve (layoutId style)
              - Kanban aparece con columnas staggered
Frame 120-160: Tarjetas de leads aparecen en columnas:
              - "Maria Garcia" 🔥 hot - $5,000
              - "Carlos Lopez" 🟡 warm - $3,500
              (drag animation de una tarjeta moviendose de columna)
Frame 160-200: Vista cambia a Inbox:
              - Lista de conversaciones
              - Badge handoff aparece: "Requiere atencion humana"
Frame 200-240: Vista Analytics:
              - Barras horizontales se llenan animadas
              - Stats counters incrementan
```

---

### Secuencia 5: CRM Pipeline Deep Dive (~10s)

**Concepto**: Focus en el Kanban y la clasificacion IA

```
Frame 0-30:   Kanban full screen, columnas aparecen left to right:
              "Nuevo" | "Contactado" | "Demo Agendada" | "Propuesta" | "Cerrado"
Frame 30-60:  Cards aparecen en "Nuevo" (staggered, 3 cards)
              Cada card: avatar + nombre + empresa + valor
Frame 60-90:  Boton "Analizar con IA" pulsa
              Efecto: shimmer/glow recorre las cards
Frame 90-120: Cards se reclasifican:
              - Una card se mueve a "Demo Agendada" (drag animation)
              - Badges cambian: 🔥 hot, 🟡 warm, 🥶 cold
Frame 120-140: Stat aparece: "Conversion rate: 34%" con flecha verde up
```

---

### Secuencia 6: Broadcasts (~8s)

**Concepto**: Envio masivo de mensajes WhatsApp

```
Frame 0-20:   Terminal window: "broadcasts_campaign"
Frame 20-40:  Lista de templates aparece
              Template seleccionado se resalta
Frame 40-60:  CSV upload animation (archivo arrastandose)
              Preview: 500 contactos detectados
Frame 60-90:  Boton "Enviar" -> progress bar se llena
              Counter: "247/500 enviados..."
Frame 90-120: Completado:
              "500 enviados · 487 entregados · 13 fallidos"
              Barras de progreso verdes
```

---

### Secuencia 7: Setup Wizard (~12s)

**Concepto**: Mostrar lo facil que es configurar el agente

```
Frame 0-30:   Chat interface aparece
              Pregunta 1: "Que vendes y a quien?"
              Respuesta typed: "SaaS de CRM para equipos de ventas B2B"
Frame 30-50:  Respuestas rapidas para preguntas 2-4
              (fast forward visual, montage rapido)
Frame 50-80:  Boton "Crear mi agente" se presiona
              Overlay de procesamiento con 6 pasos:
              - 🧠 Analizando negocio... ✓
              - 📦 Extrayendo productos... ✓
              - 💰 Identificando precios... ✓
              - 🛡 Detectando objeciones... ✓
              - 🎯 Generando proceso de venta... ✓
              - ✨ Configurando agente... ✓
              (cada uno aparece secuencialmente con checkmark)
Frame 80-100: Gauge de confianza aparece: 92%
              (circular progress animado)
Frame 100-120: System prompt generado (scroll rapido en monospace)
               Badge "Agente activo" con confetti
```

---

### Secuencia 8: Meta Loop (~10s)

**Concepto**: Explicar el ciclo de optimizacion con Meta Ads

```
Frame 0-20:   Diagrama aparece en 4 nodos circulares:
              Meta Ads -> Lead -> Loomi -> Conversion
              (conexiones aparecen como lineas animadas)
Frame 20-40:  Nodo "Problema" se resalta:
              "Meta no sabe que paso despues del clic"
              (icono X rojo)
Frame 40-60:  Nodo "Solucion" se resalta:
              "Loomi reporta conversiones via CAPI"
              (flecha verde aparece de Loomi a Meta)
Frame 60-80:  Loop completo se ilumina:
              "Meta aprende y optimiza"
              (animacion circular, efecto glow)
Frame 80-100: Stat: "CPL -32%" en verde terminal
              "Meta optimiza para leads que SI convierten"
```

---

### Secuencia 9: Integraciones (~5s)

**Concepto**: Logos del stack tecnologico aparecen

```
Frame 0-15:   Titulo: "Se integra con tu stack"
Frame 15-60:  Logos aparecen en grid (staggered):
              WhatsApp | Cal.com | Stripe | HubSpot
              Claude   | Slack   | Supabase | Vercel
              (grayscale -> color al aparecer, escala 0 -> 1)
Frame 60-75:  "Y mas..." fade in
```

---

### Secuencia 10: Pricing (~8s)

**Concepto**: Plans side by side

```
Frame 0-20:   4 columnas aparecen (staggered left to right):
              Starter | Growth | Business | Enterprise
Frame 20-40:  Precios se typewritean:
              $199 | $349 | $599 | Contacto
Frame 40-60:  Plan "Growth" se resalta:
              - Borde glow
              - Fondo invertido (blanco)
              - Badge "Popular"
Frame 60-80:  Features clave se listan (fade in rapido)
              Toggle mensual/anual con "-20%"
```

---

### Secuencia 11: Testimoniales (~6s)

**Concepto**: Social proof rapido

```
Frame 0-20:   Testimonio 1 aparece (speech bubble con color de fondo):
              "Loomi nos convirtio el 340% mas leads"
              - Avatar + nombre + empresa
              - Badge metric: "+340%"
Frame 20-40:  Testimonio 2 slide in:
              "Tasa de no-show bajo de 45% a 10%"
              - Badge: "-78%"
Frame 40-60:  Testimonio 3 slide in:
              "El 85% de demos se agenda automaticamente"
              - Badge: "85%"
```

---

### Secuencia 12: CTA Final (~5s)

**Concepto**: Call to action con urgencia

```
Frame 0-15:   Fondo limpio, glow central
Frame 15-40:  "LOOMI_" grande (como el hero) + cursor
Frame 40-60:  "Empieza gratis hoy" slide in
              Boton CTA animado con shimmer effect
Frame 60-80:  URL: "loomi.lat" en font-mono
              Traffic lights al lado
Frame 80-90:  Fade out suave
```

---

## Composiciones

### 1. FullPromo (~90s, 1080p, 30fps)

```tsx
// src/compositions/FullPromo.tsx
import { Composition } from 'remotion';
import { seconds } from '../config/easings';

// Total: ~90 segundos = 2700 frames @ 30fps
export const FullPromo: React.FC = () => {
  return (
    <Composition
      id="FullPromo"
      component={FullPromoVideo}
      durationInFrames={seconds(90)}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

// Sequence timeline:
// 00:00 - 00:05  Hero/Brand (150 frames)
// 00:05 - 00:13  Problema (240 frames)
// 00:13 - 00:33  Demo Agente (600 frames)
// 00:33 - 00:48  Dashboard Tour (450 frames)
// 00:48 - 00:58  CRM Deep Dive (300 frames)
// 00:58 - 01:06  Broadcasts (240 frames)
// 01:06 - 01:18  Setup Wizard (360 frames)
// 01:18 - 01:28  Meta Loop (300 frames)
// 01:28 - 01:33  Integraciones (150 frames)
// 01:33 - 01:38  Pricing (150 frames)
// 01:38 - 01:44  Testimoniales (180 frames)
// 01:44 - 01:50  CTA Final (180 frames)
```

### 2. ShortDemo (~30s, 1080p)

```
Secuencias: Hero(3s) + Problema(5s) + Demo(12s) + Stats(5s) + CTA(5s)
```

### 3. FeatureSpotlight (~15s, 1080p)

```
Para cada feature individual:
- CRM Pipeline
- WhatsApp Agent
- Broadcasts
- Setup Wizard
- Meta Integration
```

### 4. StoryAd (9:16, 1080x1920, 15s)

```
Optimizado para Instagram/TikTok Stories:
- Hero vertical (3s)
- Demo conversacion (7s)
- Stat + CTA (5s)
```

### 5. SocialClip (1:1, 1080x1080, 10s)

```
Para feed de Instagram/LinkedIn:
- Hook stat (3s)
- Feature highlight (4s)
- CTA (3s)
```

---

## Transiciones Recomendadas

```ts
// Consistentes con la estetica Loomi
import { linearTiming, TransitionPresentation } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';

// Entre secuencias principales
const sectionTransition = {
  presentation: fade(),
  timing: linearTiming({ durationInFrames: 15 }),
};

// Para elementos que entran
const slideIn = {
  presentation: slide({ direction: 'from-bottom' }),
  timing: linearTiming({ durationInFrames: 12 }),
};

// Para cambios de vista del dashboard
const wipeTransition = {
  presentation: wipe({ direction: 'from-left' }),
  timing: linearTiming({ durationInFrames: 10 }),
};
```

---

## Render & Exportar

```bash
# Preview en el browser
npx remotion studio

# Render video completo (H.264)
npx remotion render FullPromo out/loomi-promo.mp4

# Render short demo
npx remotion render ShortDemo out/loomi-short.mp4

# Render vertical story
npx remotion render StoryAd out/loomi-story.mp4

# Render con alta calidad
npx remotion render FullPromo out/loomi-hq.mp4 --codec h264 --crf 18

# Render GIF para previews
npx remotion render SocialClip out/loomi-preview.gif --codec gif

# Render en paralelo (Lambda)
npx remotion lambda render FullPromo
```

---

## Assets Necesarios

### Fonts (descargar y colocar en `public/fonts/`)
- JetBrains Mono (Regular, Bold)
- Lexend (Regular, Medium, SemiBold, Bold)

### Logos (copiar de `loomi.lat/public/logos/`)
- meta-logo.png
- calcom.png
- + logos de integraciones (WhatsApp, Stripe, etc.)

### Screenshots del Dashboard
Capturar screenshots HD de:
- [ ] Dashboard home con stats
- [ ] CRM Kanban con leads
- [ ] Inbox/Conversaciones
- [ ] Broadcast campaign list
- [ ] Agent setup wizard (cada paso)
- [ ] Analytics view
- [ ] Prompt editor
- [ ] Knowledge base
- [ ] Mobile responsive views

### Sonido (Opcional)
- Typing sounds (soft keyboard)
- Notification ding (WhatsApp style)
- Success chime (para confetti moments)
- Ambient electronic background (lo-fi/tech)

---

## Variables de Contenido

Parametrizar el contenido para poder generar variaciones:

```ts
// src/config/content.ts
export const content = {
  brand: {
    name: 'LOOMI_',
    tagline: 'Tu agente de IA para WhatsApp',
    url: 'loomi.lat',
    badge: 'Meta Tech Provider',
  },
  stats: [
    { value: '0.8s', label: 'Tiempo de respuesta' },
    { value: '100%', label: 'Leads atendidos' },
    { value: '3x', label: 'Mas demos agendadas' },
    { value: '-78%', label: 'No-shows' },
  ],
  plans: [
    { name: 'Starter', price: '$199/mes', highlight: false },
    { name: 'Growth', price: '$349/mes', highlight: true },
    { name: 'Business', price: '$599/mes', highlight: false },
    { name: 'Enterprise', price: 'Custom', highlight: false },
  ],
  conversation: {
    clientName: 'Maria Garcia',
    messages: [
      { role: 'client', text: 'Hola, vi su anuncio. Cuanto cuesta el plan Growth?' },
      { role: 'agent', text: 'Hola Maria! El plan Growth es $349/mes e incluye agente IA, CRM pipeline, broadcasts ilimitados y soporte prioritario. Es nuestro plan mas popular.' },
      { role: 'client', text: 'Suena bien pero es caro vs Botmaker' },
      { role: 'agent', text: 'Entiendo la comparacion. A diferencia de Botmaker, Loomi usa IA generativa que entiende contexto, maneja objeciones y agenda demos automaticamente. Nuestros clientes ven 3x mas conversiones.' },
      { role: 'agent', text: 'Te agendo una demo de 15 min para que lo veas en accion?' },
    ],
  },
  testimonials: [
    {
      quote: 'Loomi nos convirtio el 340% mas leads del mismo gasto en ads.',
      author: 'Roberto M.',
      company: 'SaaS Fintech',
      metric: '+340%',
    },
    {
      quote: 'La tasa de no-show bajo de 45% a 10% con las confirmaciones automaticas.',
      author: 'Ana K.',
      company: 'Clinica Dental',
      metric: '-78%',
    },
    {
      quote: 'El 85% de nuestras demos se agenda sin intervencion humana.',
      author: 'Diego L.',
      company: 'Consultora B2B',
      metric: '85%',
    },
  ],
} as const;
```

---

## Checklist de Produccion

- [ ] Instalar Remotion y dependencias
- [ ] Configurar Tailwind en Remotion (`@remotion/tailwind`)
- [ ] Descargar e instalar fuentes (JetBrains Mono, Lexend)
- [ ] Copiar logos desde `/public/logos/`
- [ ] Implementar componentes base (TrafficLights, TerminalWindow, etc.)
- [ ] Capturar screenshots HD del dashboard
- [ ] Implementar cada secuencia (01-12)
- [ ] Componer FullPromo con todas las secuencias
- [ ] Crear variaciones (ShortDemo, StoryAd, SocialClip)
- [ ] Agregar audio/musica de fondo (opcional)
- [ ] Review y ajustar timings
- [ ] Render final en multiples formatos
- [ ] Subir a redes y landing page
```

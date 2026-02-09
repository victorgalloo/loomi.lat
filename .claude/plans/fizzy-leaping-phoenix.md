# Plan: Apple HIG + Terminal — Redesign Interactivo con Gamificación

## Contexto

El usuario rechazó el intento anterior de quitar `font-mono` de todo el dashboard — le quitó personalidad y lo dejó "confuso". Ahora quiere mantener la estética terminal pero con **tipografía Apple (Inter)**, **más interactividad**, **gamificación**, y **mejor navegación**. La clave: la magia está en las micro-interacciones y la gamificación, no solo en cambiar fonts.

**Principios Apple HIG aplicados a web:**
- **Clarity**: Jerarquía tipográfica limpia (Inter para legibilidad, JetBrains Mono para personalidad)
- **Deference**: UI soporta el contenido, no compite con él
- **Depth**: Sombras sutiles, capas visuales, animaciones con significado

---

## Fase 1: Fundación — Tipografía & Font Cleanup

**Objetivo**: Consolidar fonts, cambiar body a Inter via `next/font`, limpiar duplicación.

### `app/layout.tsx`
- Reemplazar `DM_Sans` por `Inter` de `next/font/google`
- Variable CSS: `--font-inter` (reemplaza `--font-dm-sans`)
- Pesos: 400, 500, 600, 700
- Agregar `JetBrains_Mono` también via `next/font/google` con variable `--font-mono`

### `app/globals.css`
- **Eliminar** la línea 1: `@import url('https://fonts.googleapis.com/...')` (ya no necesaria)
- Actualizar `body { font-family }` para usar `var(--font-inter)`
- Mejorar contraste `--muted`: dark `#6B6B6B` → `#8A8A8A`, light `#737373` → `#5C5C5C`
- Agregar animaciones nuevas:
  - `@keyframes slideUp` (para toasts y entradas)
  - `@keyframes shimmer` (para skeleton loading)
  - `@keyframes pulse-ring` (para status dots)
  - `@keyframes countUp` (para números)
  - `@keyframes celebrate` (para confetti)

### `tailwind.config.ts`
- `fontFamily.sans`: `["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"]`
- `fontFamily.mono`: `["var(--font-mono)", "SF Mono", "Menlo", "monospace"]`
- Agregar `fontSize` custom: `text-label` (13px), `text-body` (15px)
- Agregar nuevas animaciones al theme

**Regla de font-mono (MISMA que antes pero MÁS SELECTIVA):**
- ✅ MANTENER: Brand `loomi_`, nav labels `./pipeline`, títulos `./pipeline_`, valores numéricos, phones, IDs, botones comando `./crear-lead`
- ❌ QUITAR: Form labels, form inputs, stat labels descriptivos ("leads", "conversaciones"), badges no-terminal, body text, descripciones

---

## Fase 2: Micro-Interacciones — El Corazón del Cambio

**Objetivo**: Agregar feedback visual satisfactorio en TODA interacción. Esto es lo que el usuario quiere sentir.

### Nuevo componente: `components/ui/animated-number.tsx`
- Números que cuentan desde 0 hasta el valor real con easing
- Usa `framer-motion`'s `useMotionValue` + `useTransform`
- Se activa al entrar en viewport
- Para: stats del dashboard, analytics, broadcast counts

### Nuevo componente: `components/ui/progress-ring.tsx`
- Anillo circular SVG animado (estilo Apple Watch)
- Props: value, max, color, size, label
- Animación: `strokeDashoffset` transition con spring
- Para: conversion rate, response rate, broadcast progress

### Nuevo componente: `components/ui/skeleton-shimmer.tsx`
- Loading skeleton con efecto shimmer (gradiente animado)
- Variantes: text, card, stat, avatar
- Para: reemplazar spinners aburridos en carga

### Mejoras a `components/ui/button-loomi.tsx`
- Agregar haptic-like feedback: `whileTap={{ scale: 0.95 }}` (más notorio)
- Agregar ripple effect sutil en click
- Success state: botón cambia a verde brevemente después de acción exitosa

### Mejoras a `components/ui/card.tsx`
- Hover: `translateY(-2px)` + sombra expandida + borde más claro
- Click/active: `scale(0.98)` press effect
- Transición suave 200ms

### `components/ui/fade-in.tsx` — ya existe, extender:
- Agregar `stagger` prop para animar listas de cards
- Agregar `spring` variant para más bounce

### Nuevas animaciones en navegación (`DashboardShell.tsx`):
- **Active indicator animado**: Pill/underline que se desliza entre tabs con `motion.div layoutId="nav-indicator"`
- **Status dot pulsante**: `animate-pulse` en el dot verde de "live"
- **Hover en nav items**: Subtle background fade-in

---

## Fase 3: Gamificación — Engagement Visual

**Objetivo**: Hacer que el dashboard se sienta vivo y recompensante.

### `components/dashboard/TenantDashboard.tsx`
- Stats con `AnimatedNumber` (cuentan al cargar)
- Stat cards con hover lift + color accent sutil
- Agregar **streak counter**: "🔥 3 días activo" si tiene conversaciones recientes
- Agregar **progress bar de onboarding**: "Tu agente está al 80%" con ring animado
- Cada stat card entra con stagger animation (FadeIn con delay incremental)

### `app/dashboard/crm/CRMView.tsx`
- Stats bar con `AnimatedNumber`
- Lead cards con hover lift
- Agregar **mini celebration** cuando se mueve un lead a "closed" (confetti particles)
- Badge count con animación de bounce cuando cambia

### `app/dashboard/analytics/AnalyticsView.tsx`
- Reemplazar progress bars planas con `ProgressRing` para métricas principales
- Barras de stage breakdown con animación de crecimiento (width transition)
- Stats con `AnimatedNumber`

### `app/broadcasts/BroadcastsView.tsx`
- Progress de envío con `ProgressRing` en vez de barra plana
- Stats con `AnimatedNumber`
- Éxito de envío: mini celebration animation

### `components/dashboard/DashboardShell.tsx`
- Nav indicator animado (sliding pill)
- Notification badge con bounce animation
- Status dot con pulse-ring animation

---

## Fase 4: Font-Mono Cleanup Selectivo

**Objetivo**: Quitar font-mono SOLO de texto que debe ser legible (labels, inputs, body), mantener en todo lo terminal.

**Archivos a modificar** (mismos que el intento anterior pero MÁS CONSERVADOR):

### Dashboard views:
- `TenantDashboard.tsx`: Stat labels quitar font-mono (mantener en valores numéricos)
- `CRMView.tsx`: Form labels, inputs, stat labels descriptivos → quitar font-mono
- `ConversationsView.tsx`: Stat labels, filter tabs text, conversation preview → quitar font-mono
- `AnalyticsView.tsx`: Stat labels, metric labels → quitar font-mono
- `SettingsView.tsx`: Row labels → quitar font-mono
- `ConnectView.tsx`: `<dt>` labels → quitar font-mono (mantener en phones/IDs)

### Broadcasts:
- `BroadcastsView.tsx`: Form labels, campaign names, stat labels → quitar font-mono
- `CampaignDetailView.tsx`: Table headers, stat labels → quitar font-mono
- `BroadcastConversations.tsx`: Conversation names, preview text → quitar font-mono

### Auth & Onboarding:
- `login/page.tsx`: Form labels, inputs → quitar font-mono
- `demo/page.tsx`: Form labels, inputs → quitar font-mono
- `OnboardingWizard.tsx`: Prerequisites titles, chat input → quitar font-mono

### UI Components:
- `badge.tsx`: Quitar font-mono del base, agregarlo solo en variant "terminal"
- `card.tsx`: Terminal title `text-[10px]` → `text-xs` (12px mínimo)

### Text size fixes:
- TODO `text-[10px]` → `text-xs` (47 ocurrencias fuera del landing)
- TODO `text-[11px]` → `text-xs`

---

## Fase 5: Espaciado Apple 8pt Grid

**Objetivo**: Estandarizar espaciado siguiendo grid de 8pt de Apple.

- Card padding: Estandarizar a `p-4` o `p-6` (16px o 24px)
- Form field gaps: `space-y-4` → `space-y-5` (20px, múltiplo de 4)
- Label-to-input gap: `mb-1.5` → `mb-2` (8px)
- Section gaps: `mb-6` → `mb-8` (32px)
- Nav item spacing: `gap-6` → `gap-8`
- Touch targets: Asegurar mínimo 44px en botones interactivos
- Input height: `h-11` (44px) — ya cumple Apple minimum

---

## Fase 6: Polish Final

- `npm run build` — verificar 0 errores
- Revisar cada ruta visualmente
- Verificar font-mono solo en elementos terminal
- Verificar no hay texto menor a 12px
- Landing page (`/`) sin cambios

---

## Archivos Clave

| Archivo | Cambios |
|---------|---------|
| `app/layout.tsx` | Inter + JetBrains Mono via next/font |
| `app/globals.css` | Quitar @import, nuevas animaciones, contraste muted |
| `tailwind.config.ts` | Font vars, text-label/text-body, animaciones |
| `components/ui/animated-number.tsx` | **NUEVO** — Contador animado |
| `components/ui/progress-ring.tsx` | **NUEVO** — Anillo de progreso SVG |
| `components/ui/skeleton-shimmer.tsx` | **NUEVO** — Loading skeleton |
| `components/ui/button-loomi.tsx` | Mejorar feedback táctil |
| `components/ui/card.tsx` | Hover lift + fix text-[10px] |
| `components/ui/badge.tsx` | Font-mono solo en variant terminal |
| `components/dashboard/DashboardShell.tsx` | Nav indicator animado, pulse dot |
| `components/dashboard/TenantDashboard.tsx` | AnimatedNumber, streak, progress ring |
| `app/dashboard/crm/CRMView.tsx` | AnimatedNumber, hover cards, celebration |
| `app/dashboard/analytics/AnalyticsView.tsx` | ProgressRing, animated bars |
| `app/broadcasts/BroadcastsView.tsx` | ProgressRing, AnimatedNumber |
| ~15 archivos más | Font-mono cleanup selectivo + spacing |

## Verificación

1. `npm run build` — 0 errores
2. Verificar `/login`, `/dashboard`, `/dashboard/crm`, `/dashboard/conversations`, `/dashboard/analytics`, `/broadcasts`
3. Confirmar: font-mono SOLO en brand, nav labels, títulos terminal, valores numéricos, phones
4. Confirmar: no texto menor a 12px
5. Confirmar: micro-interacciones funcionan (hover, click, counters, rings)
6. Landing page (`/`) sin cambios

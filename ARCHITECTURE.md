# Arquitectura del Proyecto Anthana

Este documento describe la arquitectura y convenciones del proyecto para mantener consistencia al agregar nuevas páginas, rutas o features.

---

## Estructura de Carpetas

```
/repo
├── /app                    # Next.js App Router (rutas basadas en archivos)
├── /components             # Componentes React (organizados por feature)
├── /lib                    # Utilidades, helpers y servicios
├── /data                   # Datos estáticos y configuraciones
├── /types                  # Definiciones de tipos TypeScript
├── /hooks                  # Custom React hooks
├── /public                 # Assets estáticos (imágenes, logos, videos)
├── middleware.ts           # Middleware de Next.js para auth/routing
├── tailwind.config.ts      # Configuración de Tailwind CSS
└── tsconfig.json           # Configuración de TypeScript
```

---

## 1. Rutas y Páginas (`/app`)

### Estructura Actual

```
/app
├── page.tsx                        # Landing principal (anthana.agency)
├── layout.tsx                      # Root layout
├── globals.css                     # Estilos globales
│
├── /syntra                         # Producto Syntra
│   ├── page.tsx                    # Landing de Syntra
│   ├── /demo/page.tsx              # Demo interactivo
│   ├── /retail/page.tsx            # Caso de uso: Retail
│   ├── /manufactura/page.tsx       # Caso de uso: Manufactura
│   └── /[otros-casos]/page.tsx     # Otros casos de uso
│
├── /loomi                          # Producto Loomi
│   └── page.tsx                    # Landing de Loomi
│
├── /selected-work                  # Portafolio
│   └── page.tsx
│
├── /dashboard                      # Portal admin (protegido)
│   ├── layout.tsx                  # Layout del dashboard
│   └── /clients/[clientId]/...     # Rutas dinámicas
│
└── /api                            # API Routes
    └── /contact/route.ts
```

### Convención para Nuevas Páginas

```typescript
// app/[nueva-pagina]/page.tsx
"use client";

import { Component1, Component2 } from "@/components/nueva-pagina";

export default function NuevaPaginaPage() {
  return (
    <main>
      <Component1 />
      <Component2 />
    </main>
  );
}
```

**Reglas:**
- Usar `"use client"` si hay interactividad (estados, efectos, animaciones)
- Mantener el `page.tsx` limpio, delegando lógica a componentes
- Nombres de carpetas en kebab-case: `/nueva-pagina`
- Nombres de función en PascalCase: `NuevaPaginaPage`

---

## 2. Componentes (`/components`)

### Organización por Feature

```
/components
├── /landing                # Componentes del landing principal
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── Projects.tsx
│   ├── /shared             # Componentes compartidos del landing
│   │   ├── Container.tsx
│   │   └── index.ts        # Barrel exports
│   └── index.ts            # Barrel exports
│
├── /loomi                  # Componentes específicos de Loomi
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   └── index.ts
│
├── /selected-work          # Componentes del portafolio
│   ├── ProjectSection.tsx
│   ├── ParallaxImage.tsx
│   └── index.ts
│
├── /animations             # Animaciones reutilizables
│   ├── step-animations.tsx
│   └── architecture-features.tsx
│
├── /ui                     # Componentes de UI base (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
│
└── /portal                 # Componentes del portal/dashboard
    ├── Sidebar.tsx
    └── /shared
        └── index.ts
```

### Convención para Nuevos Componentes

```typescript
// components/nueva-feature/MiComponente.tsx
"use client";

import { motion } from "framer-motion";
import type { Language } from "@/types/landing";
import { cn } from "@/lib/utils";

interface MiComponenteProps {
  language: Language;
  className?: string;
}

/**
 * Descripción breve del componente
 */
export function MiComponente({ language, className }: MiComponenteProps) {
  return (
    <section className={cn("py-24", className)}>
      {/* Contenido */}
    </section>
  );
}
```

### Barrel Exports

Cada carpeta de componentes debe tener un `index.ts`:

```typescript
// components/nueva-feature/index.ts
export { MiComponente } from "./MiComponente";
export { OtroComponente } from "./OtroComponente";
```

**Uso:**
```typescript
import { MiComponente, OtroComponente } from "@/components/nueva-feature";
```

---

## 3. Datos Estáticos (`/data`)

### Estructura

```
/data
├── landing.ts              # Datos del landing (proyectos, team, skills)
└── businessData.ts         # Datos de negocio para demos
```

### Patrón de Datos Bilingües

```typescript
// data/landing.ts
import type { Project, BilingualText } from "@/types/landing";

export const projects: Project[] = [
  {
    id: "mi-proyecto",
    name: "Mi Proyecto",
    tagline: {
      EN: "English tagline",
      ES: "Tagline en español",
    },
    description: {
      EN: "English description...",
      ES: "Descripción en español...",
    },
    tech: ["Next.js", "TypeScript", "Tailwind"],
    imageSrc: "/images/mi-proyecto.png",
    hasLandingPage: true,
    landingUrl: "/mi-proyecto",
  },
];
```

---

## 4. Tipos (`/types`)

### Archivo Principal: `landing.ts`

```typescript
// types/landing.ts

// Idiomas soportados
export type Language = "EN" | "ES";

// Mixin para componentes con idioma
export interface WithLanguage {
  language: Language;
}

// Texto bilingüe
export type BilingualText = Record<Language, string>;

// Proyecto
export interface Project {
  id: string;
  name: string | BilingualText;
  tagline: BilingualText;
  description: BilingualText;
  tech: string[];
  imageSrc: string;
  images?: string[];
  videoSrc?: string;
  backgroundSrc?: string;
  liveUrl?: string;
  hasLandingPage?: boolean;
  landingUrl?: string;
  customBackground?: {
    logoSrc: string;
    bgColor: string;
    accentColor: string;
  };
}
```

### Convención para Nuevos Tipos

- Definir interfaces en `/types`
- Usar `type` para uniones y alias simples
- Usar `interface` para objetos con propiedades
- Exportar todo desde el archivo correspondiente

---

## 5. Utilidades (`/lib`)

### Archivos Principales

```
/lib
├── constants.ts            # Animaciones, estilos, configuraciones
├── translations.ts         # Traducciones centralizadas
├── utils.ts                # Utilidad cn() para clases
├── selected-work-animations.ts  # Animaciones del portafolio
└── /supabase               # Configuración de Supabase
    ├── client.ts
    └── server.ts
```

### Función `cn()` para Clases

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Uso:**
```typescript
<div className={cn("base-class", isActive && "active-class", className)} />
```

### Traducciones

```typescript
// lib/translations.ts
const translations = {
  hero: {
    EN: { title: "Build", subtitle: "..." },
    ES: { title: "Construye", subtitle: "..." },
  },
  // ...
};

export function getTranslations(section: string, language: Language) {
  return translations[section][language];
}
```

---

## 6. Animaciones (Framer Motion)

### Definición Centralizada

```typescript
// lib/constants.ts
export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  fadeInUpDelayed: (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  }),
};
```

### Patrones de Animación

**Scroll-Triggered:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
>
```

**Staggered Children:**
```typescript
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }}
  initial="hidden"
  whileInView="visible"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    />
  ))}
</motion.div>
```

**Scroll Progress:**
```typescript
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"],
});
const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
```

---

## 7. Estilos (Tailwind CSS)

### Colores Personalizados

```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "#FF9F32",  // Naranja Syntra
    // ... escala de 50 a 900
  },
  mint: {
    // ... escala para Loomi
  },
}
```

### Clases Utilitarias Predefinidas

```typescript
// lib/constants.ts
export const styles = {
  container: "max-w-7xl mx-auto px-6 lg:px-8",
  section: "py-24 lg:py-32",
  sectionTitle: "text-4xl lg:text-5xl font-bold text-gray-900 mb-4",
};
```

### Convención de Clases

1. Usar clases de Tailwind directamente
2. Para clases repetitivas, crear utilidad en `constants.ts`
3. Usar `cn()` para clases condicionales
4. Evitar CSS custom salvo casos especiales (en `globals.css`)

---

## 8. Estructura de una Nueva Landing Page

### Ejemplo: Agregar `/nueva-landing`

**1. Crear página:**
```typescript
// app/nueva-landing/page.tsx
"use client";

import { Navbar } from "@/components/nueva-landing/Navbar";
import { Hero } from "@/components/nueva-landing/Hero";
import { Features } from "@/components/nueva-landing/Features";
import { CTA } from "@/components/nueva-landing/CTA";
import { Footer } from "@/components/nueva-landing/Footer";

export default function NuevaLandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
```

**2. Crear componentes:**
```
/components/nueva-landing/
├── Navbar.tsx
├── Hero.tsx
├── Features.tsx
├── CTA.tsx
├── Footer.tsx
└── index.ts
```

**3. Agregar a datos (si aplica):**
```typescript
// data/landing.ts
export const projects: Project[] = [
  // ... proyectos existentes
  {
    id: "nueva-landing",
    name: "Nueva Landing",
    // ...
    hasLandingPage: true,
    landingUrl: "/nueva-landing",
  },
];
```

**4. Agregar traducciones (si aplica):**
```typescript
// lib/translations.ts
nuevaLanding: {
  EN: { title: "...", subtitle: "..." },
  ES: { title: "...", subtitle: "..." },
},
```

---

## 9. Checklist para Nuevas Features

- [ ] Crear carpeta de componentes en `/components/[feature]`
- [ ] Agregar barrel export (`index.ts`)
- [ ] Definir tipos en `/types` si son nuevos
- [ ] Agregar traducciones EN/ES si hay texto
- [ ] Usar animaciones de Framer Motion consistentes
- [ ] Seguir convenciones de nombrado (PascalCase componentes, kebab-case rutas)
- [ ] Usar `cn()` para clases condicionales
- [ ] Agregar a `/data/landing.ts` si es un proyecto visible

---

## 10. Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript 5.5 |
| Estilos | Tailwind CSS 3.4 |
| Animaciones | Framer Motion 12 |
| UI Components | shadcn/ui |
| Iconos | Lucide React |
| Backend | Supabase |
| Deploy | Vercel |

---

## 11. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

*Última actualización: Enero 2025*

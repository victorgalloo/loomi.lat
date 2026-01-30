# Loomi - Contexto de Sesión

## Resumen

Sesión de trabajo para crear materiales de aplicación a **Sandbox DTEC Dubai**.

## Archivos Creados

### Investor Data Room
- **Ruta:** `/app/investors/`
- **URL:** `https://anthana.agency/investors`
- **Archivos:**
  - `page.tsx` - Página Next.js con diseño cinematográfico Loomi
  - `layout.tsx` - Layout con ThemeProvider (light mode)
  - `README.md` - Documentación markdown

### PDFs (en `/public/`)
- `pitch-deck-final.pdf` - Pitch deck 10 páginas
- `one-pager.pdf` - Resumen ejecutivo 1 página
- `business-plan.pdf` - Business plan completo

### URLs de Documentos
- Pitch Deck: `https://anthana.agency/pitch-deck-final.pdf`
- One-Pager: `https://anthana.agency/one-pager.pdf`
- Business Plan: `https://anthana.agency/business-plan.pdf`

## Estilo de Diseño

El data room sigue el estilo "cinematográfico" de Loomi:
- **Fondo:** Blanco con glow verde sutil (radial gradient)
- **Color accent:** `#00FF66` (neon-green)
- **Tipografía:** DM Sans, títulos grandes y bold
- **Layout:** Sin tarjetas, tablas limpias, mucho whitespace
- **Títulos:** Formato "Word\n**Accent.**" donde accent es verde

## Equipo Fundador

| Nombre | Rol | Background |
|--------|-----|------------|
| Victor Gallo | CEO | ex-Konfío, ex-Globant |
| Carlos Cardona | CPO | ex-Disney |
| JJ Cardona | CDO | ex-Grupo Bimbo |

## Métricas Clave

- **Revenue:** $45,000 USD (verificado)
- **Stage:** Pre-seed / MVP
- **TAM:** $23B+ (LATAM + MENA)

## Proyecciones

| Año | Clientes | MRR | ARR |
|-----|----------|-----|-----|
| 2026 | 50 | $25K | $300K |
| 2027 | 200 | $100K | $1.2M |
| 2028 | 500+ | $300K | $3.6M |

## Configuración de Deploy

### Vercel
- **Proyecto:** anthanaperfect
- **Dominio:** anthana.agency
- **Branch de producción:** master

### Cambios para Deploy
- `vercel.json`: Cron cambiado a diario (`0 0 * * *`) por límite de Hobby plan
- `tsconfig.json`: Excluido `scripts/` del build por falta de `@types/pg`

## Git

- **Repo:** https://github.com/CarlosCardonaM/anthanaperfect
- **Branch de desarrollo:** `loomi-bot`
- **Último merge:** `d65f788` (loomi-bot → master)

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Deploy a Vercel (requiere cuenta con permisos)
vercel deploy --prod --yes

# Ver logs de Vercel
vercel logs anthana.agency
```

## Pendientes

- [ ] Verificar que Vercel hizo deploy automático del merge
- [ ] Probar URL: https://anthana.agency/investors
- [ ] Agregar screenshots del producto al data room (opcional)

## Contacto

**Victor Gallo** — Co-Founder & CEO
- Email: hello@anthanagroup.com
- LinkedIn: https://www.linkedin.com/in/victorgalloo/

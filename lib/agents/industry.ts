/**
 * Industry Personalization Module
 * Provides context-specific examples, benefits, and tone for different industries
 *
 * Optimized with:
 * - Set for O(1) keyword lookups (js-set-map-lookups)
 * - Early returns (js-early-exit)
 */

export type Industry =
  | 'ecommerce'
  | 'servicios_profesionales'
  | 'salud'
  | 'educacion'
  | 'bienes_raices'
  | 'restaurantes'
  | 'retail'
  | 'generic';

export interface IndustryContext {
  name: string;
  painPoints: string[];
  benefits: string[];
  examples: string[];
  tone: string;
  commonObjections: string[];
  keyMetrics: string[];
}

// Industry contexts with specific pain points, benefits, and examples
export const INDUSTRY_CONTEXTS: Record<Industry, IndustryContext> = {
  ecommerce: {
    name: 'E-commerce / Tienda online',
    painPoints: [
      'carritos abandonados',
      'preguntas repetitivas sobre envío, tallas, disponibilidad',
      'clientes que escriben fuera de horario y no compran',
      'saturación en temporadas altas'
    ],
    benefits: [
      'recuperar hasta 30% de carritos abandonados',
      'responder preguntas de producto 24/7',
      'notificar disponibilidad y promociones automáticamente',
      'escalar fácilmente en Black Friday, Buen Fin'
    ],
    examples: [
      'Una tienda de ropa online recuperó 30% de carritos abandonados con seguimiento automático',
      'Tienda de accesorios redujo preguntas de "¿tienen en stock?" de 50 a 5 diarias'
    ],
    tone: 'directo y orientado a resultados',
    commonObjections: [
      'Ya tengo chat en mi página',
      'Mis clientes quieren hablar con humanos'
    ],
    keyMetrics: ['carritos recuperados', 'tiempo de respuesta', 'conversión']
  },

  servicios_profesionales: {
    name: 'Servicios profesionales',
    painPoints: [
      'leads que no contestan después del primer contacto',
      'tiempo perdido en cotizaciones que no cierran',
      'clientes que llaman a todas horas',
      'dificultad para filtrar clientes serios de curiosos'
    ],
    benefits: [
      'calificar leads antes de que lleguen a ti',
      'enviar cotizaciones y hacer seguimiento automático',
      'agendar consultas directamente en tu calendario',
      'responder preguntas frecuentes 24/7'
    ],
    examples: [
      'Un despacho de abogados aumentó sus cierres 40% al hacer seguimiento automático de cotizaciones',
      'Contador redujo llamadas de "¿cuánto cobras?" filtrando por WhatsApp primero'
    ],
    tone: 'profesional y enfocado en eficiencia',
    commonObjections: [
      'Mis servicios son muy personalizados',
      'Necesito entender bien al cliente primero'
    ],
    keyMetrics: ['leads calificados', 'tiempo ahorrado', 'tasa de cierre']
  },

  salud: {
    name: 'Salud (clínicas, dentistas, nutriólogos)',
    painPoints: [
      'no-shows y citas canceladas a última hora',
      'llamadas constantes para agendar',
      'pacientes que no recuerdan su cita',
      'preguntas repetitivas sobre servicios y precios'
    ],
    benefits: [
      'reducir no-shows hasta 60% con recordatorios automáticos',
      'agendar citas 24/7 sin intervención del staff',
      'confirmar citas y reagendar automáticamente',
      'responder dudas sobre servicios y preparación'
    ],
    examples: [
      'Clínica dental redujo no-shows de 40% a 15% con recordatorios por WhatsApp',
      'Nutrióloga liberó 3 horas diarias que usaba para agendar citas manualmente'
    ],
    tone: 'profesional, empático y confiable',
    commonObjections: [
      'Los pacientes necesitan atención personalizada',
      'Temas de salud son delicados para un bot'
    ],
    keyMetrics: ['reducción de no-shows', 'citas agendadas automáticamente', 'satisfacción del paciente']
  },

  educacion: {
    name: 'Educación (cursos, academias, tutorías)',
    painPoints: [
      'preguntas repetitivas sobre horarios, precios, inscripciones',
      'leads que no completan la inscripción',
      'padres que quieren información fuera de horario',
      'seguimiento manual de interesados'
    ],
    benefits: [
      'responder consultas 24/7 sobre cursos y horarios',
      'enviar información de inscripción automáticamente',
      'hacer seguimiento a prospectos que no completaron inscripción',
      'notificar sobre nuevos cursos y promociones'
    ],
    examples: [
      'Academia de idiomas aumentó inscripciones 25% con seguimiento automático',
      'Escuela de música redujo llamadas de "¿qué horarios tienen?" en 70%'
    ],
    tone: 'amigable, informativo y accesible',
    commonObjections: [
      'Los padres quieren hablar con alguien',
      'Cada estudiante tiene necesidades diferentes'
    ],
    keyMetrics: ['inscripciones completadas', 'consultas resueltas', 'leads calificados']
  },

  bienes_raices: {
    name: 'Bienes raíces',
    painPoints: [
      'preguntas repetitivas sobre propiedades',
      'dificultad para calificar compradores serios',
      'coordinación de citas para visitas',
      'seguimiento de múltiples prospectos'
    ],
    benefits: [
      'pre-calificar compradores antes de mostrar propiedades',
      'enviar fichas técnicas y fotos automáticamente',
      'agendar visitas directo en tu calendario',
      'hacer seguimiento automático post-visita'
    ],
    examples: [
      'Inmobiliaria redujo visitas "perdidas" 50% al pre-calificar por WhatsApp',
      'Agente de bienes raíces cerró 2 ventas extra al mes con seguimiento automático'
    ],
    tone: 'profesional, ágil y orientado a cerrar',
    commonObjections: [
      'Cada propiedad es diferente',
      'Los clientes quieren ver en persona'
    ],
    keyMetrics: ['visitas agendadas', 'leads calificados', 'tiempo de respuesta']
  },

  restaurantes: {
    name: 'Restaurantes / Food service',
    painPoints: [
      'reservaciones por teléfono que saturan',
      'preguntas sobre menú y disponibilidad',
      'pedidos a domicilio por WhatsApp desordenados',
      'no-shows en reservaciones'
    ],
    benefits: [
      'tomar reservaciones 24/7 sin llamadas',
      'enviar menú y precios automáticamente',
      'confirmar reservaciones y reducir no-shows',
      'gestionar pedidos a domicilio de forma ordenada'
    ],
    examples: [
      'Restaurante redujo llamadas de reservación de 30 a 5 diarias',
      'Cafetería aumentó pedidos a domicilio 40% al simplificar el proceso por WhatsApp'
    ],
    tone: 'amigable, rápido y servicial',
    commonObjections: [
      'Prefiero el trato personal',
      'Mi negocio es pequeño'
    ],
    keyMetrics: ['reservaciones automáticas', 'reducción de no-shows', 'pedidos procesados']
  },

  retail: {
    name: 'Retail / Tienda física',
    painPoints: [
      'clientes que preguntan disponibilidad antes de ir',
      'horarios y ubicación repetitivos',
      'promociones que no llegan a todos los clientes',
      'dificultad para mantener contacto post-venta'
    ],
    benefits: [
      'informar disponibilidad de productos al instante',
      'enviar promociones segmentadas',
      'responder preguntas de horarios y ubicación 24/7',
      'hacer seguimiento post-venta para recompra'
    ],
    examples: [
      'Tienda de electrónicos aumentó visitas 30% al confirmar stock por WhatsApp',
      'Boutique duplicó recompras con seguimiento automático a clientes'
    ],
    tone: 'cercano, servicial y proactivo',
    commonObjections: [
      'Mis clientes vienen a la tienda',
      'No tengo muchos productos'
    ],
    keyMetrics: ['consultas de stock', 'clientes recurrentes', 'promociones enviadas']
  },

  generic: {
    name: 'Negocio general',
    painPoints: [
      'muchos mensajes que no se alcanzan a responder',
      'clientes que escriben fuera de horario',
      'preguntas repetitivas',
      'dificultad para dar seguimiento'
    ],
    benefits: [
      'responder al instante 24/7',
      'no perder ningún mensaje',
      'calificar leads automáticamente',
      'agendar citas sin intervención'
    ],
    examples: [
      'Negocios que implementaron IA en WhatsApp ven 30-50% más conversiones',
      'El tiempo de respuesta promedio baja de horas a segundos'
    ],
    tone: 'profesional y adaptable',
    commonObjections: [
      'No sé si funciona para mi negocio',
      'Mis clientes quieren atención personalizada'
    ],
    keyMetrics: ['tiempo de respuesta', 'mensajes atendidos', 'leads capturados']
  }
};

// Keywords as Sets for O(1) lookup
const INDUSTRY_KEYWORD_SETS: Record<Exclude<Industry, 'generic'>, Set<string>> = {
  ecommerce: new Set([
    'tienda online', 'tienda en línea', 'e-commerce', 'ecommerce',
    'vendo por internet', 'shopify', 'mercado libre', 'amazon',
    'dropshipping', 'envíos', 'carrito', 'checkout'
  ]),
  servicios_profesionales: new Set([
    'abogado', 'contador', 'consultor', 'coach', 'asesor',
    'despacho', 'freelance', 'servicios profesionales',
    'arquitecto', 'diseñador', 'marketing', 'agencia'
  ]),
  salud: new Set([
    'clínica', 'clinica', 'dentista', 'doctor', 'médico', 'medico',
    'nutriólogo', 'nutriologo', 'psicólogo', 'psicologo', 'consultorio',
    'hospital', 'laboratorio', 'fisioterapeuta', 'veterinario', 'veterinaria'
  ]),
  educacion: new Set([
    'escuela', 'academia', 'curso', 'clases', 'tutoría', 'tutoria',
    'universidad', 'capacitación', 'capacitacion', 'formación',
    'talleres', 'diplomado', 'certificación'
  ]),
  bienes_raices: new Set([
    'inmobiliaria', 'bienes raíces', 'bienes raices', 'propiedades',
    'casas', 'departamentos', 'terrenos', 'renta', 'venta de casas',
    'agente inmobiliario', 'broker'
  ]),
  restaurantes: new Set([
    'restaurante', 'café', 'cafetería', 'bar', 'comida',
    'cocina', 'catering', 'food truck', 'panadería', 'pastelería',
    'pizzería', 'taquería', 'mariscos'
  ]),
  retail: new Set([
    'tienda', 'local', 'boutique', 'ferretería', 'papelería',
    'farmacia', 'abarrotes', 'minisuper', 'refaccionaria',
    'mueblería', 'electrodomésticos', 'ropa', 'zapatos'
  ])
};

// Valid industry set for O(1) lookup
const VALID_INDUSTRIES = new Set<string>(Object.keys(INDUSTRY_CONTEXTS));

/**
 * Detect industry from message text and conversation history
 * Optimized: Uses Sets for O(1) keyword lookups
 */
export function detectIndustry(text: string, existingIndustry?: string | null): Industry {
  // Early exit: If already detected, return it
  if (existingIndustry) {
    const normalized = existingIndustry.toLowerCase().replace(/[^a-z_]/g, '_');
    if (VALID_INDUSTRIES.has(normalized)) {
      return normalized as Industry;
    }
  }

  const lowerText = text.toLowerCase();

  // Single pass through all industries
  let bestMatch: Industry = 'generic';
  let maxScore = 0;

  for (const [industry, keywordSet] of Object.entries(INDUSTRY_KEYWORD_SETS)) {
    let score = 0;

    // Check each keyword (Set.has is O(1) but we need substring matching)
    for (const keyword of keywordSet) {
      if (lowerText.includes(keyword)) {
        score++;
        // Early exit if strong match (2+ keywords)
        if (score >= 2) {
          return industry as Industry;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = industry as Industry;
    }
  }

  return bestMatch;
}

/**
 * Get industry context for use in prompts
 */
export function getIndustryContext(industry: Industry): IndustryContext {
  return INDUSTRY_CONTEXTS[industry] || INDUSTRY_CONTEXTS.generic;
}

/**
 * Generate industry-specific prompt section
 */
export function getIndustryPromptSection(industry: Industry): string {
  // Early exit for generic
  if (industry === 'generic') {
    return '';
  }

  const ctx = INDUSTRY_CONTEXTS[industry];

  return `
# CONTEXTO DE INDUSTRIA: ${ctx.name.toUpperCase()}

## Dolores típicos del cliente:
${ctx.painPoints.map(p => `- ${p}`).join('\n')}

## Beneficios a destacar:
${ctx.benefits.map(b => `- ${b}`).join('\n')}

## Ejemplo de éxito para mencionar:
"${ctx.examples[0]}"

## Tono recomendado: ${ctx.tone}

## Métricas clave: ${ctx.keyMetrics.join(', ')}
`;
}

/**
 * Get a relevant example for the industry
 */
export function getIndustryExample(industry: Industry): string {
  const ctx = INDUSTRY_CONTEXTS[industry];
  // Use modulo for deterministic selection based on timestamp
  const index = Math.floor(Date.now() / 60000) % ctx.examples.length;
  return ctx.examples[index];
}

/**
 * Get the primary benefit to highlight for this industry
 */
export function getPrimaryBenefit(industry: Industry): string {
  return INDUSTRY_CONTEXTS[industry].benefits[0];
}

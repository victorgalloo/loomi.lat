/**
 * Few-Shot Dinámico - Venta de Loomi
 *
 * Selecciona ejemplos de conversaciones relevantes según el contexto actual.
 * Supports semantic selection via embeddings with keyword fallback.
 */

import { embedText, cosineSimilarity } from './embeddings';
import EXAMPLE_EMBEDDINGS from './few-shot-embeddings.json';

export interface ConversationExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

const EXAMPLES: ConversationExample[] = [
  // ============================================
  // LEAD NUEVO / PRIMER CONTACTO
  // ============================================
  {
    id: 'new_lead_ad',
    tags: ['hola', 'anuncio', 'vi', 'información', 'nuevo'],
    context: 'Lead nuevo que llega del anuncio de Meta',
    conversation: `Cliente: Hola, vi su anuncio
Lu: ¡Hola! Qué bueno que escribes. ¿Qué fue lo que te llamó la atención de Loomi?
Cliente: Lo de automatizar WhatsApp
Lu: Ah genial. Cuéntame, ¿cómo manejan WhatsApp hoy? ¿Tienes vendedores o lo atiendes tú?
Cliente: Lo atiendo yo pero ya no doy abasto
Lu: Te entiendo perfecto. ¿Cuántos mensajes recibes al día más o menos?`,
    whyItWorked: 'Saludó cálido, preguntó qué le interesó, y empezó a descubrir el dolor'
  },

  {
    id: 'new_lead_curious',
    tags: ['hola', 'qué es', 'cómo funciona', 'nuevo'],
    context: 'Lead curioso preguntando qué es Loomi',
    conversation: `Cliente: Hola, ¿qué es exactamente Loomi?
Lu: ¡Hola! Loomi es un agente de IA que atiende tu WhatsApp 24/7. No es un bot de flujos - realmente entiende lo que escriben y responde como un vendedor humano. ¿Usas WhatsApp para ventas?
Cliente: Sí, vendemos cursos online
Lu: Perfecto. ¿Cuántos mensajes reciben al día? ¿Dan abasto?`,
    whyItWorked: 'Explicó el producto simple y rápido, luego preguntó para calificar'
  },

  // ============================================
  // PREGUNTAS DE PRECIO
  // ============================================
  {
    id: 'price_question',
    tags: ['precio', 'cuánto', 'cuesta', 'planes', 'costo'],
    context: 'Lead preguntando directamente por precio',
    conversation: `Cliente: ¿Cuánto cuesta?
Lu: Depende del volumen. El plan Starter es $199/mes para 100 mensajes/día. ¿Cuántos mensajes reciben ustedes?
Cliente: Como 80 al día
Lu: Ok, con Starter irías bien. Incluye el agente IA, integración con Cal.com para agendar, y atención 24/7. ¿Cómo los atienden hoy?
Cliente: Tenemos una persona pero no da abasto
Lu: Ah ok. Una persona cuesta fácil $800-1,500/mes y solo trabaja 8 horas. Loomi $199 y trabaja 24/7. ¿Te late que te muestre cómo funciona?`,
    whyItWorked: 'Dio precio rápido, calificó volumen, y mostró el ROI vs vendedor humano'
  },

  {
    id: 'price_expensive',
    tags: ['caro', 'presupuesto', 'mucho', 'no tengo'],
    context: 'Lead dice que está caro',
    conversation: `Cliente: $199 está caro para nosotros
Lu: Entiendo. ¿Cuánto pagas hoy por atender WhatsApp?
Cliente: Nada, lo hago yo
Lu: ¿Y cuántas horas al día le dedicas?
Cliente: Como 3-4 horas
Lu: Ok, si tu hora vale aunque sea $10 USD, son $30-40 al día. Al mes son $600-800. Loomi te ahorra ese tiempo por $199. ¿Tiene sentido?
Cliente: Viéndolo así sí
Lu: Y además atiende 24/7. Los mensajes de madrugada o fines de semana, ¿quién los contesta hoy?`,
    whyItWorked: 'No defendió el precio, hizo que el cliente calculara su propio costo'
  },

  // ============================================
  // COMPETENCIA (Wati, ManyChat, Leadsales)
  // ============================================
  {
    id: 'has_wati',
    tags: ['wati', 'manychat', 'leadsales', 'ya uso', 'ya tengo', 'bot'],
    context: 'Lead que ya usa un competidor',
    conversation: `Cliente: Ya usamos Wati
Lu: Ah ok. ¿Cómo te va? ¿El bot responde bien cuando preguntan algo fuera del menú?
Cliente: La verdad a veces se traba
Lu: Sí, ese es el tema. Wati son flujos - si el cliente pregunta algo que no está en el árbol, se rompe. Loomi usa IA real, entiende el contexto. ¿Cuántos leads crees que pierdes cuando el bot no sabe qué responder?
Cliente: Varios, la verdad
Lu: ¿Te muestro la diferencia? En 15 min ves cómo Loomi maneja preguntas fuera de script.`,
    whyItWorked: 'No tiró a la competencia, preguntó por su experiencia y mostró el diferenciador'
  },

  {
    id: 'comparing_options',
    tags: ['comparar', 'diferencia', 'mejor', 'vs', 'opciones'],
    context: 'Lead comparando opciones',
    conversation: `Cliente: ¿Qué diferencia hay con otros chatbots?
Lu: La diferencia principal es que Loomi no es un chatbot de flujos. Los chatbots normales siguen un árbol: "Si dice A, responde B". Si el cliente pregunta algo fuera del menú, se traba. Loomi usa GPT-4, realmente ENTIENDE lo que escriben. Además detecta si alguien está frustrado y cambia el tono.
Cliente: Suena interesante
Lu: ¿Qué tipo de negocio tienes? Te cuento cómo funcionaría para ti.`,
    whyItWorked: 'Explicó el diferenciador técnico de forma simple y ofreció personalizar'
  },

  // ============================================
  // ESCEPTICISMO / NO CONFÍA EN IA
  // ============================================
  {
    id: 'skeptic_bots',
    tags: ['no sirve', 'no confío', 'bots', 'mal', 'robótico'],
    context: 'Lead escéptico de bots/IA',
    conversation: `Cliente: La neta los bots no sirven, responden muy robótico
Lu: Tienes razón, la mayoría son malísimos. ¿Has usado alguno?
Cliente: Sí, y los clientes se desesperan
Lu: Esos son bots de flujos, van siguiendo un script. Loomi es diferente - usa IA real que entiende contexto. Lee el tono del cliente, si está molesto cambia cómo responde. Y si de plano no puede resolver algo, escala a un humano automáticamente.
Cliente: ¿Y cómo sé que no va a espantar a mis clientes?
Lu: Te ofrezco 14 días de prueba gratis, sin tarjeta. Lo pruebas, ves cómo responde, y si no te convence lo cancelas sin costo. ¿Te late?`,
    whyItWorked: 'Validó la preocupación, explicó la diferencia técnica, ofreció prueba sin riesgo'
  },

  // ============================================
  // BAJO VOLUMEN / NO ES BUEN FIT
  // ============================================
  {
    id: 'low_volume',
    tags: ['pocos', 'poco', 'mensajes', '10', '15', '20'],
    context: 'Lead con bajo volumen de mensajes',
    conversation: `Cliente: Recibimos como 15 mensajes al día
Lu: La neta, con 15 mensajes al día Loomi puede no valer la pena todavía. El ROI empieza a hacer sentido arriba de 40-50 mensajes. ¿Crees que el volumen va a crecer?
Cliente: Estamos empezando a invertir en Meta Ads
Lu: Ah ok, si van a meter ads el volumen va a subir rápido. ¿Te parece si hablamos cuando estén recibiendo más mensajes? O si quieres te muestro una demo para que lo tengas en el radar.`,
    whyItWorked: 'Fue honesta sobre el fit, no forzó la venta, dejó la puerta abierta'
  },

  // ============================================
  // LO PIENSO / DESPUÉS
  // ============================================
  {
    id: 'think_about_it',
    tags: ['pienso', 'pensar', 'después', 'luego', 'no sé'],
    context: 'Lead quiere postergar',
    conversation: `Cliente: Déjame pensarlo
Lu: Va, sin presión. ¿Qué es lo que te hace dudar?
Cliente: No sé si realmente lo necesito
Lu: Entiendo. ¿Cuántos mensajes de WhatsApp pierdes o tardas en contestar hoy?
Cliente: La verdad varios, sobre todo en la noche
Lu: ¿Y esos mensajes nocturnos, qué porcentaje se convierten en venta?
Cliente: Pocos porque cuando contesto ya compraron en otro lado
Lu: Ese es exactamente el problema que resuelve Loomi. Pero tú decides, si quieres ver una demo sin compromiso para tener más info, aquí ando.`,
    whyItWorked: 'No presionó, descubrió el dolor real, ofreció demo como paso intermedio'
  },

  // ============================================
  // RECHAZO - PRIMER NO → SONDEO
  // ============================================
  {
    id: 'first_rejection_probe',
    tags: ['no me interesa', 'no gracias', 'rechazo', 'no quiero'],
    context: 'Lead dice que no le interesa por primera vez',
    conversation: `Cliente: No me interesa, gracias
Lu: Entiendo, sin presión. ¿Me permites una pregunta? ¿Es porque ya resolviste lo de WhatsApp o es que no es prioridad ahorita?
Cliente: Es que ahorita tenemos otras prioridades
Lu: Totalmente válido. Si en algún momento WhatsApp se vuelve un dolor, aquí estamos. ¿Te parece si te escribo en un par de semanas por si cambia?`,
    whyItWorked: 'No insistió con el producto, hizo una pregunta genuina para entender el no'
  },

  {
    id: 'second_rejection_respect',
    tags: ['no me interesa', 'no gracias', 'rechazo', 'no quiero', 'ya dije que no'],
    context: 'Lead dice que no por segunda vez (ya se hizo sondeo)',
    conversation: `Cliente: No, de verdad no me interesa
Lu: Perfecto, respeto tu decisión. Gracias por tu tiempo, [NOMBRE]. Si en algún momento necesitas automatizar WhatsApp, aquí andamos. ¡Éxito!`,
    whyItWorked: 'Respetó el segundo no sin insistir, cerró con gracia y dejó la puerta abierta'
  },

  // ============================================
  // LISTO PARA DEMO
  // ============================================
  {
    id: 'wants_demo',
    tags: ['demo', 'mostrar', 'ver', 'funciona', 'probar'],
    context: 'Lead interesado en ver el producto',
    conversation: `Cliente: Me interesa, ¿me puedes mostrar cómo funciona?
Lu: ¡Claro! Te puedo hacer una demo de 15 minutos donde te muestro cómo se configura y cómo responde. ¿Te va mejor mañana o pasado?
Cliente: Mañana en la tarde
Lu: Perfecto. Te mando el link para que elijas el horario que te acomode.`,
    whyItWorked: 'Respondió rápido al interés, ofreció opciones concretas, no complicó'
  },

  // ============================================
  // LISTO PARA COMPRAR
  // ============================================
  {
    id: 'ready_to_buy',
    tags: ['quiero', 'contratar', 'activar', 'empezar', 'comprar'],
    context: 'Lead listo para comprar',
    conversation: `Cliente: Ok me convence, ¿cómo le hago?
Lu: Perfecto. ¿Con qué plan quieres empezar? Starter ($199/mes), Growth ($349/mes) o Business ($599/mes)?
Cliente: El Starter para empezar
Lu: Va. Te mando el link de pago. ¿A qué correo te lo envío?
Cliente: juan@miempresa.com
Lu: Listo, te lo envío ahora. En cuanto pagues, en menos de 24 horas está activo tu agente. ¿Alguna duda?`,
    whyItWorked: 'No complicó, preguntó plan, pidió email, y cerró limpio'
  },

  // ============================================
  // PREGUNTAS TÉCNICAS
  // ============================================
  {
    id: 'technical_integration',
    tags: ['integra', 'api', 'crm', 'conectar', 'técnico'],
    context: 'Lead con preguntas técnicas',
    conversation: `Cliente: ¿Se integra con mi CRM?
Lu: Depende cuál uses. Loomi tiene CRM propio con pipeline Kanban incluido. Si usas HubSpot, tenemos integración nativa. ¿Cuál CRM usan?
Cliente: Tenemos uno interno
Lu: Ok, en ese caso el plan Business incluye acceso a API para que lo conecten. O pueden usar el CRM de Loomi directamente. ¿Qué es lo principal que necesitan del CRM?`,
    whyItWorked: 'Respondió concreto, ofreció opciones, preguntó para entender la necesidad real'
  },

  // ============================================
  // INDUSTRIAS ESPECÍFICAS
  // ============================================
  {
    id: 'ecommerce',
    tags: ['tienda', 'ecommerce', 'productos', 'vendo'],
    context: 'Tienda online / ecommerce',
    conversation: `Cliente: Tenemos una tienda de ropa online
Lu: Genial. ¿La mayoría de tus ventas vienen por WhatsApp o por la web directa?
Cliente: Mucho WhatsApp, la gente pregunta tallas, colores, envío...
Lu: Perfecto, ese es el caso ideal para Loomi. Puede responder sobre productos, tallas, tiempos de envío, todo automático. ¿Cuántos mensajes reciben al día?`,
    whyItWorked: 'Entendió el caso de uso específico y conectó con el valor de Loomi'
  },

  {
    id: 'services',
    tags: ['servicios', 'consultoría', 'agencia', 'citas'],
    context: 'Negocio de servicios / citas',
    conversation: `Cliente: Somos una clínica dental
Lu: Ah perfecto. ¿La mayoría de sus citas las agendan por WhatsApp?
Cliente: Sí, y es un relajo porque la recepcionista no da abasto
Lu: Ese es el caso perfecto. Loomi puede calificar pacientes, responder dudas de precios, y agendar citas directo en tu calendario. Una clínica que usa Loomi bajó sus no-shows de 35% a 8% porque el agente manda recordatorios automáticos.
Cliente: Eso me interesa mucho
Lu: ¿Te muestro cómo funcionaría para tu clínica? Tengo espacio mañana para una demo.`,
    whyItWorked: 'Conectó con caso de uso específico (citas), mencionó resultado de cliente similar'
  },
];

/**
 * Detecta tags relevantes en el mensaje y contexto
 */
function detectTags(message: string, recentMessages: string[]): string[] {
  const allText = [message, ...recentMessages].join(' ').toLowerCase();
  const detectedTags: Set<string> = new Set();

  const keywordMap: Record<string, string[]> = {
    // Nuevo / Primer contacto
    'hola': ['hola', 'nuevo'],
    'anuncio': ['anuncio', 'nuevo'],
    'vi su': ['anuncio', 'nuevo'],
    'qué es': ['qué es', 'nuevo'],
    'cómo funciona': ['cómo funciona', 'nuevo'],

    // Precio
    'precio': ['precio', 'cuánto'],
    'cuánto': ['cuánto', 'precio'],
    'cuanto': ['cuánto', 'precio'],
    'cuesta': ['cuesta', 'precio'],
    'costo': ['costo', 'precio'],
    'planes': ['planes', 'precio'],
    'caro': ['caro', 'presupuesto'],
    'presupuesto': ['presupuesto', 'caro'],
    'no tengo': ['no tengo', 'caro'],

    // Competencia
    'wati': ['wati', 'ya tengo'],
    'manychat': ['manychat', 'ya tengo'],
    'leadsales': ['leadsales', 'ya tengo'],
    'ya uso': ['ya tengo', 'bot'],
    'ya tengo': ['ya tengo', 'bot'],
    'chatbot': ['bot', 'ya tengo'],

    // Escepticismo
    'no sirve': ['no sirve', 'no confío'],
    'no confío': ['no confío', 'bots'],
    'robótico': ['robótico', 'bots'],
    'no funciona': ['no sirve', 'bots'],

    // Bajo volumen
    'pocos mensajes': ['pocos', 'mensajes'],
    '10 mensajes': ['pocos', 'mensajes'],
    '15 mensajes': ['pocos', 'mensajes'],
    '20 mensajes': ['pocos', 'mensajes'],

    // Rechazo
    'no me interesa': ['no me interesa', 'rechazo'],
    'no gracias': ['no gracias', 'rechazo'],
    'no quiero': ['no quiero', 'rechazo'],
    'ya dije que no': ['ya dije que no', 'rechazo'],
    'no necesito': ['no me interesa', 'rechazo'],

    // Postergar
    'pienso': ['pienso', 'pensar'],
    'pensar': ['pensar', 'pienso'],
    'después': ['después', 'luego'],
    'luego': ['luego', 'después'],
    'no sé': ['no sé', 'pienso'],

    // Demo
    'demo': ['demo', 'ver'],
    'mostrar': ['mostrar', 'demo'],
    'ver cómo': ['ver', 'demo'],
    'probar': ['probar', 'demo'],

    // Comprar
    'quiero': ['quiero', 'contratar'],
    'contratar': ['contratar', 'comprar'],
    'activar': ['activar', 'contratar'],
    'empezar': ['empezar', 'contratar'],

    // Técnico
    'integra': ['integra', 'api'],
    'api': ['api', 'técnico'],
    'crm': ['crm', 'integra'],
    'conectar': ['conectar', 'integra'],

    // Industrias
    'tienda': ['tienda', 'ecommerce'],
    'ecommerce': ['ecommerce', 'tienda'],
    'productos': ['productos', 'tienda'],
    'clínica': ['servicios', 'citas'],
    'consultorio': ['servicios', 'citas'],
    'citas': ['citas', 'servicios'],
    'agencia': ['agencia', 'servicios'],
  };

  for (const [keyword, tags] of Object.entries(keywordMap)) {
    if (allText.includes(keyword)) {
      tags.forEach(tag => detectedTags.add(tag));
    }
  }

  return Array.from(detectedTags);
}

/**
 * Selecciona los mejores ejemplos según los tags detectados
 */
function selectExamples(tags: string[], maxExamples: number = 2): ConversationExample[] {
  if (tags.length === 0) return [];

  const scored = EXAMPLES.map(example => {
    const matchCount = example.tags.filter(tag => tags.includes(tag)).length;
    return { example, score: matchCount };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExamples)
    .map(s => s.example);
}

/**
 * Formatea los ejemplos para incluir en el prompt
 */
function formatExamples(examples: ConversationExample[]): string {
  if (examples.length === 0) return '';

  const formatted = examples.map(ex => `
### Ejemplo: ${ex.context}
${ex.conversation}

**Por qué funcionó:** ${ex.whyItWorked}
`).join('\n');

  return `
# EJEMPLOS RELEVANTES - IMITA ESTE ESTILO
${formatted}
`;
}

/**
 * Select examples using cosine similarity with pre-computed embeddings
 */
async function selectExamplesSemantic(
  message: string,
  recentMessages: string[],
  max: number = 2
): Promise<ConversationExample[]> {
  const contextText = [message, ...recentMessages.slice(-2)].join(' ');
  const msgEmbedding = await embedText(contextText);

  const scored = EXAMPLE_EMBEDDINGS.map(({ id, embedding }) => ({
    id,
    score: cosineSimilarity(msgEmbedding, embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topMatches = scored.filter(s => s.score >= 0.3).slice(0, max);
  if (topMatches.length === 0) return [];

  const matchIds = new Set(topMatches.map(s => s.id));
  return EXAMPLES.filter(ex => matchIds.has(ex.id));
}

/**
 * Genera el contexto de few-shot basado en la conversación actual
 * Uses semantic matching via embeddings, with keyword fallback
 */
export async function getFewShotContext(
  currentMessage: string,
  recentMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .slice(-5);

  // Try semantic matching first
  try {
    const examples = await selectExamplesSemantic(currentMessage, userMessages, 2);
    if (examples.length > 0) {
      console.log(`[Few-Shot] Semantic match: ${examples.map(e => e.id).join(', ')}`);
      return formatExamples(examples);
    }
  } catch (err) {
    // Silent fallback to keywords
    console.warn('[Few-Shot] Semantic matching failed, falling back to keywords:', err instanceof Error ? err.message : err);
  }

  // Keyword fallback
  const tags = detectTags(currentMessage, userMessages);
  if (tags.length === 0) return '';

  const examples = selectExamples(tags, 2);
  if (examples.length === 0) return '';

  console.log(`[Few-Shot] Keyword match: Tags: ${tags.join(', ')}, Examples: ${examples.map(e => e.id).join(', ')}`);

  return formatExamples(examples);
}

export function getExamplesByCategory(category: string): ConversationExample[] {
  const categoryTags: Record<string, string[]> = {
    'price': ['precio', 'caro'],
    'competition': ['wati', 'ya tengo'],
    'skeptic': ['no confío', 'bots'],
    'postpone': ['pienso', 'después'],
    'demo': ['demo', 'ver'],
    'buy': ['quiero', 'contratar'],
  };

  const tags = categoryTags[category] || [];
  return selectExamples(tags, 3);
}

/**
 * Selects best examples from tenant-provided examples based on detected tags
 */
function selectExamplesFromTenant(
  tags: string[],
  tenantExamples: ConversationExample[],
  maxExamples: number = 2
): ConversationExample[] {
  if (tags.length === 0 || tenantExamples.length === 0) return [];

  const scored = tenantExamples.map(example => {
    const matchCount = example.tags.filter(tag => tags.includes(tag)).length;
    return { example, score: matchCount };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExamples)
    .map(s => s.example);
}

/**
 * Generates few-shot context from tenant-provided examples
 */
export function getFewShotContextFromTenant(
  currentMessage: string,
  recentMessages: Array<{ role: string; content: string }>,
  tenantExamples: ConversationExample[]
): string {
  if (!tenantExamples || tenantExamples.length === 0) return '';

  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .slice(-5);

  const tags = detectTags(currentMessage, userMessages);
  if (tags.length === 0) return '';

  const examples = selectExamplesFromTenant(tags, tenantExamples, 2);
  if (examples.length === 0) return '';

  console.log(`[Few-Shot Tenant] Tags: ${tags.join(', ')}, Examples: ${examples.map(e => e.id).join(', ')}`);

  return formatExamples(examples);
}

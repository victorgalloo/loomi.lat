/**
 * Few-Shot Dinámico
 *
 * Selecciona ejemplos de conversaciones relevantes según el contexto actual.
 * Esto mejora dramáticamente la calidad de las respuestas.
 */

export interface ConversationExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

// Banco de ejemplos de conversaciones exitosas
const EXAMPLES: ConversationExample[] = [
  // ============================================
  // OBJECIONES DE PRECIO
  // ============================================
  {
    id: 'price_objection_1',
    tags: ['precio', 'caro', 'presupuesto', 'no tengo', 'muy caro'],
    context: 'Prospecto dice que está caro o no tiene presupuesto',
    conversation: `Cliente: Es muy caro para mí
Sofi: Entiendo. ¿Cuánto es tu comisión promedio por póliza?
Cliente: Como 3,000 pesos
Sofi: Entonces si el bot te ayuda a cerrar 1 póliza extra al mes, ya recuperaste la inversión 3 veces. ¿Qué te frena más, el precio o no estar seguro de que funcione?`,
    whyItWorked: 'Conectó el precio con el ROI inmediato usando sus propios números'
  },
  {
    id: 'price_objection_2',
    tags: ['precio', 'barato', 'descuento', 'promoción'],
    context: 'Prospecto pide descuento o precio especial',
    conversation: `Cliente: ¿No tienen algún descuento?
Sofi: Mira, el precio ya está ajustado porque sabemos que los agentes independientes no tienen presupuestos enormes. La pregunta es: ¿cuántos prospectos se te van al mes por no contestar rápido?
Cliente: Pues sí, varios
Sofi: Si son 5 al mes y cierras 1 extra con el bot, el descuento te lo das tú solo con las comisiones. ¿Agendamos para que veas cómo funciona?`,
    whyItWorked: 'Reencuadró el descuento como ROI en vez de pelear por precio'
  },

  // ============================================
  // OBJECIONES DE CONFIANZA / ESCEPTICISMO
  // ============================================
  {
    id: 'skeptic_chatbots',
    tags: ['chatbot', 'bot', 'no sirve', 'probé', 'no funciona', 'genérico'],
    context: 'Prospecto tuvo mala experiencia con chatbots',
    conversation: `Cliente: Ya probé chatbots y no sirven para seguros
Sofi: ¿Qué pasó con el anterior?
Cliente: Respondía muy genérico y los clientes se frustraban
Sofi: Tiene sentido. Esos bots genéricos no entienden que vender un GMM es distinto a vender zapatos. Este está entrenado específicamente para seguros: sabe preguntar por preexistencias, dependientes, sumas aseguradas. ¿Te late ver la diferencia en una demo de 15 min?`,
    whyItWorked: 'Validó la experiencia negativa y diferenció el producto'
  },
  {
    id: 'skeptic_personal',
    tags: ['personal', 'humano', 'trato', 'asesoría', 'confianza'],
    context: 'Prospecto cree que sus clientes necesitan trato humano',
    conversation: `Cliente: Mis clientes necesitan trato personal, no un robot
Sofi: 100% de acuerdo. La pregunta es: ¿qué pasa con los que te escriben a las 10pm o cuando estás en una cita?
Cliente: Pues les contesto después
Sofi: ¿Y cuántos de esos "después" se convierten en venta?
Cliente: La verdad pocos
Sofi: El bot no reemplaza tu asesoría, te consigue más oportunidades para darla. Tú sigues cerrando, pero con leads que ya vienen calificados. ¿Tiene sentido?`,
    whyItWorked: 'Usó pregunta incómoda para mostrar el costo de oportunidad'
  },

  // ============================================
  // SEGUROS DE VIDA ESPECÍFICO
  // ============================================
  {
    id: 'life_insurance_agent',
    tags: ['vida', 'seguro de vida', 'beneficiarios', 'fallecimiento'],
    context: 'Agente que vende seguros de vida',
    conversation: `Cliente: Vendo seguros de vida principalmente
Sofi: Qué bien. ¿Cómo calificas a tus prospectos ahorita? ¿Les preguntas edad, si fuman, esas cosas por WhatsApp?
Cliente: Sí, pero es un rollo porque hay que sacarles la info poco a poco
Sofi: Exacto. El bot puede hacer esas preguntas por ti: edad, si fuma, cuántos dependientes, suma asegurada que buscan. Cuando te llega el lead, ya sabes si es asegurable y qué producto ofrecerle. ¿Cuánto tiempo te ahorrarías?`,
    whyItWorked: 'Entendió el proceso específico de vida y mostró valor concreto'
  },

  // ============================================
  // GMM / GASTOS MÉDICOS
  // ============================================
  {
    id: 'gmm_agent',
    tags: ['gmm', 'gastos médicos', 'médicos mayores', 'salud', 'preexistencias'],
    context: 'Agente que vende GMM',
    conversation: `Cliente: Manejo principalmente gastos médicos mayores
Sofi: GMM es donde más se pierde tiempo en la calificación, ¿no? Entre preexistencias, edad de dependientes, tipo de cobertura...
Cliente: Sí, a veces tardo días en armar una cotización porque me falta info
Sofi: El bot puede pedirle todo eso al prospecto antes de que tú intervengas: preexistencias, cuántos van en la póliza, edades, hospital preferido, deducible. Tú ya solo cotizas y cierras. ¿Cuántas cotizaciones pendientes tienes ahorita por falta de datos?`,
    whyItWorked: 'Identificó el cuello de botella específico de GMM'
  },

  // ============================================
  // VOLUMEN ALTO
  // ============================================
  {
    id: 'high_volume',
    tags: ['muchos', 'volumen', '30', '40', '50', 'mensajes', 'no doy abasto'],
    context: 'Agente con alto volumen de mensajes',
    conversation: `Cliente: Recibo como 50 mensajes al día y no doy abasto
Sofi: 50 al día es bastante. ¿Cuántos de esos son prospectos reales vs. gente que solo pregunta precio y desaparece?
Cliente: Como la mitad son serios
Sofi: Entonces 25 oportunidades reales al día. Si el bot filtra a los curiosos y te pasa solo los calificados, ¿cuántos más podrías cerrar al mes?
Cliente: Pues sí, varios más
Sofi: Va que va. ¿Agendamos 20 min para mostrarte cómo quedaría para tu volumen?`,
    whyItWorked: 'Cuantificó el impacto potencial con sus propios números'
  },

  // ============================================
  // PROMOTORÍA / AGENCIA
  // ============================================
  {
    id: 'agency',
    tags: ['promotoría', 'agencia', 'agentes', 'equipo', 'varios'],
    context: 'Promotoría o agencia con múltiples agentes',
    conversation: `Cliente: Tengo una promotoría con 6 agentes
Sofi: Órale. ¿Cada quien tiene su WhatsApp o tienen uno centralizado?
Cliente: Cada quien el suyo, es un desmadre
Sofi: Me imagino. El bot puede manejar un número centralizado que califique y distribuya: si el prospecto quiere vida, va con el agente de vida; si quiere GMM, va con el de salud. Todo automático. ¿Cuántos leads se les pierden entre los 6 por no saber quién debe atenderlo?`,
    whyItWorked: 'Entendió la complejidad de coordinar equipo y ofreció solución específica'
  },

  // ============================================
  // "LO PIENSO" / POSTERGAR
  // ============================================
  {
    id: 'think_about_it',
    tags: ['pienso', 'pensar', 'después', 'luego', 'no sé'],
    context: 'Prospecto quiere postergar la decisión',
    conversation: `Cliente: Déjame pensarlo
Sofi: Va, sin presión. Solo por curiosidad, ¿qué es lo que te hace dudar?
Cliente: Es que no sé si realmente lo necesito
Sofi: Honesto. A ver, ¿cuántos prospectos te escribieron la semana pasada que no pudiste atender a tiempo?
Cliente: Como 5 o 6
Sofi: ¿Y cuántos de esos cerraste?
Cliente: Ninguno la verdad
Sofi: Ahí está tu respuesta. Pero tú decides. Si quieres, agendamos para que lo veas funcionando y decides con más info. ¿Te late?`,
    whyItWorked: 'No presionó pero hizo preguntas que revelaron la necesidad'
  },

  // ============================================
  // YA TIENE ALGO
  // ============================================
  {
    id: 'already_has_something',
    tags: ['ya tengo', 'uso', 'crm', 'sistema', 'herramienta'],
    context: 'Prospecto ya usa alguna herramienta',
    conversation: `Cliente: Ya tengo un CRM para seguimiento
Sofi: Qué bien, ¿cuál usas?
Cliente: HubSpot
Sofi: Perfecto. El bot no reemplaza tu CRM, lo alimenta. La bronca del CRM es que tú tienes que meter los datos. El bot los captura automático y los manda a HubSpot ya calificados. ¿Cuánto tiempo te toma meter un lead nuevo al CRM ahorita?`,
    whyItWorked: 'Posicionó como complemento, no competencia'
  },

  // ============================================
  // REFERIDO
  // ============================================
  {
    id: 'referral',
    tags: ['recomendó', 'referido', 'me pasaron', 'me dieron tu número'],
    context: 'Lead llegó por referido',
    conversation: `Cliente: Me recomendó Juan Pérez tu servicio
Sofi: Ah qué bien, Juan es cliente. ¿Qué te contó?
Cliente: Que le ayudó mucho con las cotizaciones
Sofi: Sí, Juan maneja GMM y le ahorra como 3 horas al día en recopilación de datos. ¿Tú qué líneas manejas?
Cliente: También GMM y algo de vida
Sofi: Entonces te caería igual de bien. ¿Agendamos para mostrarte cómo lo tiene configurado Juan?`,
    whyItWorked: 'Usó la referencia como prueba social inmediata'
  },
];

/**
 * Detecta tags relevantes en el mensaje y contexto
 */
function detectTags(message: string, recentMessages: string[]): string[] {
  const allText = [message, ...recentMessages].join(' ').toLowerCase();
  const detectedTags: Set<string> = new Set();

  // Keywords to tags mapping
  const keywordMap: Record<string, string[]> = {
    // Precio
    'caro': ['precio', 'caro'],
    'precio': ['precio'],
    'cuesta': ['precio'],
    'presupuesto': ['precio', 'presupuesto'],
    'descuento': ['precio', 'descuento'],
    'barato': ['precio', 'barato'],

    // Escepticismo
    'chatbot': ['chatbot', 'bot'],
    'bot': ['chatbot', 'bot'],
    'no sirve': ['no sirve', 'no funciona'],
    'no funciona': ['no funciona'],
    'probé': ['probé'],
    'personal': ['personal', 'humano'],
    'humano': ['humano', 'personal'],

    // Productos
    'vida': ['vida', 'seguro de vida'],
    'gmm': ['gmm', 'gastos médicos'],
    'gastos médicos': ['gmm', 'gastos médicos'],
    'médicos mayores': ['gmm', 'gastos médicos'],
    'pensiones': ['pensiones', 'retiro'],
    'retiro': ['pensiones', 'retiro'],
    'ahorro': ['ahorro'],

    // Volumen
    'mensajes': ['mensajes', 'volumen'],
    'no doy abasto': ['no doy abasto', 'volumen'],
    '30': ['volumen'],
    '40': ['volumen'],
    '50': ['volumen'],
    'muchos': ['muchos', 'volumen'],

    // Estructura
    'promotoría': ['promotoría', 'agencia'],
    'promotoria': ['promotoría', 'agencia'],
    'agencia': ['agencia', 'promotoría'],
    'agentes': ['agentes', 'equipo'],
    'equipo': ['equipo'],

    // Postergar
    'pienso': ['pienso', 'pensar'],
    'pensar': ['pensar', 'pienso'],
    'después': ['después', 'luego'],
    'luego': ['luego', 'después'],

    // Ya tiene algo
    'ya tengo': ['ya tengo', 'uso'],
    'ya uso': ['ya tengo', 'uso'],
    'crm': ['crm', 'sistema'],

    // Referido
    'recomendó': ['recomendó', 'referido'],
    'recomendo': ['recomendó', 'referido'],
    'referido': ['referido'],
    'me pasaron': ['referido'],
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

  // Score each example by tag matches
  const scored = EXAMPLES.map(example => {
    const matchCount = example.tags.filter(tag => tags.includes(tag)).length;
    return { example, score: matchCount };
  });

  // Sort by score descending and take top N
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
# EJEMPLOS RELEVANTES PARA ESTA CONVERSACIÓN
Imita este estilo y estrategia:
${formatted}
`;
}

/**
 * Genera el contexto de few-shot basado en la conversación actual
 */
export function getFewShotContext(
  currentMessage: string,
  recentMessages: Array<{ role: string; content: string }>
): string {
  // Extract recent user messages for context
  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .slice(-5);

  // Detect relevant tags
  const tags = detectTags(currentMessage, userMessages);

  if (tags.length === 0) return '';

  // Select best examples
  const examples = selectExamples(tags, 2);

  if (examples.length === 0) return '';

  console.log(`[Few-Shot] Detected tags: ${tags.join(', ')}`);
  console.log(`[Few-Shot] Selected examples: ${examples.map(e => e.id).join(', ')}`);

  return formatExamples(examples);
}

/**
 * Obtiene ejemplos específicos por categoría
 */
export function getExamplesByCategory(category: string): ConversationExample[] {
  const categoryTags: Record<string, string[]> = {
    'price': ['precio', 'caro', 'presupuesto'],
    'skeptic': ['chatbot', 'no funciona', 'personal'],
    'life': ['vida', 'seguro de vida'],
    'gmm': ['gmm', 'gastos médicos'],
    'volume': ['volumen', 'mensajes', 'no doy abasto'],
    'agency': ['promotoría', 'agencia', 'equipo'],
    'postpone': ['pienso', 'después', 'luego'],
  };

  const tags = categoryTags[category] || [];
  return selectExamples(tags, 3);
}

/**
 * Few-Shot Dinámico - Venta de Seguros a Clientes
 *
 * Selecciona ejemplos de conversaciones relevantes según el contexto actual.
 */

export interface ConversationExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

const EXAMPLES: ConversationExample[] = [
  // ============================================
  // LEAD NUEVO / PRIMER CONTACTO (desde anuncio Meta)
  // ============================================
  {
    id: 'new_lead_warm',
    tags: ['hola', 'anuncio', 'vi', 'información'],
    context: 'Lead nuevo que llega del anuncio de Meta',
    conversation: `Cliente: Hola, vi su anuncio
Sofi: ¡Hola! Qué bueno que escribiste. Cuéntame, ¿qué fue lo que te llamó la atención?
Cliente: Lo de proteger a mi familia por $500 al mes
Sofi: Ah ok, sí es real ese precio. ¿Has pensado antes en un seguro de vida o es la primera vez que te interesa?
Cliente: Es la primera vez, nunca he tenido
Sofi: Entiendo. Y cuéntame, ¿tienes hijos o alguien que dependa de ti económicamente?
Cliente: Sí, tengo dos niños
Sofi: Ok, entonces sí tiene mucho sentido para ti. El seguro básicamente es esto: si te pasa algo, tu familia recibe una cantidad de dinero para salir adelante. ¿Te gustaría que te explique cómo funciona?`,
    whyItWorked: 'Empezó cálida, preguntó qué le llamó la atención, entendió su situación antes de vender'
  },

  {
    id: 'new_lead_price',
    tags: ['precio', 'cuanto', 'cuesta', 'real'],
    context: 'Lead preguntando si el precio es real',
    conversation: `Cliente: Vi su anuncio, ¿es real lo de $500 al mes?
Sofi: ¡Hola! Sí, es real. El precio exacto depende de tu edad, pero anda por ahí. ¿Qué fue lo que te hizo interesarte?
Cliente: Pues tengo familia y quiero dejarles algo por si me pasa algo
Sofi: Me parece muy bien que estés pensando en eso. ¿Cuántos años tienes?
Cliente: 34
Sofi: Ok, a esa edad el seguro te sale entre $480 y $550 al mes por un millón de pesos de cobertura. ¿Tienes hijos?`,
    whyItWorked: 'Confirmó precio pero también preguntó la motivación para conectar'
  },

  // ============================================
  // OBJECIÓN: NO CREO EN SEGUROS
  // ============================================
  {
    id: 'objection_no_trust',
    tags: ['no creo', 'no confío', 'no pagan', 'fraude', 'estafa'],
    context: 'Cliente escéptico de los seguros',
    conversation: `Cliente: La neta no creo mucho en los seguros, siento que nunca pagan
Sofi: ¿Por qué? ¿Mala experiencia o nomás no le ves el punto?
Cliente: Es que siempre tienen pretextos para no pagar
Sofi: Entiendo, hay muchas historias así. El tema de "no pagan" es real en seguros de gastos médicos donde hay letra chiquita. En vida es más simple: si te mueres, pagan. Punto. Solo hay 2 exclusiones: suicidio en el primer año y si mientes en el cuestionario de salud. ¿Tienes alguna enfermedad que no me hayas dicho?
Cliente: No, estoy sano
Sofi: Entonces no hay letra chiquita. ¿Tienes hijos?`,
    whyItWorked: 'No peleó, validó la preocupación y explicó las exclusiones reales'
  },

  // ============================================
  // OBJECIÓN: MUY CARO / NO TENGO
  // ============================================
  {
    id: 'objection_price',
    tags: ['caro', 'no tengo', 'presupuesto', 'mucho', 'apretado'],
    context: 'Cliente dice que está caro o no tiene dinero',
    conversation: `Cliente: Me interesa pero ahorita ando muy apretado
Sofi: Entiendo. ¿Cuánto es lo máximo que podrías pagar al mes sin que te duela?
Cliente: Como $300 a lo mucho
Sofi: Ok, con $300 te alcanza para una suma de $500,000. Es menos protección pero es mejor que nada. ¿Tienes deudas grandes? ¿Hipoteca, carro?
Cliente: Debo como $80,000 del carro
Sofi: Perfecto, entonces los $500,000 cubren la deuda del carro y le quedan $420,000 para gastos. ¿Le entramos con eso y cuando mejore tu situación lo subimos?`,
    whyItWorked: 'Preguntó presupuesto real y ofreció opción ajustada'
  },

  // ============================================
  // JOVEN SIN HIJOS
  // ============================================
  {
    id: 'young_no_kids',
    tags: ['soltero', 'sin hijos', 'joven', '25', '27', '28'],
    context: 'Persona joven sin dependientes',
    conversation: `Cliente: Tengo 27 años, soltero, sin hijos. ¿Me conviene?
Sofi: Honestamente a tu edad el seguro de vida no es urgente. ¿Por qué te interesó?
Cliente: Mi papá falleció el año pasado y dejó un desmadre
Sofi: Lamento lo de tu papá. ¿Él no tenía seguro?
Cliente: No, nada
Sofi: Entiendo. A los 27 sin hijos, el seguro tiene sentido si ayudas económicamente a alguien. ¿Le das dinero a tus papás o hermanos?
Cliente: Sí, le doy $5,000 al mes a mi mamá
Sofi: Ok, si te pasa algo, tu mamá pierde esos $5,000/mes. Con un seguro de $600,000, ella tendría para cubrir 10 años de esa ayuda. Te sale como $380/mes. ¿Tiene sentido para ti?`,
    whyItWorked: 'No vendió por vender, validó si tenía sentido y encontró la motivación real'
  },

  // ============================================
  // YA TENGO SEGURO DEL TRABAJO
  // ============================================
  {
    id: 'has_work_insurance',
    tags: ['trabajo', 'empresa', 'ya tengo', 'prestación'],
    context: 'Cliente que tiene seguro por su empleo',
    conversation: `Cliente: Ya tengo seguro de vida por mi trabajo
Sofi: Ah qué bien. ¿Sabes de cuánto es?
Cliente: Creo que como 2 años de sueldo
Sofi: Ok, ¿y qué pasa si cambias de trabajo o te corren?
Cliente: Pues... se acaba supongo
Sofi: Exacto. El seguro del trabajo es temporal. El día que salgas, quedas descubierto. ¿Cuántos años tienes?
Cliente: 36
Sofi: Si te corren a los 45 y ya tienes diabetes o algo, va a ser carísimo conseguir seguro. El chiste de tener uno propio es que te lo llevas a donde vayas. Además, 2 años de sueldo no es mucho si tienes hipoteca e hijos. ¿Tienes?`,
    whyItWorked: 'No dijo que el seguro del trabajo no sirve, mostró el riesgo futuro'
  },

  // ============================================
  // FOLLOW UP A FANTASMA
  // ============================================
  {
    id: 'follow_up_ghost',
    tags: ['no responde', 'fantasma', 'seguimiento'],
    context: 'Lead que dejó de responder',
    conversation: `[Día 1]
Cliente: ¿Cuánto cuesta el seguro de vida?
Sofi: Depende de tu edad. ¿Cuántos años tienes?
Cliente: 41
[No responde]

[Día 3]
Sofi: Oye, ¿sigues interesado o te caché en mal momento?
[No responde]

[Día 5]
Sofi: Última vez que te molesto. Para alguien de 41 no fumador, el seguro sale en $590/mes por $1 millón. Si te interesa, aquí ando. Si no, no hay bronca.
Cliente: Perdón, se me fue. Sí me interesa, ¿qué necesitas?
Sofi: Tranqui. Necesito nombre completo, fecha de nacimiento, y si tienes alguna enfermedad crónica. Y me dices quién sería tu beneficiario.`,
    whyItWorked: 'Follow-up espaciado, no acosó, dio precio concreto, ofreció salida'
  },

  // ============================================
  // COMPARANDO CON COMPETENCIA
  // ============================================
  {
    id: 'comparing_competitor',
    tags: ['gnp', 'metlife', 'cotización', 'comparar', 'otra'],
    context: 'Cliente comparando con otra aseguradora',
    conversation: `Cliente: Ya me cotizaron en GNP $800/mes, ¿ustedes qué ofrecen?
Sofi: ¿Por cuánto te cotizaron? ¿Suma asegurada?
Cliente: $1.5 millones
Sofi: Ok. ¿Qué edad tienes y fumas?
Cliente: 38, no fumo
Sofi: Para $1.5 millones te puedo conseguir entre $650 y $750 dependiendo la aseguradora. Te ahorras como $50-150 al mes. ¿Quieres que te cotice?
Cliente: Sí, a ver
Sofi: Dame 10 min y te paso opciones.`,
    whyItWorked: 'No tiró a la competencia, comparó manzanas con manzanas'
  },

  // ============================================
  // LO PIENSO / DESPUÉS
  // ============================================
  {
    id: 'think_about_it',
    tags: ['pienso', 'pensar', 'después', 'luego', 'no sé'],
    context: 'Cliente quiere postergar',
    conversation: `Cliente: Déjame pensarlo
Sofi: Va, sin presión. ¿Qué te hace dudar?
Cliente: Es que no sé si realmente lo necesito
Sofi: Honesto. ¿Tienes hijos?
Cliente: Sí, dos
Sofi: ¿Qué pasaría con ellos si mañana te atropellan? ¿Tu pareja puede mantener todo sola?
Cliente: Pues estaría difícil
Sofi: Ese es el único punto del seguro de vida. No es para ti, es para ellos. Pero tú decides. Si quieres lo dejamos aquí y si algún día te animas me escribes.`,
    whyItWorked: 'No presionó pero hizo la pregunta incómoda que revela la necesidad'
  },

  // ============================================
  // QUIERE CERRAR
  // ============================================
  {
    id: 'ready_to_close',
    tags: ['va', 'sí', 'quiero', 'contratar', 'activar', 'dale'],
    context: 'Cliente listo para comprar',
    conversation: `Cliente: Ok va, sí me interesa. ¿Qué necesitas?
Sofi: Perfecto. Necesito:
- Tu nombre completo
- Fecha de nacimiento
- ¿Tienes diabetes, hipertensión o alguna enfermedad crónica?
- ¿A quién pongo como beneficiario?
Cliente: Juan Pérez López, 15 marzo 1988, no tengo enfermedades, beneficiaria mi esposa María
Sofi: Listo Juan. Te mando el link de pago. Son $540/mes. En cuanto pagues, en 24 horas tienes tu póliza activa. ¿Va?`,
    whyItWorked: 'Proceso simple, pidió solo lo necesario, no complicó'
  },

  // ============================================
  // URUGUAY - BSE AHORRO + VIDA 65
  // ============================================
  {
    id: 'uruguay_new_lead',
    tags: ['hola', 'anuncio', 'uruguay', 'bse', 'dólar'],
    context: 'Lead de Uruguay preguntando por BSE',
    conversation: `Cliente: Hola, vi el anuncio del seguro del BSE
Sofi: ¡Hola! Qué bueno que escribiste. El BSE tiene un plan muy interesante, el Ahorro + Vida. ¿Qué fue lo que te llamó la atención?
Cliente: Me interesa que sea en dólares
Sofi: Sí, ese es uno de los beneficios. En dólares el precio y el capital no cambian durante toda la vigencia. ¿Cuántos años tenés?
Cliente: 35
Sofi: Perfecto. A los 35, por unos U$S 35 al mes tenés U$S 12,500 de cobertura. Incluye muerte accidental, invalidez, y hasta U$S 9,000 si te diagnostican cáncer. ¿Tenés hijos?`,
    whyItWorked: 'Usó vocabulario uruguayo (tenés, vos), explicó beneficio de dólares'
  },

  {
    id: 'uruguay_benefits',
    tags: ['cáncer', 'internación', 'bse', 'cobertura', 'incluye'],
    context: 'Cliente uruguayo preguntando por coberturas',
    conversation: `Cliente: ¿Qué cubre exactamente el seguro del BSE?
Sofi: El plan AHORRO + VIDA 65 cubre bastante:
- El capital que elijas si fallecés (va a tus beneficiarios)
- Lo mismo si quedás inválido por accidente
- U$S 50 por día si te internás (U$S 100 en CTI)
- U$S 9,000 si te diagnostican cáncer
- Y si quedás incapacitado, dejás de pagar pero mantenés todo
Cliente: ¿Y qué pasa con mi plata si no me pasa nada?
Sofi: Ahí está el diferencial. AHORRO + VIDA significa que al final del período, vos cobrás el ahorro acumulado. No es plata perdida, es protección + ahorro.`,
    whyItWorked: 'Explicó claramente todas las coberturas y el componente de ahorro'
  },

  {
    id: 'uruguay_price_question',
    tags: ['precio', 'cuanto', 'uruguay', 'dólares', 'mensual'],
    context: 'Cliente uruguayo preguntando precio',
    conversation: `Cliente: ¿Cuánto sale por mes?
Sofi: Depende de tu edad y cuánto querés de cobertura. ¿Cuántos años tenés?
Cliente: 40
Sofi: Ok, a los 40 te sale unos U$S 36 al mes por U$S 10,000 de cobertura. Si querés más cobertura, el precio sube proporcional. ¿Tenés idea de cuánto te gustaría tener de suma asegurada?
Cliente: ¿Cuánto recomendás?
Sofi: Depende de tu situación. ¿Tenés deudas? ¿Hipoteca? ¿Hijos? La regla general es que cubra al menos 2-3 años de tus ingresos para que tu familia pueda ajustarse.`,
    whyItWorked: 'Dio precio concreto y ayudó a dimensionar la cobertura'
  },
];

/**
 * Detecta tags relevantes en el mensaje y contexto
 */
function detectTags(message: string, recentMessages: string[]): string[] {
  const allText = [message, ...recentMessages].join(' ').toLowerCase();
  const detectedTags: Set<string> = new Set();

  const keywordMap: Record<string, string[]> = {
    // Precio
    'caro': ['caro', 'precio'],
    'precio': ['precio', 'cuanto'],
    'cuanto': ['cuanto', 'precio'],
    'cuesta': ['cuesta', 'precio'],
    'presupuesto': ['presupuesto', 'caro'],
    'apretado': ['apretado', 'caro'],
    'no tengo': ['no tengo', 'caro'],

    // Escepticismo
    'no creo': ['no creo', 'no confío'],
    'no pagan': ['no pagan', 'no creo'],
    'estafa': ['estafa', 'no creo'],
    'fraude': ['fraude', 'no creo'],

    // Ya tiene algo
    'ya tengo': ['ya tengo', 'trabajo'],
    'trabajo': ['trabajo', 'empresa'],
    'empresa': ['empresa', 'trabajo'],
    'prestación': ['prestación', 'trabajo'],

    // Joven
    'soltero': ['soltero', 'joven'],
    'sin hijos': ['sin hijos', 'joven'],

    // Postergar
    'pienso': ['pienso', 'pensar'],
    'pensar': ['pensar', 'pienso'],
    'después': ['después', 'luego'],
    'luego': ['luego', 'después'],

    // Comparar
    'gnp': ['gnp', 'comparar'],
    'metlife': ['metlife', 'comparar'],
    'cotización': ['cotización', 'comparar'],

    // Cerrar
    'quiero': ['quiero', 'contratar'],
    'contratar': ['contratar', 'activar'],
    'dale': ['dale', 'va'],

    // Nuevo
    'hola': ['hola', 'anuncio'],
    'anuncio': ['anuncio', 'hola'],

    // Uruguay / BSE
    'uruguay': ['uruguay', 'bse', 'dólar'],
    'bse': ['bse', 'uruguay'],
    'dólar': ['dólar', 'uruguay'],
    'dólares': ['dólares', 'uruguay'],
    'cáncer': ['cáncer', 'cobertura'],
    'internación': ['internación', 'cobertura'],
    'ahorro': ['ahorro', 'bse'],
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
 * Genera el contexto de few-shot basado en la conversación actual
 */
export function getFewShotContext(
  currentMessage: string,
  recentMessages: Array<{ role: string; content: string }>
): string {
  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .slice(-5);

  const tags = detectTags(currentMessage, userMessages);
  if (tags.length === 0) return '';

  const examples = selectExamples(tags, 2);
  if (examples.length === 0) return '';

  console.log(`[Few-Shot] Tags: ${tags.join(', ')}, Examples: ${examples.map(e => e.id).join(', ')}`);

  return formatExamples(examples);
}

export function getExamplesByCategory(category: string): ConversationExample[] {
  const categoryTags: Record<string, string[]> = {
    'price': ['precio', 'caro'],
    'skeptic': ['no creo', 'no pagan'],
    'work_insurance': ['trabajo', 'ya tengo'],
    'young': ['joven', 'soltero'],
    'postpone': ['pienso', 'después'],
    'close': ['quiero', 'contratar'],
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

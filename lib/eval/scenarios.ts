// 30 escenarios realistas con mensajes cortos como la gente escribe en WhatsApp
// OBJETIVO: Siempre dirigir hacia agendar una llamada/demo

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  conversation: Message[];
  nextUserMessage: string;
  criteria: {
    shouldNotRepeatQuestions: boolean;
    shouldProgressToProposal: boolean;
    shouldMentionProduct: boolean;
    shouldAskForDemo: boolean;
    shouldBeShort: boolean;
    customCheck?: string;
  };
}

export const SCENARIOS: Scenario[] = [
  // =====================================================
  // SALUDOS Y PRIMEROS CONTACTOS (mensajes muy cortos)
  // =====================================================
  {
    id: 'saludo-01',
    name: 'Hola simple',
    description: 'Usuario solo dice hola',
    conversation: [],
    nextUserMessage: 'Hola',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Responder con saludo breve y pregunta abierta.'
    }
  },
  {
    id: 'saludo-02',
    name: 'Buenas',
    description: 'Saludo informal',
    conversation: [],
    nextUserMessage: 'Buenas',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Responder con saludo y pregunta abierta.'
    }
  },
  {
    id: 'saludo-03',
    name: 'Qué onda',
    description: 'Saludo muy informal',
    conversation: [],
    nextUserMessage: 'Q onda',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Responder amigable y preguntar en qué puede ayudar.'
    }
  },

  // =====================================================
  // RESPUESTAS GENÉRICAS Y CORTAS
  // =====================================================
  {
    id: 'generico-01',
    name: 'Info',
    description: 'Usuario pide info con una palabra',
    conversation: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, ¿en qué te puedo ayudar?' },
    ],
    nextUserMessage: 'Info',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: true,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Explicar brevemente qué hacen y preguntar sobre su negocio.'
    }
  },
  {
    id: 'generico-02',
    name: 'Precio?',
    description: 'Usuario pregunta precio directo',
    conversation: [],
    nextUserMessage: 'Precio?',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Dar precio desde $199 y redirigir a demo/llamada.'
    }
  },
  {
    id: 'generico-03',
    name: 'Cuánto',
    description: 'Pregunta precio ultra corta',
    conversation: [],
    nextUserMessage: 'Cuánto',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Dar precio y proponer llamada para explicar planes.'
    }
  },
  {
    id: 'generico-04',
    name: 'Ok',
    description: 'Respuesta genérica ok',
    conversation: [
      { role: 'user', content: 'Info' },
      { role: 'assistant', content: 'Hacemos agentes de IA para WhatsApp que responden 24/7. ¿Qué tipo de negocio tienes?' },
    ],
    nextUserMessage: 'Ok',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Interpretar como interés y avanzar preguntando sobre su negocio o proponiendo demo.'
    }
  },
  {
    id: 'generico-05',
    name: 'Ya',
    description: 'Respuesta monosilábica',
    conversation: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, ¿en qué te puedo ayudar?' },
    ],
    nextUserMessage: 'Ya',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Pedir clarificación o preguntar qué necesita.'
    }
  },
  {
    id: 'generico-06',
    name: 'Ajá',
    description: 'Respuesta de confirmación vaga',
    conversation: [
      { role: 'user', content: 'Info' },
      { role: 'assistant', content: 'Hacemos agentes de IA que responden WhatsApp automático. ¿Tienes negocio?' },
    ],
    nextUserMessage: 'Aja',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Tomar como sí y avanzar hacia demo. Preguntar tipo de negocio o proponer llamada.'
    }
  },

  // =====================================================
  // RESPUESTAS CORTAS SOBRE NEGOCIO
  // =====================================================
  {
    id: 'negocio-01',
    name: 'Tienda',
    description: 'Usuario dice tienda sin más',
    conversation: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, ¿en qué te puedo ayudar?' },
      { role: 'user', content: 'Info' },
      { role: 'assistant', content: '¿Qué tipo de negocio tienes?' },
    ],
    nextUserMessage: 'Tienda',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Preguntar cuántos mensajes recibe o proponer demo directamente.'
    }
  },
  {
    id: 'negocio-02',
    name: 'Vendo ropa',
    description: 'Negocio corto',
    conversation: [
      { role: 'assistant', content: '¿Qué tipo de negocio tienes?' },
    ],
    nextUserMessage: 'Vendo ropa',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Preguntar volumen de mensajes o proponer demo.'
    }
  },
  {
    id: 'negocio-03',
    name: 'Servicios',
    description: 'Respuesta genérica servicios',
    conversation: [
      { role: 'assistant', content: '¿A qué te dedicas?' },
    ],
    nextUserMessage: 'Servicios',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Preguntar más específico o cuántos mensajes recibe.'
    }
  },

  // =====================================================
  // VOLUMEN Y DOLOR (corto)
  // =====================================================
  {
    id: 'volumen-01',
    name: 'Muchos',
    description: 'Volumen vago',
    conversation: [
      { role: 'assistant', content: '¿Cuántos mensajes recibes al día?' },
    ],
    nextUserMessage: 'Muchos',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Pedir número específico: "¿Más o menos cuántos? ¿10, 50, 100?"'
    }
  },
  {
    id: 'volumen-02',
    name: 'Como 20',
    description: 'Volumen específico',
    conversation: [
      { role: 'assistant', content: '¿Cuántos mensajes recibes?' },
    ],
    nextUserMessage: 'Como 20',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: true,
      shouldMentionProduct: true,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Ya tiene info. Conectar con solución y proponer llamada/demo.'
    }
  },
  {
    id: 'volumen-03',
    name: 'No sé cuántos',
    description: 'Usuario no sabe volumen',
    conversation: [
      { role: 'assistant', content: '¿Cuántos mensajes te llegan al día?' },
    ],
    nextUserMessage: 'No sé',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'No insistir. Proponer demo para ver si les sirve.'
    }
  },
  {
    id: 'dolor-01',
    name: 'No alcanzo',
    description: 'Expresa dolor corto',
    conversation: [],
    nextUserMessage: 'No alcanzo a contestar todo',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: true,
      shouldMentionProduct: true,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Dolor claro. Conectar con solución y proponer demo inmediato.'
    }
  },

  // =====================================================
  // ACEPTACIÓN Y CIERRE (respuestas cortas)
  // =====================================================
  {
    id: 'acepta-01',
    name: 'Sí',
    description: 'Acepta con sí',
    conversation: [
      { role: 'assistant', content: '¿Quieres ver cómo funcionaría para tu negocio?' },
    ],
    nextUserMessage: 'Sí',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Dar horarios específicos para la llamada/demo.'
    }
  },
  {
    id: 'acepta-02',
    name: 'Dale',
    description: 'Acepta informal',
    conversation: [
      { role: 'assistant', content: '¿Te muestro en una llamada de 20 min?' },
    ],
    nextUserMessage: 'Dale',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Proponer horarios específicos.'
    }
  },
  {
    id: 'acepta-03',
    name: 'Va',
    description: 'Acepta ultra corto',
    conversation: [
      { role: 'assistant', content: '¿Agendamos una llamada?' },
    ],
    nextUserMessage: 'Va',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Dar opciones de horario concretas.'
    }
  },
  {
    id: 'horario-01',
    name: 'Mañana',
    description: 'Propone día vago',
    conversation: [
      { role: 'assistant', content: '¿Te funciona martes 10am o miércoles 3pm?' },
    ],
    nextUserMessage: 'Mañana',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Preguntar hora específica para mañana.'
    }
  },
  {
    id: 'horario-02',
    name: 'En la tarde',
    description: 'Propone franja horaria',
    conversation: [
      { role: 'assistant', content: '¿Qué día te funciona?' },
    ],
    nextUserMessage: 'En la tarde',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Proponer hora específica en la tarde y confirmar día.'
    }
  },
  {
    id: 'email-01',
    name: 'Email corto',
    description: 'Da email',
    conversation: [
      { role: 'assistant', content: '¿A qué correo te mando la invitación?' },
    ],
    nextUserMessage: 'juan@gmail.com',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Confirmar envío y despedirse con fecha de la llamada.'
    }
  },

  // =====================================================
  // OBJECIONES CORTAS
  // =====================================================
  {
    id: 'objecion-01',
    name: 'Caro',
    description: 'Objeción precio corta',
    conversation: [
      { role: 'assistant', content: 'Desde $199/mes. ¿Te muestro cómo funciona?' },
    ],
    nextUserMessage: 'Caro',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Manejar con ROI y proponer llamada para explicar valor.'
    }
  },
  {
    id: 'objecion-02',
    name: 'Luego',
    description: 'Postpone corto',
    conversation: [
      { role: 'assistant', content: '¿Agendamos una llamada?' },
    ],
    nextUserMessage: 'Luego',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Proponer fecha concreta: "¿La próxima semana te funciona?"'
    }
  },
  {
    id: 'objecion-03',
    name: 'No creo',
    description: 'Duda corta',
    conversation: [
      { role: 'assistant', content: 'Con el agente atiendes 24/7. ¿Te interesa verlo?' },
    ],
    nextUserMessage: 'No creo',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Ofrecer demo personalizada sin compromiso.'
    }
  },
  {
    id: 'objecion-04',
    name: 'Ya tengo',
    description: 'Tiene competencia',
    conversation: [],
    nextUserMessage: 'Ya tengo algo',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Preguntar qué tiene y cómo le funciona.'
    }
  },
  {
    id: 'objecion-05',
    name: 'No gracias',
    description: 'Rechazo educado',
    conversation: [
      { role: 'assistant', content: '¿Te muestro en una llamada rápida?' },
    ],
    nextUserMessage: 'No gracias',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Respetar y dejar puerta abierta.'
    }
  },
  {
    id: 'objecion-06',
    name: 'Paso',
    description: 'Rechazo informal',
    conversation: [
      { role: 'assistant', content: '¿Quieres agendar?' },
    ],
    nextUserMessage: 'Paso',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Respetar decisión, dejar puerta abierta.'
    }
  },

  // =====================================================
  // CASOS ESPECIALES
  // =====================================================
  {
    id: 'especial-01',
    name: 'Emoji solo',
    description: 'Usuario manda solo emoji',
    conversation: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: 'Hola, ¿en qué te puedo ayudar?' },
    ],
    nextUserMessage: '👍',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Interpretar como interés y avanzar con pregunta o propuesta.'
    }
  },
  {
    id: 'especial-02',
    name: 'Audio',
    description: 'Usuario manda audio',
    conversation: [],
    nextUserMessage: '[Audio]',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: false,
      shouldBeShort: true,
      customCheck: 'Pedir que escriba: "No puedo escuchar audios. ¿Me lo escribes?"'
    }
  },
  {
    id: 'especial-03',
    name: 'Referido corto',
    description: 'Viene recomendado',
    conversation: [],
    nextUserMessage: 'Me pasaron tu contacto',
    criteria: {
      shouldNotRepeatQuestions: true,
      shouldProgressToProposal: false,
      shouldMentionProduct: false,
      shouldAskForDemo: true,
      shouldBeShort: true,
      customCheck: 'Agradecer y proponer llamada/demo rápido.'
    }
  },
];

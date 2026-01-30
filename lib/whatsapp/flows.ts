/**
 * WhatsApp Flows - Calificación de Leads
 *
 * Este módulo maneja el Flow de calificación que se envía a leads
 * provenientes de Meta Ads para recopilar información antes de la conversación.
 */

const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

/**
 * Datos de calificación recopilados del Flow
 */
export interface QualificationData {
  challenge: 'manual_responses' | 'lost_sales' | 'scale_without_hiring' | 'other';
  messageVolume: 'less_50' | '50_200' | '200_500' | 'more_500';
  industry: 'ecommerce' | 'services' | 'health' | 'education' | 'other';
}

/**
 * Mapeo de valores del Flow a texto legible
 */
export const QUALIFICATION_LABELS = {
  challenge: {
    manual_responses: 'Responde muchos mensajes manualmente',
    lost_sales: 'Pierde ventas por no contestar a tiempo',
    scale_without_hiring: 'Quiere escalar sin contratar más gente',
    other: 'Otro reto',
  },
  messageVolume: {
    less_50: 'Menos de 50 mensajes/día',
    '50_200': '50-200 mensajes/día',
    '200_500': '200-500 mensajes/día',
    more_500: 'Más de 500 mensajes/día',
  },
  industry: {
    ecommerce: 'E-commerce / Retail',
    services: 'Servicios profesionales',
    health: 'Salud / Bienestar',
    education: 'Educación',
    other: 'Otra industria',
  },
} as const;

/**
 * JSON del Flow de calificación
 *
 * IMPORTANTE: Este JSON debe subirse a Meta Business Suite o via la API de Flows.
 * El flow_id resultante debe configurarse en WHATSAPP_QUALIFICATION_FLOW_ID
 */
export const QUALIFICATION_FLOW_JSON = {
  version: '3.1',
  screens: [
    {
      id: 'CHALLENGE',
      title: 'Tu principal reto',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: '¿Cuál es tu principal reto con WhatsApp?',
          },
          {
            type: 'RadioButtonsGroup',
            name: 'challenge',
            required: true,
            'data-source': [
              { id: 'manual_responses', title: 'Respondo muchos mensajes manualmente' },
              { id: 'lost_sales', title: 'Pierdo ventas por no contestar a tiempo' },
              { id: 'scale_without_hiring', title: 'Quiero escalar sin contratar más gente' },
              { id: 'other', title: 'Otro' },
            ],
          },
          {
            type: 'Footer',
            label: 'Continuar',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'VOLUME' },
              payload: {
                challenge: '${form.challenge}',
              },
            },
          },
        ],
      },
    },
    {
      id: 'VOLUME',
      title: 'Volumen de mensajes',
      data: {
        challenge: { type: 'string', __example__: 'manual_responses' },
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: '¿Cuántos mensajes reciben al día?',
          },
          {
            type: 'RadioButtonsGroup',
            name: 'message_volume',
            required: true,
            'data-source': [
              { id: 'less_50', title: 'Menos de 50' },
              { id: '50_200', title: '50 - 200' },
              { id: '200_500', title: '200 - 500' },
              { id: 'more_500', title: 'Más de 500' },
            ],
          },
          {
            type: 'Footer',
            label: 'Continuar',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'INDUSTRY' },
              payload: {
                challenge: '${data.challenge}',
                message_volume: '${form.message_volume}',
              },
            },
          },
        ],
      },
    },
    {
      id: 'INDUSTRY',
      title: 'Tu industria',
      data: {
        challenge: { type: 'string', __example__: 'manual_responses' },
        message_volume: { type: 'string', __example__: '50_200' },
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: '¿En qué industria estás?',
          },
          {
            type: 'RadioButtonsGroup',
            name: 'industry',
            required: true,
            'data-source': [
              { id: 'ecommerce', title: 'E-commerce / Retail' },
              { id: 'services', title: 'Servicios profesionales' },
              { id: 'health', title: 'Salud / Bienestar' },
              { id: 'education', title: 'Educación' },
              { id: 'other', title: 'Otro' },
            ],
          },
          {
            type: 'Footer',
            label: 'Enviar',
            'on-click-action': {
              name: 'complete',
              payload: {
                challenge: '${data.challenge}',
                message_volume: '${data.message_volume}',
                industry: '${form.industry}',
              },
            },
          },
        ],
      },
    },
  ],
};

/**
 * Envía el Flow de calificación a un usuario
 */
export async function sendQualificationFlow(
  to: string,
  headerText: string = '¡Hola! ',
  bodyText: string = 'Para darte la mejor información, cuéntame un poco sobre tu negocio.',
  ctaText: string = 'Empezar'
): Promise<boolean> {
  const flowId = process.env.WHATSAPP_QUALIFICATION_FLOW_ID;

  if (!flowId) {
    console.error('[Flow] WHATSAPP_QUALIFICATION_FLOW_ID not configured');
    return false;
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'flow',
          header: {
            type: 'text',
            text: headerText,
          },
          body: {
            text: bodyText,
          },
          footer: {
            text: 'Solo toma 30 segundos',
          },
          action: {
            name: 'flow',
            parameters: {
              flow_id: flowId,
              flow_message_version: '3',
              flow_action: 'navigate',
              flow_token: `qualification_${to}_${Date.now()}`,
              flow_cta: ctaText,
              flow_action_payload: {
                screen: 'CHALLENGE',
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Flow] Error sending qualification flow:', error);
      return false;
    }

    console.log(`[Flow] Qualification flow sent to ${to}`);
    return true;
  } catch (error) {
    console.error('[Flow] Error sending qualification flow:', error);
    return false;
  }
}

/**
 * Parsea la respuesta del Flow de calificación
 */
export function parseFlowResponse(responseJson: string): QualificationData | null {
  try {
    const data = JSON.parse(responseJson);

    return {
      challenge: data.challenge || 'other',
      messageVolume: data.message_volume || 'less_50',
      industry: data.industry || 'other',
    };
  } catch (error) {
    console.error('[Flow] Error parsing flow response:', error);
    return null;
  }
}

/**
 * Genera un mensaje personalizado basado en la calificación
 */
export function generateQualifiedGreeting(data: QualificationData, leadName?: string): string {
  const name = leadName && leadName !== 'Usuario' ? leadName : '';
  const greeting = name ? `¡Gracias ${name}!` : '¡Gracias!';

  // Personalizar según el reto principal
  let painPoint = '';
  switch (data.challenge) {
    case 'manual_responses':
      painPoint = 'Entiendo que responder mensajes manualmente consume mucho tiempo';
      break;
    case 'lost_sales':
      painPoint = 'Sé lo frustrante que es perder ventas por no contestar a tiempo';
      break;
    case 'scale_without_hiring':
      painPoint = 'Escalar sin aumentar costos de personal es clave';
      break;
    default:
      painPoint = 'Gracias por compartir tu situación';
  }

  // Personalizar según volumen
  let volumeContext = '';
  if (data.messageVolume === 'more_500' || data.messageVolume === '200_500') {
    volumeContext = ' Con ese volumen de mensajes, la automatización te va a cambiar la operación.';
  }

  return `${greeting} ${painPoint}.${volumeContext}\n\n¿Te gustaría ver cómo funciona en una demo de 20 minutos?`;
}

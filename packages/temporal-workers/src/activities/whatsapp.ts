import { TenantCredentials } from '../types';

const WHATSAPP_API_VERSION = 'v22.0';

function getCredentials(credentials?: TenantCredentials) {
  return {
    phoneNumberId: credentials?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID!,
    accessToken: credentials?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN!,
  };
}

function getApiUrl(phoneNumberId: string): string {
  return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
}

async function sendRequest(
  phoneNumberId: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const response = await fetch(getApiUrl(phoneNumberId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WhatsApp API error:', errorText);
    return { success: false, error: errorText };
  }

  const data = await response.json() as { messages?: { id: string }[] };
  return { success: true, messageId: data.messages?.[0]?.id };
}

export async function sendMessage(
  phone: string,
  text: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: { body: text },
  });
}

export async function markAsRead(
  messageId: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  const response = await fetch(getApiUrl(phoneNumberId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });

  return { success: response.ok };
}

interface ListItem {
  id: string;
  title: string;
  description?: string;
}

export async function sendScheduleList(
  phone: string,
  slots: ListItem[],
  headerText: string,
  bodyText: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  // WhatsApp interactive lists support max 10 items
  const limitedSlots = slots.slice(0, 10);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: headerText,
      },
      body: {
        text: bodyText,
      },
      action: {
        button: 'Ver horarios',
        sections: [
          {
            title: 'Horarios disponibles',
            rows: limitedSlots.map((slot) => ({
              id: slot.id,
              title: slot.title,
              description: slot.description || '',
            })),
          },
        ],
      },
    },
  });
}

export async function sendConfirmationButtons(
  phone: string,
  bodyText: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'confirm_demo', title: 'Confirmo' } },
          { type: 'reply', reply: { id: 'change_time', title: 'Cambiar hora' } },
        ],
      },
    },
  });
}

export async function sendPlanSelection(
  phone: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Planes Loomi',
      },
      body: {
        text: 'Elige el plan que mejor se adapte a tus necesidades:',
      },
      action: {
        button: 'Ver planes',
        sections: [
          {
            title: 'Planes disponibles',
            rows: [
              {
                id: 'plan_starter',
                title: 'Starter - $199/mes',
                description: '500 conversaciones, 1 agente',
              },
              {
                id: 'plan_growth',
                title: 'Growth - $349/mes',
                description: '2,000 conversaciones, 3 agentes',
              },
              {
                id: 'plan_business',
                title: 'Business - $599/mes',
                description: 'Ilimitado, 10 agentes, prioridad',
              },
            ],
          },
        ],
      },
    },
  });
}

export async function sendPaymentLink(
  phone: string,
  checkoutUrl: string,
  planName: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const text = `Tu link de pago para ${planName} está listo:\n\n${checkoutUrl}\n\nEste link expira en 24 horas. Si tienes alguna duda, responde a este mensaje.`;
  return sendMessage(phone, text, credentials);
}

export async function sendDocument(
  phone: string,
  documentUrl: string,
  caption?: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'document',
    document: {
      link: documentUrl,
      caption: caption || '',
    },
  });
}

export async function sendImage(
  phone: string,
  imageUrl: string,
  caption?: string,
  credentials?: TenantCredentials
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials(credentials);

  return sendRequest(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption || '',
    },
  });
}

// Activity exports for Temporal
export const whatsappActivities = {
  sendMessage,
  markAsRead,
  sendScheduleList,
  sendConfirmationButtons,
  sendPlanSelection,
  sendPaymentLink,
  sendDocument,
  sendImage,
};

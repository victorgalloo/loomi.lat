/**
 * WhatsApp Message Sender
 * Sends messages via WhatsApp Cloud API
 *
 * Supports multi-tenant: All functions accept optional TenantCredentials
 * Falls back to environment variables for backward compatibility
 */

import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: number;
  parameters: Array<{
    type: 'text' | 'image' | 'document' | 'video';
    text?: string;
    image?: { link: string };
    document?: { link: string; filename?: string };
    video?: { link: string };
  }>;
}

export interface SendTemplateResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  displayText: string;
}

/**
 * Credentials for multi-tenant WhatsApp messaging
 */
export interface TenantCredentials {
  phoneNumberId: string;
  accessToken: string;
  tenantId?: string;
}

// Graph API version
const GRAPH_API_VERSION = 'v22.0';

/**
 * Get WhatsApp API URL for a phone number ID
 */
function getApiUrl(phoneNumberId?: string): string {
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_ID;
  if (!phoneId) {
    throw new Error('No phone number ID available');
  }
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`;
}

/**
 * Get headers for WhatsApp API
 */
function getHeaders(accessToken?: string): Record<string, string> {
  const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('No access token available');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Mark a message as read (shows blue checkmarks)
 */
export async function markAsRead(
  messageId: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] Mark as read error:', error);
      return false;
    }

    console.log('[WhatsApp] Message marked as read:', messageId);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Mark as read error:', error);
    return false;
  }
}

/**
 * Send a text message
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] Send error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return false;
  }
}

/**
 * Send an interactive list (for schedule selection)
 */
export async function sendScheduleList(
  phone: string,
  slots: TimeSlot[],
  headerText: string = 'Horarios disponibles',
  bodyText: string = 'Elige el horario que más te convenga:',
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    // WhatsApp list can have max 10 items
    const limitedSlots = slots.slice(0, 10);

    const rows = limitedSlots.map(slot => ({
      id: slot.id,
      title: slot.displayText.substring(0, 24), // Max 24 chars
      description: slot.date && slot.time ? `${slot.date} ${slot.time}` : ''
    }));

    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: headerText
          },
          body: {
            text: bodyText
          },
          action: {
            button: 'Ver horarios',
            sections: [
              {
                title: 'Horarios',
                rows
              }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] Schedule list error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Schedule list error:', error);
    return false;
  }
}

/**
 * Send confirmation buttons (confirm/change time)
 */
export async function sendConfirmationButtons(
  phone: string,
  bodyText: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'confirm_appointment',
                  title: 'Confirmar'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'change_time',
                  title: 'Cambiar horario'
                }
              }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[WhatsApp] Buttons error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Buttons error:', error);
    return false;
  }
}

/**
 * Send a document/link
 */
export async function sendWhatsAppLink(
  phone: string,
  url: string,
  caption: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    // For links, we send as text with the URL
    const text = `${caption}\n\n${url}`;
    return await sendWhatsAppMessage(phone, text, credentials);
  } catch (error) {
    console.error('[WhatsApp] Link error:', error);
    return false;
  }
}

/**
 * Send a template message (for broadcasts / marketing)
 */
export async function sendTemplateMessage(
  phone: string,
  templateName: string,
  language: string,
  components?: TemplateComponent[],
  credentials?: TenantCredentials
): Promise<SendTemplateResult> {
  try {
    // Filter out components with empty parameters to avoid #132012
    const validComponents = components?.filter(comp =>
      comp.parameters.length > 0 && comp.parameters.every(p => p.text !== '')
    );

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        ...(validComponents && validComponents.length > 0 ? { components: validComponents } : {})
      }
    };

    console.log('[WhatsApp] Template payload:', JSON.stringify(payload, null, 2));

    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Template send error:', errorText);
      console.error('[WhatsApp] Template payload was:', JSON.stringify(payload, null, 2));
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson?.error?.message || errorMsg;
        if (errorJson?.error?.error_data) {
          console.error('[WhatsApp] Error details:', JSON.stringify(errorJson.error.error_data));
        }
      } catch {
        // keep default
      }
      return { success: false, error: errorMsg };
    }

    const data = await response.json();
    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp] Template send error:', error);
    return { success: false, error: msg };
  }
}

/**
 * Escalate to human operator
 */
export async function escalateToHuman(params: {
  clientPhone: string;
  clientName: string;
  reason: string;
  conversationSummary: string;
  recentMessages?: string[];
  isUrgent?: boolean;
  isVIP?: boolean;
  credentials?: TenantCredentials;
  fallbackPhone?: string;
}): Promise<boolean> {
  const fallbackPhone = params.fallbackPhone || process.env.FALLBACK_PHONE;

  if (!fallbackPhone) {
    console.error('[WhatsApp] No fallback phone configured');
    return false;
  }

  try {
    // Build urgency indicator
    let urgencyEmoji = '🚨';
    let urgencyLabel = 'HANDOFF ACTIVADO';
    if (params.isVIP) {
      urgencyEmoji = '⭐';
      urgencyLabel = 'HANDOFF VIP';
    } else if (params.isUrgent) {
      urgencyEmoji = '🔴';
      urgencyLabel = 'HANDOFF URGENTE';
    }

    // Format recent messages if available
    let conversationContext = params.conversationSummary;
    if (params.recentMessages && params.recentMessages.length > 0) {
      conversationContext = params.recentMessages.slice(-5).join('\n');
    }

    const message = `${urgencyEmoji} ${urgencyLabel}

Lead: ${params.clientName}
Teléfono: ${params.clientPhone}
Motivo: ${params.reason}

Contexto de la conversación:
---
${conversationContext}
---

⏱️ Responder en menos de 5 minutos

wa.me/${params.clientPhone.replace('+', '')}`;

    return await sendWhatsAppMessage(fallbackPhone, message, params.credentials);
  } catch (error) {
    console.error('[WhatsApp] Escalation error:', error);
    return false;
  }
}

/**
 * Notify fallback about errors or important events
 */
export async function notifyFallback(params: {
  type: string;
  clientPhone?: string;
  clientName?: string;
  error?: string;
  details?: string;
  credentials?: TenantCredentials;
  fallbackPhone?: string;
}): Promise<boolean> {
  const fallbackPhone = params.fallbackPhone || process.env.FALLBACK_PHONE;

  if (!fallbackPhone) {
    return false;
  }

  try {
    let message = `⚠️ ${params.type.toUpperCase()}\n`;

    if (params.clientPhone) {
      message += `Cliente: ${params.clientName || 'Desconocido'} (${params.clientPhone})\n`;
    }
    if (params.error) {
      message += `Error: ${params.error}\n`;
    }
    if (params.details) {
      message += `Detalles: ${params.details}\n`;
    }

    return await sendWhatsAppMessage(fallbackPhone, message, params.credentials);
  } catch (error) {
    console.error('[WhatsApp] Notify fallback error:', error);
    return false;
  }
}

// ============================================
// Media Messages
// ============================================

/**
 * Send a document
 */
export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  caption?: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          link: documentUrl,
          caption: caption || 'Información',
        },
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp document send error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('WhatsApp document send error:', error);
    return false;
  }
}

/**
 * Send an audio message
 */
export async function sendWhatsAppAudio(
  to: string,
  audioUrl: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'audio',
        audio: {
          link: audioUrl,
        },
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp audio send error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Audio sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp audio send error:', error);
    return false;
  }
}

/**
 * Send an image
 */
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || undefined,
        },
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp image send error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Image sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp image send error:', error);
    return false;
  }
}

/**
 * Send a video
 */
export async function sendWhatsAppVideo(
  to: string,
  videoUrl: string,
  caption?: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'video',
        video: {
          link: videoUrl,
          caption: caption || undefined,
        },
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp video send error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Video sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp video send error:', error);
    return false;
  }
}

// ============================================
// Qualification Lists (Alternative to Flows)
// ============================================

/**
 * Send welcome message with interactive demo
 */
export async function sendDemoWelcome(
  to: string,
  leadName?: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  const name = leadName && leadName !== 'Usuario' ? ` ${leadName}` : '';

  const message = `Hola${name}!

Soy un agente de IA que responde WhatsApp 24/7.

Hazme una pregunta como si fueras cliente de tu negocio y te muestro cómo respondo en segundos`;

  return sendWhatsAppMessage(to, message, credentials);
}

/**
 * Send challenge list (step 1)
 */
export async function sendChallengeList(
  to: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: '¿Cuál es tu principal reto con WhatsApp?'
          },
          action: {
            button: 'Seleccionar',
            sections: [
              {
                title: 'Opciones',
                rows: [
                  { id: 'challenge_manual', title: 'Respondo manualmente', description: 'Paso mucho tiempo contestando' },
                  { id: 'challenge_sales', title: 'Pierdo ventas', description: 'No contesto a tiempo' },
                  { id: 'challenge_scale', title: 'Quiero escalar', description: 'Sin contratar más gente' },
                  { id: 'challenge_other', title: 'Otro reto', description: 'Tengo otro reto diferente' }
                ]
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp challenge list error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Challenge list sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp challenge list error:', error);
    return false;
  }
}

/**
 * Send volume list (step 2)
 */
export async function sendVolumeList(
  to: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: '¿Cuántos mensajes reciben al día aproximadamente?'
          },
          action: {
            button: 'Seleccionar',
            sections: [
              {
                title: 'Volumen diario',
                rows: [
                  { id: 'volume_less_50', title: 'Menos de 50', description: 'Volumen bajo' },
                  { id: 'volume_50_200', title: '50 - 200', description: 'Volumen medio' },
                  { id: 'volume_200_500', title: '200 - 500', description: 'Volumen alto' },
                  { id: 'volume_more_500', title: 'Más de 500', description: 'Volumen muy alto' }
                ]
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp volume list error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Volume list sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp volume list error:', error);
    return false;
  }
}

/**
 * Send industry list (step 3)
 */
export async function sendIndustryList(
  to: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: '¿En qué industria está tu negocio?'
          },
          action: {
            button: 'Seleccionar',
            sections: [
              {
                title: 'Industrias',
                rows: [
                  { id: 'industry_ecommerce', title: 'E-commerce / Retail', description: 'Tienda online o física' },
                  { id: 'industry_services', title: 'Servicios profesionales', description: 'Consultoría, agencias, etc.' },
                  { id: 'industry_health', title: 'Salud / Bienestar', description: 'Clínicas, gimnasios, etc.' },
                  { id: 'industry_education', title: 'Educación', description: 'Escuelas, cursos, etc.' },
                  { id: 'industry_other', title: 'Otro', description: 'Otra industria' }
                ]
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp industry list error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Industry list sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp industry list error:', error);
    return false;
  }
}

// ============================================
// Payment Links
// ============================================

/**
 * Send a Stripe payment link via WhatsApp
 */
export async function sendPaymentLink(
  to: string,
  checkoutUrl: string,
  planName: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  const message = `Perfecto, aquí está tu link de pago para el plan ${planName}:

${checkoutUrl}

Una vez que completes el pago, tu agente estará activo en menos de 24 horas.`;

  return sendWhatsAppMessage(to, message, credentials);
}

/**
 * Send plan selection buttons
 */
export async function sendPlanSelection(
  to: string,
  credentials?: TenantCredentials
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(getApiUrl(credentials?.phoneNumberId), {
      method: 'POST',
      headers: getHeaders(credentials?.accessToken),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: '¿Qué plan te interesa contratar?'
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
                    description: 'Hasta 100 mensajes diarios'
                  },
                  {
                    id: 'plan_growth',
                    title: 'Growth - $349/mes',
                    description: 'Hasta 300 mensajes diarios'
                  },
                  {
                    id: 'plan_business',
                    title: 'Business - $599/mes',
                    description: 'Hasta 1000 mensajes diarios'
                  }
                ]
              }
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp plan selection error:', await response.text());
      return false;
    }

    console.log(`[WhatsApp] Plan selection sent to ${to}`);
    return true;
  } catch (error) {
    console.error('WhatsApp plan selection error:', error);
    return false;
  }
}

// ============================================
// Auto Demo Sequence
// ============================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Demo assets URLs - these should be uploaded to Supabase Storage /media/demo/
const DEMO_IMAGE_URL = process.env.DEMO_IMAGE_URL || '';
const DEMO_VOICE_TEXT = `Hola, soy un agente de inteligencia artificial. Puedo responder a tus clientes 24/7, agendar citas, y nunca me canso. Mira lo que puedo hacer.`;

/**
 * Sends the full auto-demo sequence to a new lead
 * Sequence: Welcome text -> Voice note -> Image -> Schedule list
 */
export async function sendAutoDemoSequence(
  to: string,
  leadName?: string,
  slots?: TimeSlot[],
  credentials?: TenantCredentials
): Promise<boolean> {
  const name = leadName && leadName !== 'Usuario' ? ` ${leadName}` : '';

  console.log(`[AutoDemo] Starting sequence for ${to}`);

  try {
    // Step 1: Send welcome text (immediate)
    const welcomeText = `Hola${name}! Soy Loomi, tu agente de IA para WhatsApp.`;
    await sendWhatsAppMessage(to, welcomeText, credentials);
    console.log(`[AutoDemo] Step 1: Welcome text sent`);

    // Step 2: Send voice note (1.5s delay)
    await delay(1500);

    // Import dynamically to avoid circular dependencies
    const { getDemoVoiceUrl } = await import('@/lib/elevenlabs/voice');
    const voiceUrl = await getDemoVoiceUrl();

    if (voiceUrl) {
      await sendWhatsAppAudio(to, voiceUrl, credentials);
      console.log(`[AutoDemo] Step 2: Voice note sent`);
    } else {
      // Fallback: send text instead of voice
      console.log(`[AutoDemo] Step 2: Voice generation failed, sending text fallback`);
      await sendWhatsAppMessage(to, DEMO_VOICE_TEXT, credentials);
    }

    // Step 3: Send image (2s delay)
    await delay(2000);

    if (DEMO_IMAGE_URL) {
      await sendWhatsAppImage(
        to,
        DEMO_IMAGE_URL,
        'Respondo en segundos, hablo con voz, agendo citas automatico',
        credentials
      );
      console.log(`[AutoDemo] Step 3: Image sent`);
    } else {
      console.log(`[AutoDemo] Step 3: Skipped (no DEMO_IMAGE_URL configured)`);
    }

    // Step 4: Send schedule list (2s delay)
    await delay(2000);

    if (slots && slots.length > 0) {
      await sendScheduleList(
        to,
        slots,
        'Agenda una demo',
        '¿Te gustaria ver como funcionaria en tu negocio?',
        credentials
      );
      console.log(`[AutoDemo] Step 4: Schedule list sent with ${slots.length} slots`);
    } else {
      // Send CTA without schedule list
      await sendWhatsAppMessage(
        to,
        '¿Te gustaria ver como funcionaria en tu negocio? Responde "demo" para agendar una llamada de 20 minutos.',
        credentials
      );
      console.log(`[AutoDemo] Step 4: CTA text sent (no slots available)`);
    }

    console.log(`[AutoDemo] Sequence completed for ${to}`);
    return true;
  } catch (error) {
    console.error(`[AutoDemo] Error in sequence:`, error);
    return false;
  }
}

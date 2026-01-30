/**
 * WhatsApp Webhook Parser
 * Parses incoming WhatsApp Cloud API webhook payloads
 */

export interface ParsedWhatsAppMessage {
  phone: string;
  name: string;
  text: string;
  messageId: string;
  timestamp: Date;
  interactiveId?: string;      // e.g., "2026-01-28_16:00" for slot selection
  interactiveType?: 'list_reply' | 'button_reply' | 'nfm_reply';
  flowResponseJson?: string;   // JSON response from WhatsApp Flow
}

/**
 * Parse WhatsApp Cloud API webhook payload
 */
export function parseWhatsAppWebhook(body: unknown): ParsedWhatsAppMessage | null {
  try {
    const payload = body as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              id: string;
              from: string;
              timestamp: string;
              type: string;
              text?: { body: string };
              interactive?: {
                type: string;
                list_reply?: { id: string; title: string };
                button_reply?: { id: string; title: string };
                nfm_reply?: {
                  response_json: string;
                  body: string;
                  name: string;
                };
              };
              button?: { text: string; payload: string };
            }>;
            contacts?: Array<{
              profile?: { name: string };
            }>;
          };
        }>;
      }>;
    };

    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return null; // Not a message event (could be status update)
    }

    const contact = value?.contacts?.[0];
    const name = contact?.profile?.name || 'Usuario';
    const phone = message.from;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    let text = '';
    let interactiveId: string | undefined;
    let interactiveType: 'list_reply' | 'button_reply' | 'nfm_reply' | undefined;
    let flowResponseJson: string | undefined;

    // Handle different message types
    switch (message.type) {
      case 'text':
        text = message.text?.body || '';
        break;

      case 'interactive':
        if (message.interactive?.type === 'list_reply') {
          interactiveType = 'list_reply';
          interactiveId = message.interactive.list_reply?.id;
          text = message.interactive.list_reply?.title || '';
        } else if (message.interactive?.type === 'button_reply') {
          interactiveType = 'button_reply';
          interactiveId = message.interactive.button_reply?.id;
          text = message.interactive.button_reply?.title || '';
        } else if (message.interactive?.nfm_reply) {
          // WhatsApp Flow response
          interactiveType = 'nfm_reply';
          text = message.interactive.nfm_reply.body || '[Flow completado]';
          flowResponseJson = message.interactive.nfm_reply.response_json;
          console.log(`[WhatsApp] Flow reply: ${flowResponseJson}`);
        }
        break;

      case 'button':
        text = message.button?.text || message.button?.payload || '';
        break;

      case 'image':
      case 'video':
      case 'document':
        text = '[Archivo multimedia]';
        break;

      case 'audio':
      case 'voice':
        text = '[Audio]';
        break;

      case 'sticker':
        text = '[Sticker]';
        break;

      case 'location':
        text = '[Ubicación]';
        break;

      case 'contacts':
        text = '[Contacto]';
        break;

      default:
        text = `[${message.type}]`;
    }

    return {
      phone,
      name,
      text,
      messageId,
      timestamp,
      interactiveId,
      interactiveType,
      flowResponseJson
    };

  } catch (error) {
    console.error('Error parsing WhatsApp webhook:', error);
    return null;
  }
}

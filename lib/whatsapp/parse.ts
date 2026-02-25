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
  phoneNumberId: string;       // The phone_number_id of the receiving WABA (for multi-tenant routing)
  interactiveId?: string;      // e.g., "2026-01-28_16:00" for slot selection
  interactiveType?: 'list_reply' | 'button_reply' | 'nfm_reply';
  flowResponseJson?: string;   // JSON response from WhatsApp Flow
  mediaId?: string;            // Media ID for audio/image/video/document messages
  mediaType?: string;          // Original message type (audio, voice, image, etc.)
  referralSourceId?: string;   // CTWA: source_id from Click-to-WhatsApp Ad referral
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
            metadata?: {
              phone_number_id: string;
              display_phone_number: string;
            };
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
              audio?: { id: string; mime_type?: string };
              voice?: { id: string; mime_type?: string };
              image?: { id: string; mime_type?: string; caption?: string };
              video?: { id: string; mime_type?: string; caption?: string };
              document?: { id: string; mime_type?: string; filename?: string; caption?: string };
              sticker?: { id: string; mime_type?: string };
              referral?: { source_url?: string; source_id?: string; source_type?: string };
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
    const phoneNumberId = value?.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_ID || '';

    let text = '';
    let interactiveId: string | undefined;
    let interactiveType: 'list_reply' | 'button_reply' | 'nfm_reply' | undefined;
    let flowResponseJson: string | undefined;
    let mediaId: string | undefined;
    let mediaType: string | undefined;

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
        mediaId = message.image?.id;
        mediaType = 'image';
        text = message.image?.caption || '[Archivo multimedia]';
        break;

      case 'video':
        mediaId = message.video?.id;
        mediaType = 'video';
        text = message.video?.caption || '[Archivo multimedia]';
        break;

      case 'document':
        mediaId = message.document?.id;
        mediaType = 'document';
        text = message.document?.caption || '[Archivo multimedia]';
        break;

      case 'audio':
        mediaId = message.audio?.id;
        mediaType = 'audio';
        text = '[Audio]';
        break;

      case 'voice':
        mediaId = message.voice?.id;
        mediaType = 'voice';
        text = '[Audio]';
        break;

      case 'sticker':
        mediaId = message.sticker?.id;
        mediaType = 'sticker';
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

    // Extract CTWA referral data (Click-to-WhatsApp Ad)
    const referralSourceId = message.referral?.source_id || undefined;
    if (referralSourceId) {
      console.log(`[WhatsApp] CTWA referral detected: source_id=${referralSourceId}`);
    }

    return {
      phone,
      name,
      text,
      messageId,
      timestamp,
      phoneNumberId,
      interactiveId,
      interactiveType,
      flowResponseJson,
      mediaId,
      mediaType,
      referralSourceId,
    };

  } catch (error) {
    console.error('Error parsing WhatsApp webhook:', error);
    return null;
  }
}

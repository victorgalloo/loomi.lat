import { getCachedVoice, cacheVoice } from '@/lib/storage/media';
import * as crypto from 'crypto';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};

/**
 * Generate a cache key from the text content
 */
function generateCacheKey(text: string, voiceId: string): string {
  const hash = crypto.createHash('md5').update(`${voiceId}:${text}`).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Generate a voice note using ElevenLabs API
 * Returns a public URL to the generated audio file
 *
 * @param text - The text to convert to speech
 * @param voiceId - Optional voice ID (defaults to env ELEVENLABS_VOICE_ID)
 * @param useCache - Whether to use cached audio if available (default: true)
 */
export async function generateVoiceNote(
  text: string,
  voiceId?: string,
  useCache: boolean = true
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) {
    console.error('[ElevenLabs] API key not configured');
    return null;
  }

  if (!voice) {
    console.error('[ElevenLabs] Voice ID not configured');
    return null;
  }

  const cacheKey = generateCacheKey(text, voice);

  // Check cache first
  if (useCache) {
    const cachedUrl = await getCachedVoice(cacheKey);
    if (cachedUrl) {
      console.log(`[ElevenLabs] Using cached audio: ${cacheKey}`);
      return cachedUrl;
    }
  }

  console.log(`[ElevenLabs] Generating audio for text (${text.length} chars)...`);

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: DEFAULT_VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ElevenLabs] API error (${response.status}):`, errorText);
      return null;
    }

    // Get the audio buffer
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    console.log(`[ElevenLabs] Generated ${audioBuffer.length} bytes of audio`);

    // Cache the audio
    const publicUrl = await cacheVoice(cacheKey, audioBuffer);

    if (!publicUrl) {
      console.error('[ElevenLabs] Failed to cache audio');
      return null;
    }

    console.log(`[ElevenLabs] Audio cached at: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[ElevenLabs] Error generating voice:', error);
    return null;
  }
}

/**
 * Pre-generate the demo voice note
 * Call this during deployment or setup to cache the demo audio
 */
export async function prewarmDemoVoice(): Promise<string | null> {
  const demoText = `Hola, soy un agente de inteligencia artificial. Puedo responder a tus clientes 24/7, agendar citas, y nunca me canso. Mira lo que puedo hacer.`;

  return generateVoiceNote(demoText);
}

/**
 * Get the demo voice note URL (generates if not cached)
 */
export async function getDemoVoiceUrl(): Promise<string | null> {
  return prewarmDemoVoice();
}

// ============================================
// Handoff Voice Messages
// ============================================

const HANDOFF_VOICES = {
  welcome: `Hey, qué tal. Soy Loomi, el asistente de Anthana. Te voy a ayudar a resolver tus dudas por aquí. Y si en cualquier momento prefieres hablar con alguien del equipo, solo dime "humano" y te conecto. Sin rollos.`,

  offer_human: `Oye, si prefieres hablar con una persona del equipo, nomás dime "humano" y te paso. Estamos aquí para ayudarte como te sea más cómodo.`,

  handoff_confirmed: `Listo, ya le avisé al equipo. Te van a escribir en los próximos minutos. Gracias por tu paciencia.`,
};

/**
 * Get handoff welcome voice (Option A - at start of conversation)
 */
export async function getHandoffWelcomeVoice(): Promise<string | null> {
  return generateVoiceNote(HANDOFF_VOICES.welcome);
}

/**
 * Get offer human voice (Option B - when lead seems to doubt)
 */
export async function getOfferHumanVoice(): Promise<string | null> {
  return generateVoiceNote(HANDOFF_VOICES.offer_human);
}

/**
 * Get handoff confirmed voice (Option C - when escalation activated)
 */
export async function getHandoffConfirmedVoice(): Promise<string | null> {
  return generateVoiceNote(HANDOFF_VOICES.handoff_confirmed);
}

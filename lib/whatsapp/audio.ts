/**
 * Audio Transcription Module
 *
 * Downloads audio from WhatsApp Graph API and transcribes
 * using OpenAI Whisper (or Anthropic when available).
 */

import { TenantCredentials } from './send';

/**
 * Download media from WhatsApp Graph API
 * 1. Get media URL from media ID
 * 2. Download the binary content as ArrayBuffer
 */
async function downloadWhatsAppMedia(
  mediaId: string,
  credentials?: TenantCredentials
): Promise<ArrayBuffer> {
  const accessToken = credentials?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('No WhatsApp access token available');
  }

  // Step 1: Get media URL
  const mediaRes = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!mediaRes.ok) {
    throw new Error(`Failed to get media URL: ${mediaRes.status}`);
  }

  const mediaData = await mediaRes.json() as { url: string };

  // Step 2: Download media binary
  const downloadRes = await fetch(mediaData.url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!downloadRes.ok) {
    throw new Error(`Failed to download media: ${downloadRes.status}`);
  }

  return downloadRes.arrayBuffer();
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithWhisper(audioData: ArrayBuffer): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('No OpenAI API key available for transcription');
  }

  const formData = new FormData();
  const blob = new Blob([audioData], { type: 'audio/ogg' });
  formData.append('file', blob, 'audio.ogg');
  formData.append('model', 'whisper-1');
  formData.append('language', 'es');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${errorText}`);
  }

  const result = await response.json() as { text: string };
  return result.text.trim();
}

/**
 * Transcribe a WhatsApp audio message.
 * Returns the transcribed text or null if transcription fails.
 */
export async function transcribeWhatsAppAudio(
  mediaId: string,
  credentials?: TenantCredentials
): Promise<string | null> {
  try {
    console.log(`[Audio] Downloading media ${mediaId}`);
    const audioData = await downloadWhatsAppMedia(mediaId, credentials);
    console.log(`[Audio] Downloaded ${audioData.byteLength} bytes, transcribing...`);

    const transcription = await transcribeWithWhisper(audioData);
    console.log(`[Audio] Transcribed: "${transcription.substring(0, 80)}..."`);

    return transcription;
  } catch (error) {
    console.error('[Audio] Transcription failed:', error);
    return null;
  }
}

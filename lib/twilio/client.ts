/**
 * Twilio SDK Singleton
 *
 * Lazy-loaded client for phone number provisioning.
 * Only used for purchasing numbers and capturing SMS verification codes.
 */

import Twilio from 'twilio';

let twilioClient: ReturnType<typeof Twilio> | null = null;

export function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    }

    twilioClient = Twilio(accountSid, authToken);
  }

  return twilioClient;
}

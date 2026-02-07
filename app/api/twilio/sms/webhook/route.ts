import { NextRequest, NextResponse } from 'next/server';
import { updateVerificationCode } from '@/lib/twilio/numbers';

/**
 * Twilio SMS Webhook
 *
 * Receives incoming SMS messages (form-encoded).
 * Extracts 6-digit verification codes sent by Meta during WhatsApp Business registration.
 * Stores the code in DB for the frontend to poll.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    if (!to || !body) {
      return twimlResponse();
    }

    console.log(`[Twilio SMS] To: ${to}, Body: ${body}`);

    // Extract 6-digit verification code from SMS body
    const codeMatch = body.match(/\b(\d{6})\b/);
    if (codeMatch) {
      const code = codeMatch[1];
      console.log(`[Twilio SMS] Verification code captured: ${code} for ${to}`);
      await updateVerificationCode(to, code);
    }

    return twimlResponse();
  } catch (error) {
    console.error('[Twilio SMS] Webhook error:', error);
    return twimlResponse();
  }
}

function twimlResponse() {
  return new NextResponse('<Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, plan, leadId } = body;

    // Validación básica
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    if (!plan || !['starter', 'growth', 'business'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan inválido. Debe ser: starter, growth, o business' },
        { status: 400 }
      );
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    console.log(`[Checkout API] Creating session for ${email}, plan: ${plan}`);

    const { url, sessionId, accountId } = await createCheckoutSession({
      email,
      phone,
      plan,
      leadId,
    });

    return NextResponse.json({
      url,
      sessionId,
      accountId,
    });
  } catch (error) {
    console.error('[Checkout API] Error:', error);
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'stripe/checkout' });
}

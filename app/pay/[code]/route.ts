import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Buscar la URL de Stripe en Redis
  const stripeUrl = await redis.get<string>(`pay:${code}`);

  if (!stripeUrl) {
    // Si no existe o expiró, redirigir a página de error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://loomi-insurtech-5cna.vercel.app';
    return NextResponse.redirect(`${baseUrl}/?error=link_expired`);
  }

  // Redirigir a Stripe
  return NextResponse.redirect(stripeUrl);
}

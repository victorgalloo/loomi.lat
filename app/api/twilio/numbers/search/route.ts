import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { searchAvailableNumbers } from '@/lib/twilio/numbers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') as 'MX' | 'US' || 'MX';
    const areaCode = searchParams.get('areaCode') || undefined;

    if (country !== 'MX' && country !== 'US') {
      return NextResponse.json({ error: 'Country must be MX or US' }, { status: 400 });
    }

    const numbers = await searchAvailableNumbers(country, { areaCode });

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error('Twilio search error:', error);
    return NextResponse.json(
      { error: 'Failed to search numbers' },
      { status: 500 }
    );
  }
}

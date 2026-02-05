import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/broadcasts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseCSV(text: string): Array<{ phone: string; name?: string }> {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  // Detect header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('phone') || firstLine.includes('nombre') || firstLine.includes('name') || firstLine.includes('telefono');
  const startIdx = hasHeader ? 1 : 0;

  // Detect separator
  const separator = lines[0].includes(';') ? ';' : ',';

  // Find column indices from header
  let phoneIdx = 0;
  let nameIdx = -1;

  if (hasHeader) {
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    phoneIdx = headers.findIndex(h => h === 'phone' || h === 'telefono' || h === 'tel' || h === 'numero' || h === 'whatsapp');
    nameIdx = headers.findIndex(h => h === 'name' || h === 'nombre');
    if (phoneIdx === -1) phoneIdx = 0;
  }

  const recipients: Array<{ phone: string; name?: string }> = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(separator).map(c => c.trim().replace(/"/g, ''));
    const rawPhone = cols[phoneIdx] || '';
    // Clean phone: keep only digits and leading +
    const phone = rawPhone.replace(/[^\d+]/g, '');
    if (!phone || phone.replace(/\D/g, '').length < 8) continue;

    const name = nameIdx >= 0 ? cols[nameIdx] || undefined : undefined;
    recipients.push({ phone, name });
  }

  return recipients;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const templateName = formData.get('templateName') as string;
    const language = (formData.get('language') as string) || 'es';
    const componentsRaw = formData.get('components') as string;
    const csvFile = formData.get('csv') as File | null;

    if (!name || !templateName) {
      return NextResponse.json({ error: 'name and templateName are required' }, { status: 400 });
    }

    if (!csvFile) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    // Parse components JSON
    let templateComponents = null;
    if (componentsRaw) {
      try {
        templateComponents = JSON.parse(componentsRaw);
      } catch {
        return NextResponse.json({ error: 'Invalid components JSON' }, { status: 400 });
      }
    }

    // Parse CSV
    const csvText = await csvFile.text();
    const recipients = parseCSV(csvText);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found in CSV' }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('broadcast_campaigns')
      .insert({
        tenant_id: tenantId,
        name,
        template_name: templateName,
        template_language: language,
        template_components: templateComponents,
        status: 'draft',
        total_recipients: recipients.length,
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 500 });
    }

    // Insert recipients in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE).map(r => ({
        campaign_id: campaign.id,
        phone: r.phone,
        name: r.name || null,
        status: 'pending',
      }));

      const { error: recipientError } = await supabase
        .from('broadcast_recipients')
        .insert(batch);

      if (recipientError) {
        console.error('Error inserting recipients batch:', recipientError);
      }
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error in POST /api/broadcasts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

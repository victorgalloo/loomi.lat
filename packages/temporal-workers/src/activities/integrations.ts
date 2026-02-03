import OpenAI from 'openai';
import { Lead } from '../types';

// HubSpot sync activity
export async function syncLeadToHubSpot(
  lead: Lead
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'HubSpot API key not configured' };
  }

  try {
    // Search for existing contact by phone
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'phone',
                  operator: 'EQ',
                  value: lead.phone,
                },
              ],
            },
          ],
        }),
      }
    );

    const searchData = await searchResponse.json() as { results?: { id: string }[] };
    const existingContact = searchData.results?.[0];

    // Prepare contact properties
    const properties: Record<string, string> = {
      phone: lead.phone,
      lifecyclestage: mapStageToHubSpot(lead.stage),
    };

    if (lead.name) {
      const nameParts = lead.name.split(' ');
      properties.firstname = nameParts[0];
      if (nameParts.length > 1) {
        properties.lastname = nameParts.slice(1).join(' ');
      }
    }

    if (lead.email) properties.email = lead.email;
    if (lead.company) properties.company = lead.company;
    if (lead.industry) properties.industry = lead.industry;

    if (existingContact) {
      // Update existing contact
      const updateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ properties }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return { success: false, error: `Update failed: ${errorText}` };
      }

      return { success: true, contactId: existingContact.id };
    } else {
      // Create new contact
      const createResponse = await fetch(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ properties }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        return { success: false, error: `Create failed: ${errorText}` };
      }

      const createData = await createResponse.json() as { id: string };
      return { success: true, contactId: createData.id };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function mapStageToHubSpot(stage: Lead['stage']): string {
  const stageMap: Record<string, string> = {
    new: 'subscriber',
    contacted: 'lead',
    qualified: 'marketingqualifiedlead',
    demo_scheduled: 'salesqualifiedlead',
    proposal_sent: 'opportunity',
    negotiation: 'opportunity',
    won: 'customer',
    lost: 'other',
  };
  return stageMap[stage] || 'subscriber';
}

// Meta Conversions API activity
export async function trackMetaConversion(
  eventName: string,
  lead: Lead
): Promise<{ success: boolean }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.log('Meta Pixel not configured, skipping conversion tracking');
    return { success: false };
  }

  try {
    const eventTime = Math.floor(Date.now() / 1000);

    // Hash phone for matching (sha256)
    const crypto = await import('crypto');
    const hashedPhone = crypto
      .createHash('sha256')
      .update(lead.phone.replace(/\D/g, ''))
      .digest('hex');

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: eventTime,
          action_source: 'website',
          user_data: {
            ph: [hashedPhone],
            ...(lead.email && {
              em: [
                crypto.createHash('sha256').update(lead.email.toLowerCase()).digest('hex'),
              ],
            }),
          },
          custom_data: {
            lead_id: lead.id,
            stage: lead.stage,
            industry: lead.industry,
          },
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error('Meta Conversions API error:', await response.text());
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Meta tracking error:', error);
    return { success: false };
  }
}

// Memory generation activity using OpenAI
export async function generateMemorySummary(
  leadId: string,
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('OpenAI API key not configured, skipping memory generation');
    return null;
  }

  if (messages.length < 3) {
    // Too few messages to summarize
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Loomi'}: ${m.content}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente que genera resúmenes de conversaciones de ventas.
Genera un resumen conciso en español (máximo 150 palabras) que incluya:
- Nombre del lead (si se mencionó)
- Empresa e industria (si se mencionó)
- Principal interés o necesidad
- Objeciones mencionadas
- Estado actual de la conversación
- Próximos pasos acordados

Formato: texto plano sin markdown.`,
        },
        {
          role: 'user',
          content: `Resume esta conversación:\n\n${conversationText}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Memory generation error:', error);
    return null;
  }
}

// Activity exports for Temporal
export const integrationActivities = {
  syncLeadToHubSpot,
  trackMetaConversion,
  generateMemorySummary,
};

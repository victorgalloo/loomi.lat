/**
 * HubSpot CRM Integration
 * Syncs leads and conversations to HubSpot
 */

import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

interface HubSpotSyncParams {
  phone: string;
  name: string;
  email?: string;
  company?: string;
  stage: string;
  messages: Array<{ role: string; content: string }>;
  appointmentBooked?: {
    date: string;
    time: string;
    meetingUrl?: string;
  };
}

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_API_URL = 'https://api.hubapi.com';

/**
 * Sync lead data to HubSpot
 */
export async function syncLeadToHubSpot(params: HubSpotSyncParams): Promise<void> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.log('[HubSpot] No access token configured, skipping sync');
    return;
  }

  try {
    // Search for existing contact by phone
    const existingContact = await findContactByPhone(params.phone);

    // Build conversation summary
    const conversationSummary = params.messages
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Agente'}: ${m.content}`)
      .join('\n');

    // Map stage to HubSpot lifecycle stage
    const lifecycleStage = mapStageToHubSpot(params.stage);

    const properties: Record<string, string> = {
      firstname: params.name.split(' ')[0] || params.name,
      lastname: params.name.split(' ').slice(1).join(' ') || '',
      phone: params.phone,
      lifecyclestage: lifecycleStage,
      hs_lead_status: mapLeadStatusToHubSpot(params.stage),
    };

    if (params.email) {
      properties.email = params.email;
    }

    if (params.company) {
      properties.company = params.company;
    }

    if (params.appointmentBooked) {
      properties.demo_scheduled_date = params.appointmentBooked.date;
      properties.demo_scheduled_time = params.appointmentBooked.time;
      if (params.appointmentBooked.meetingUrl) {
        properties.demo_meeting_url = params.appointmentBooked.meetingUrl;
      }
    }

    if (existingContact) {
      // Update existing contact
      await updateContact(existingContact.id, properties);
      console.log(`[HubSpot] Updated contact ${existingContact.id}`);
    } else {
      // Create new contact
      const newContact = await createContact(properties);
      console.log(`[HubSpot] Created contact ${newContact.id}`);
    }

  } catch (error) {
    console.error('[HubSpot] Sync error:', error);
  }
}

/**
 * Find contact by phone number
 */
async function findContactByPhone(phone: string): Promise<{ id: string } | null> {
  try {
    const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'phone',
                operator: 'EQ',
                value: phone
              }
            ]
          }
        ],
        limit: 1
      }),
      timeoutMs: 6000,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.results?.[0] || null;

  } catch (error) {
    console.error('[HubSpot] Search error:', error);
    return null;
  }
}

/**
 * Create a new contact
 */
async function createContact(properties: Record<string, string>): Promise<{ id: string }> {
  const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties }),
    timeoutMs: 6000,
  });

  if (!response.ok) {
    throw new Error(`HubSpot create error: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Update an existing contact
 */
async function updateContact(contactId: string, properties: Record<string, string>): Promise<void> {
  const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties }),
    timeoutMs: 6000,
  });

  if (!response.ok) {
    throw new Error(`HubSpot update error: ${await response.text()}`);
  }
}

/**
 * Map internal stage to HubSpot lifecycle stage
 */
function mapStageToHubSpot(stage: string): string {
  const stageMap: Record<string, string> = {
    'initial': 'subscriber',
    'discovery': 'lead',
    'qualified': 'marketingqualifiedlead',
    'demo_scheduled': 'salesqualifiedlead',
    'demo_completed': 'opportunity',
    'proposal_sent': 'opportunity',
    'closed_won': 'customer',
    'closed_lost': 'other',
    'cold': 'other'
  };

  return stageMap[stage] || 'lead';
}

/**
 * Map internal stage to HubSpot hs_lead_status
 * Valid values: NEW, OPEN, IN_PROGRESS, OPEN_DEAL, UNQUALIFIED,
 *               ATTEMPTED_TO_CONTACT, CONNECTED, BAD_TIMING
 */
function mapLeadStatusToHubSpot(stage: string): string {
  const statusMap: Record<string, string> = {
    'Cold': 'NEW',
    'initial': 'NEW',
    'discovery': 'OPEN',
    'Warm': 'IN_PROGRESS',
    'qualified': 'IN_PROGRESS',
    'Hot': 'OPEN_DEAL',
    'demo_scheduled': 'OPEN_DEAL',
    'Demo Agendada': 'OPEN_DEAL',
    'demo_completed': 'OPEN_DEAL',
    'proposal_sent': 'OPEN_DEAL',
    'Ganado': 'CONNECTED',
    'closed_won': 'CONNECTED',
    'Perdido': 'UNQUALIFIED',
    'closed_lost': 'UNQUALIFIED',
    'cold': 'BAD_TIMING',
  };

  return statusMap[stage] || 'OPEN';
}

// ============================================
// Deal Operations
// ============================================

/**
 * Create a deal associated with a contact
 */
export async function createDeal(data: {
  contactId: string;
  dealName: string;
  stage?: string;
  amount?: number;
  meetingDate?: Date;
}): Promise<string | null> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.log('[HubSpot] No access token, skipping deal creation');
    return null;
  }

  const { contactId, dealName, stage, amount, meetingDate } = data;

  try {
    // Create the deal
    const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          dealname: dealName,
          dealstage: stage || 'appointmentscheduled',
          amount: amount?.toString() || '',
          closedate: meetingDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          pipeline: 'default'
        }
      }),
      timeoutMs: 6000,
    });

    if (!response.ok) {
      console.error('[HubSpot] Failed to create deal:', await response.text());
      return null;
    }

    const dealResult = await response.json();

    // Associate deal with contact
    await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealResult.id}/associations/contacts/${contactId}/deal_to_contact`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeoutMs: 6000,
    });

    console.log(`[HubSpot] Deal created: ${dealResult.id} for contact ${contactId}`);
    return dealResult.id;
  } catch (error) {
    console.error('[HubSpot] Error creating deal:', error);
    return null;
  }
}

/**
 * Log a note on a contact
 */
export async function logNote(contactId: string, content: string): Promise<boolean> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    return false;
  }

  try {
    const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: content
        },
        associations: [{
          to: { id: contactId },
          types: [{
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: 202 // Note to Contact
          }]
        }]
      }),
      timeoutMs: 6000,
    });

    if (response.ok) {
      console.log(`[HubSpot] Note logged for contact ${contactId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[HubSpot] Error logging note:', error);
    return false;
  }
}

/**
 * Log a WhatsApp conversation as an activity
 */
export async function logConversation(data: {
  contactId: string;
  messages: { role: string; content: string; timestamp?: Date }[];
  outcome?: 'demo_scheduled' | 'not_interested' | 'follow_up' | 'ongoing';
}): Promise<boolean> {
  const { contactId, messages, outcome } = data;

  // Format the conversation
  const conversationText = messages.map(m => {
    const role = m.role === 'user' ? 'Cliente' : 'Bot';
    return `${role}: ${m.content}`;
  }).join('\n\n');

  const outcomeText = outcome ? `\n\nResultado: ${outcome}` : '';
  const noteContent = `Conversacion de WhatsApp\n\n${conversationText}${outcomeText}`;

  return logNote(contactId, noteContent);
}

/**
 * Update the stage of a deal
 */
export async function updateDealStage(dealId: string, stage: string): Promise<boolean> {
  if (!HUBSPOT_ACCESS_TOKEN) {
    return false;
  }

  try {
    const response = await fetchWithTimeout(`${HUBSPOT_API_URL}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          dealstage: stage
        }
      }),
      timeoutMs: 6000,
    });

    if (response.ok) {
      console.log(`[HubSpot] Deal ${dealId} stage updated to ${stage}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[HubSpot] Error updating deal stage:', error);
    return false;
  }
}

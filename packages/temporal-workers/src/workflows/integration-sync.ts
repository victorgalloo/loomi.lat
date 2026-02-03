import {
  proxyActivities,
  sleep,
  ApplicationFailure,
  workflowInfo,
  upsertSearchAttributes,
} from '@temporalio/workflow';
import type {
  IntegrationSyncWorkflowInput,
  MemoryGenerationWorkflowInput,
  Lead,
  TenantContext,
} from '../types';

// Import activity types
import type * as activities from '../activities';

const {
  getLeadById,
  getRecentMessages,
  saveLeadMemory,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
  retry: {
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

// Activity for external integrations
const {
  syncLeadToHubSpot,
  trackMetaConversion,
  generateMemorySummary,
} = proxyActivities<{
  syncLeadToHubSpot: (lead: Lead) => Promise<{ success: boolean; contactId?: string; error?: string }>;
  trackMetaConversion: (eventName: string, lead: Lead) => Promise<{ success: boolean }>;
  generateMemorySummary: (leadId: string, messages: Array<{ role: string; content: string }>) => Promise<string | null>;
}>({
  startToCloseTimeout: '60 seconds',
  retry: {
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

// ===========================================
// LOGGING HELPER
// ===========================================
function log(tenantId: string, workflowId: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    tenant_id: tenantId,
    workflow_id: workflowId,
    workflow_type: 'integration-sync',
    message,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

function logWarn(tenantId: string, workflowId: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    tenant_id: tenantId,
    workflow_id: workflowId,
    workflow_type: 'integration-sync',
    message,
    ...data,
  };
  console.warn(JSON.stringify(entry));
}

// ===========================================
// INTEGRATION SYNC WORKFLOW
// ===========================================
export async function IntegrationSyncWorkflow(
  input: IntegrationSyncWorkflowInput
): Promise<{ hubSpotId?: string; memoryGenerated: boolean; metaTracked: boolean }> {
  const { tenant, leadId, lead, conversationId, eventType } = input;
  const wfInfo = workflowInfo();

  // Set search attributes
  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['integration-sync'],
    lead_id: [leadId],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'IntegrationSync workflow started', {
    leadId,
    eventType,
  });

  const result = {
    hubSpotId: undefined as string | undefined,
    memoryGenerated: false,
    metaTracked: false,
  };

  // Get fresh lead data
  const currentLead = await getLeadById(leadId);
  if (!currentLead) {
    upsertSearchAttributes({ custom_status: ['skipped'] });
    log(tenant.tenantId, wfInfo.workflowId, 'Lead not found, skipping');
    return result;
  }

  // ===========================================
  // 1. HUBSPOT SYNC
  // ===========================================
  try {
    const hubspotResult = await syncLeadToHubSpot(currentLead);
    if (hubspotResult.success) {
      result.hubSpotId = hubspotResult.contactId;
      log(tenant.tenantId, wfInfo.workflowId, 'HubSpot sync completed', {
        contactId: result.hubSpotId,
      });
    } else {
      logWarn(tenant.tenantId, wfInfo.workflowId, 'HubSpot sync failed', {
        error: hubspotResult.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWarn(tenant.tenantId, wfInfo.workflowId, 'HubSpot sync error', { error: errorMessage });
    // Don't fail the workflow for HubSpot errors
  }

  // ===========================================
  // 2. META CONVERSIONS TRACKING
  // ===========================================
  try {
    const metaEventMap: Record<string, string> = {
      demo_scheduled: 'Schedule',
      lead_qualified: 'Lead',
      payment_completed: 'Purchase',
      conversation_ended: 'Contact',
    };

    const metaEvent = metaEventMap[eventType];
    if (metaEvent) {
      const metaResult = await trackMetaConversion(metaEvent, currentLead);
      result.metaTracked = metaResult.success;
      if (result.metaTracked) {
        log(tenant.tenantId, wfInfo.workflowId, 'Meta conversion tracked', {
          event: metaEvent,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWarn(tenant.tenantId, wfInfo.workflowId, 'Meta tracking error', { error: errorMessage });
    // Don't fail the workflow for Meta errors
  }

  // ===========================================
  // 3. MEMORY GENERATION (on conversation end)
  // ===========================================
  if (eventType === 'conversation_ended' && conversationId) {
    try {
      const messages = await getRecentMessages(conversationId, 50);
      if (messages.length > 0) {
        const memorySummary = await generateMemorySummary(leadId, messages);
        if (memorySummary) {
          await saveLeadMemory(leadId, memorySummary);
          result.memoryGenerated = true;
          log(tenant.tenantId, wfInfo.workflowId, 'Memory generated');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWarn(tenant.tenantId, wfInfo.workflowId, 'Memory generation error', { error: errorMessage });
      // Don't fail the workflow for memory errors
    }
  }

  upsertSearchAttributes({ custom_status: ['completed'] });
  log(tenant.tenantId, wfInfo.workflowId, 'IntegrationSync completed', {
    hubSpotSynced: !!result.hubSpotId,
    metaTracked: result.metaTracked,
    memoryGenerated: result.memoryGenerated,
  });

  return result;
}

// ===========================================
// BULK SYNC WORKFLOW
// ===========================================
export async function BulkSyncWorkflow(input: {
  tenant: TenantContext;
  leadIds: string[];
  batchSize?: number;
}): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { tenant, leadIds, batchSize = 10 } = input;
  const wfInfo = workflowInfo();

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['bulk-sync'],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'BulkSync workflow started', {
    leadCount: leadIds.length,
    batchSize,
  });

  const result = {
    synced: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process in batches
  for (let i = 0; i < leadIds.length; i += batchSize) {
    const batch = leadIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (leadId) => {
        try {
          const lead = await getLeadById(leadId);
          if (!lead) {
            result.failed++;
            result.errors.push(`Lead ${leadId} not found`);
            return;
          }

          const hubspotResult = await syncLeadToHubSpot(lead);
          if (hubspotResult.success) {
            result.synced++;
          } else {
            result.failed++;
            result.errors.push(`Lead ${leadId}: ${hubspotResult.error}`);
          }
        } catch (error) {
          result.failed++;
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Lead ${leadId}: ${message}`);
        }
      })
    );

    // Add delay between batches
    if (i + batchSize < leadIds.length) {
      await sleep('1 second');
    }

    log(tenant.tenantId, wfInfo.workflowId, 'Batch completed', {
      processed: Math.min(i + batchSize, leadIds.length),
      total: leadIds.length,
    });
  }

  upsertSearchAttributes({ custom_status: ['completed'] });
  log(tenant.tenantId, wfInfo.workflowId, 'BulkSync completed', {
    synced: result.synced,
    failed: result.failed,
  });

  return result;
}

// ===========================================
// MEMORY GENERATION WORKFLOW
// ===========================================
export async function MemoryGenerationWorkflow(
  input: MemoryGenerationWorkflowInput
): Promise<{ success: boolean; memory?: string; error?: string }> {
  const { tenant, leadId, conversationId } = input;
  const wfInfo = workflowInfo();

  upsertSearchAttributes({
    tenant_id: [tenant.tenantId],
    workflow_type: ['memory'],
    lead_id: [leadId],
    custom_status: ['processing'],
  });

  log(tenant.tenantId, wfInfo.workflowId, 'MemoryGeneration workflow started', {
    leadId,
    conversationId,
  });

  try {
    const messages = await getRecentMessages(conversationId, 50);
    if (messages.length === 0) {
      upsertSearchAttributes({ custom_status: ['skipped'] });
      log(tenant.tenantId, wfInfo.workflowId, 'No messages found, skipping');
      return { success: true, memory: undefined };
    }

    const memorySummary = await generateMemorySummary(leadId, messages);
    if (memorySummary) {
      await saveLeadMemory(leadId, memorySummary);
      upsertSearchAttributes({ custom_status: ['completed'] });
      log(tenant.tenantId, wfInfo.workflowId, 'Memory generated successfully');
      return { success: true, memory: memorySummary };
    }

    upsertSearchAttributes({ custom_status: ['completed'] });
    return { success: true, memory: undefined };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    upsertSearchAttributes({ custom_status: ['failed'] });
    log(tenant.tenantId, wfInfo.workflowId, 'MemoryGeneration failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

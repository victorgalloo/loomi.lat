/**
 * Tenant Knowledge & Tools
 * Shared functions for loading tenant documents and custom tools.
 * Used by both the WhatsApp webhook and sandbox chat endpoint.
 */

import { getSupabase } from '@/lib/memory/supabase';

export interface CustomToolDef {
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  executionType: 'webhook' | 'mock' | 'code';
  mockResponse?: unknown;
}

/**
 * Fetch tenant documents formatted as knowledge context
 */
export async function getTenantDocuments(tenantId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenant_documents')
      .select('name, content')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return null;

    const docsContext = data.map(d =>
      `### ${d.name}\n${d.content}`
    ).join('\n\n');

    return `# KNOWLEDGE BASE\nUsa esta información para responder preguntas:\n\n${docsContext}`;
  } catch (err) {
    console.error('[Knowledge] Error fetching documents:', err);
    return null;
  }
}

/**
 * Fetch tenant custom tools definitions
 */
export async function getTenantTools(tenantId: string): Promise<CustomToolDef[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tenant_tools')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map(t => ({
      name: t.name,
      displayName: t.display_name,
      description: t.description,
      parameters: t.parameters,
      executionType: t.execution_type,
      mockResponse: t.mock_response
    }));
  } catch (err) {
    console.error('[Knowledge] Error fetching tools:', err);
    return [];
  }
}

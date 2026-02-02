/**
 * /api/sandbox/tools
 * Manage custom tools per tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/memory/supabase';

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolParametersSchema {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

export interface TenantTool {
  id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description: string;
  parameters: ToolParametersSchema;
  executionType: 'webhook' | 'mock' | 'code';
  webhookUrl: string | null;
  webhookMethod: string;
  webhookHeaders: Record<string, string>;
  mockResponse: unknown;
  isActive: boolean;
  createdAt: string;
}

// GET - List tools for a tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('tenant_tools')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Tools] Error fetching:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tools' },
        { status: 500 }
      );
    }

    const tools: TenantTool[] = (data || []).map(t => ({
      id: t.id,
      tenantId: t.tenant_id,
      name: t.name,
      displayName: t.display_name,
      description: t.description,
      parameters: t.parameters as ToolParametersSchema,
      executionType: t.execution_type,
      webhookUrl: t.webhook_url,
      webhookMethod: t.webhook_method,
      webhookHeaders: t.webhook_headers as Record<string, string>,
      mockResponse: t.mock_response,
      isActive: t.is_active,
      createdAt: t.created_at
    }));

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('[Tools] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      name,
      displayName,
      description,
      parameters,
      executionType,
      webhookUrl,
      webhookMethod,
      webhookHeaders,
      mockResponse
    } = body;

    if (!tenantId || !name || !displayName || !description) {
      return NextResponse.json(
        { error: 'tenantId, name, displayName, and description are required' },
        { status: 400 }
      );
    }

    // Validate name format (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return NextResponse.json(
        { error: 'Tool name must be snake_case (lowercase, underscores, start with letter)' },
        { status: 400 }
      );
    }

    // Validate execution type
    const validTypes = ['webhook', 'mock', 'code'];
    if (executionType && !validTypes.includes(executionType)) {
      return NextResponse.json(
        { error: 'executionType must be: webhook, mock, or code' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('tenant_tools')
      .insert({
        tenant_id: tenantId,
        name,
        display_name: displayName,
        description,
        parameters: parameters || { type: 'object', properties: {} },
        execution_type: executionType || 'mock',
        webhook_url: webhookUrl || null,
        webhook_method: webhookMethod || 'POST',
        webhook_headers: webhookHeaders || {},
        mock_response: mockResponse || { success: true, message: 'Tool executed successfully' }
      })
      .select()
      .single();

    if (error) {
      console.error('[Tools] Error creating:', error);
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `Tool "${name}" already exists for this tenant` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create tool' },
        { status: 500 }
      );
    }

    const tool: TenantTool = {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      parameters: data.parameters as ToolParametersSchema,
      executionType: data.execution_type,
      webhookUrl: data.webhook_url,
      webhookMethod: data.webhook_method,
      webhookHeaders: data.webhook_headers as Record<string, string>,
      mockResponse: data.mock_response,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error('[Tools] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a tool
export async function DELETE(request: NextRequest) {
  try {
    const toolId = request.nextUrl.searchParams.get('id');

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('tenant_tools')
      .update({ is_active: false })
      .eq('id', toolId);

    if (error) {
      console.error('[Tools] Error deleting:', error);
      return NextResponse.json(
        { error: 'Failed to delete tool' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Tools] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

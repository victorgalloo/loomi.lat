/**
 * /api/sandbox/documents
 * Manage knowledge documents per tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/memory/supabase';

export interface TenantDocument {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  docType: 'text' | 'pdf' | 'url' | 'json';
  content: string;
  contentTokens: number | null;
  sourceUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isActive: boolean;
  createdAt: string;
}

// Approximate token count (rough estimate: 4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// GET - List documents for a tenant
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
      .from('tenant_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Documents] Error fetching:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    const documents: TenantDocument[] = (data || []).map(d => ({
      id: d.id,
      tenantId: d.tenant_id,
      name: d.name,
      description: d.description,
      docType: d.doc_type,
      content: d.content,
      contentTokens: d.content_tokens,
      sourceUrl: d.source_url,
      fileName: d.file_name,
      fileSize: d.file_size,
      isActive: d.is_active,
      createdAt: d.created_at
    }));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('[Documents] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, description, docType, content, sourceUrl, fileName, fileSize } = body;

    if (!tenantId || !name || !content) {
      return NextResponse.json(
        { error: 'tenantId, name, and content are required' },
        { status: 400 }
      );
    }

    // Limit content size (max 50KB for now)
    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content too large (max 50KB)' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('tenant_documents')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        doc_type: docType || 'text',
        content,
        content_tokens: estimateTokens(content),
        source_url: sourceUrl || null,
        file_name: fileName || null,
        file_size: fileSize || content.length
      })
      .select()
      .single();

    if (error) {
      console.error('[Documents] Error creating:', error);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    const document: TenantDocument = {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      docType: data.doc_type,
      content: data.content,
      contentTokens: data.content_tokens,
      sourceUrl: data.source_url,
      fileName: data.file_name,
      fileSize: data.file_size,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('[Documents] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a document
export async function DELETE(request: NextRequest) {
  try {
    const documentId = request.nextUrl.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('tenant_documents')
      .update({ is_active: false })
      .eq('id', documentId);

    if (error) {
      console.error('[Documents] Error deleting:', error);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Documents] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

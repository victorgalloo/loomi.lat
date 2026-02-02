'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Wrench, Plus, Trash2, ChevronRight, Upload, Link2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TenantDocument } from '@/app/api/sandbox/documents/route';
import type { TenantTool } from '@/app/api/sandbox/tools/route';

interface SandboxToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | undefined;
  onUpdate: () => void; // Callback when documents/tools change
}

type Tab = 'documents' | 'tools';

export function SandboxToolsPanel({ isOpen, onClose, tenantId, onUpdate }: SandboxToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [tools, setTools] = useState<TenantTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document form state
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docDescription, setDocDescription] = useState('');

  // Tool form state
  const [toolName, setToolName] = useState('');
  const [toolDisplayName, setToolDisplayName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolMockResponse, setToolMockResponse] = useState('{"success": true}');

  // Fetch data when panel opens
  useEffect(() => {
    if (isOpen && tenantId) {
      fetchDocuments();
      fetchTools();
    }
  }, [isOpen, tenantId]);

  const fetchDocuments = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/sandbox/documents?tenantId=${tenantId}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchTools = async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/sandbox/tools?tenantId=${tenantId}`);
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
    }
  };

  const createDocument = async () => {
    if (!tenantId || !docName || !docContent) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sandbox/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: docName,
          description: docDescription || undefined,
          content: docContent,
          docType: 'text'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create document');
      }

      setDocName('');
      setDocContent('');
      setDocDescription('');
      fetchDocuments();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating document');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await fetch(`/api/sandbox/documents?id=${id}`, { method: 'DELETE' });
      fetchDocuments();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const createTool = async () => {
    if (!tenantId || !toolName || !toolDisplayName || !toolDescription) return;

    setIsLoading(true);
    setError(null);

    try {
      let mockResponse = { success: true };
      try {
        mockResponse = JSON.parse(toolMockResponse);
      } catch {
        // Keep default if invalid JSON
      }

      const res = await fetch('/api/sandbox/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: toolName,
          displayName: toolDisplayName,
          description: toolDescription,
          executionType: 'mock',
          mockResponse
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tool');
      }

      setToolName('');
      setToolDisplayName('');
      setToolDescription('');
      setToolMockResponse('{"success": true}');
      fetchTools();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating tool');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTool = async (id: string) => {
    try {
      await fetch(`/api/sandbox/tools?id=${id}`, { method: 'DELETE' });
      fetchTools();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete tool:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-surface border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted" />
            <span className="text-sm font-medium text-foreground">Knowledge & Tools</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'documents'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted hover:text-foreground'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'tools'
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted hover:text-foreground'
            )}
          >
            <Wrench className="h-3.5 w-3.5" />
            Tools ({tools.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 px-3 py-2 rounded-md bg-[#FF5F56]/10 border border-[#FF5F56]/20 text-[#FF5F56] text-xs font-mono">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'documents' ? (
            <div className="space-y-4">
              {/* Add Document Form */}
              <div className="p-4 rounded-lg border border-border bg-background space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  Add Document
                </div>
                <input
                  type="text"
                  placeholder="Document name"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted font-mono focus:outline-none focus:border-muted"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted"
                />
                <textarea
                  placeholder="Paste content here... (text, FAQ, product info, etc.)"
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted font-mono focus:outline-none focus:border-muted resize-none"
                />
                <button
                  onClick={createDocument}
                  disabled={isLoading || !docName || !docContent}
                  className="w-full px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Add Document
                    </>
                  )}
                </button>
              </div>

              {/* Documents List */}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg border border-border bg-background hover:bg-surface transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {doc.name}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="mt-1 text-xs text-muted truncate">{doc.description}</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted font-mono">
                          ~{doc.contentTokens?.toLocaleString() || 0} tokens
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 rounded-md text-muted hover:text-[#FF5F56] hover:bg-[#FF5F56]/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-center text-xs text-muted py-8">
                    No documents yet. Add one above.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Tool Form */}
              <div className="p-4 rounded-lg border border-border bg-background space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                  Add Tool
                </div>
                <input
                  type="text"
                  placeholder="tool_name (snake_case)"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted font-mono focus:outline-none focus:border-muted"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={toolDisplayName}
                  onChange={(e) => setToolDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted"
                />
                <textarea
                  placeholder="Description for the AI (what does this tool do?)"
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-muted resize-none"
                />
                <div>
                  <label className="text-[10px] text-muted font-mono mb-1 block">
                    Mock Response (JSON)
                  </label>
                  <textarea
                    placeholder='{"success": true}'
                    value={toolMockResponse}
                    onChange={(e) => setToolMockResponse(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md bg-surface border border-border text-xs text-foreground placeholder:text-muted font-mono focus:outline-none focus:border-muted resize-none"
                  />
                </div>
                <button
                  onClick={createTool}
                  disabled={isLoading || !toolName || !toolDisplayName || !toolDescription}
                  className="w-full px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Wrench className="h-4 w-4" />
                      Add Tool
                    </>
                  )}
                </button>
              </div>

              {/* Tools List */}
              <div className="space-y-2">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 rounded-lg border border-border bg-background hover:bg-surface transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-[#27C93F] shrink-0" />
                          <span className="text-sm font-medium text-foreground">
                            {tool.displayName}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted font-mono">
                          {tool.name}()
                        </p>
                        <p className="mt-1 text-xs text-muted truncate">
                          {tool.description}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTool(tool.id)}
                        className="p-1.5 rounded-md text-muted hover:text-[#FF5F56] hover:bg-[#FF5F56]/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {tools.length === 0 && (
                  <p className="text-center text-xs text-muted py-8">
                    No tools yet. Add one above.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-border bg-surface-2">
          <p className="text-[10px] text-muted font-mono text-center">
            {activeTab === 'documents'
              ? 'documents are added to the agent context automatically'
              : 'tools are available for the agent to call during conversations'}
          </p>
        </div>
      </div>
    </div>
  );
}

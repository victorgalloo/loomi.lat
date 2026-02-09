'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, Wrench } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  parameters: Record<string, unknown>;
  executionType: 'webhook' | 'mock' | 'code';
  webhookUrl: string | null;
  mockResponse: unknown;
  createdAt: string;
}

interface ToolsViewProps {
  tenantId: string;
}

export default function ToolsView({ tenantId }: ToolsViewProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [toolName, setToolName] = useState('');
  const [toolDisplayName, setToolDisplayName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolExecutionType, setToolExecutionType] = useState<'mock' | 'webhook'>('mock');
  const [toolWebhookUrl, setToolWebhookUrl] = useState('');
  const [toolMockResponse, setToolMockResponse] = useState('{\n  "success": true,\n  "message": "Tool ejecutado correctamente"\n}');
  const [toolParameters, setToolParameters] = useState('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');

  const fetchTools = async () => {
    try {
      const res = await fetch(`/api/sandbox/tools?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !toolDisplayName.trim() || !toolDescription.trim()) return;

    let parsedParams;
    let parsedMock;
    try {
      parsedParams = JSON.parse(toolParameters);
    } catch {
      return;
    }
    try {
      parsedMock = JSON.parse(toolMockResponse);
    } catch {
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/sandbox/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: toolName.trim(),
          displayName: toolDisplayName.trim(),
          description: toolDescription.trim(),
          parameters: parsedParams,
          executionType: toolExecutionType,
          webhookUrl: toolExecutionType === 'webhook' ? toolWebhookUrl.trim() : null,
          mockResponse: parsedMock,
        }),
      });

      if (res.ok) {
        setToolName('');
        setToolDisplayName('');
        setToolDescription('');
        setToolExecutionType('mock');
        setToolWebhookUrl('');
        setToolMockResponse('{\n  "success": true,\n  "message": "Tool ejecutado correctamente"\n}');
        setToolParameters('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');
        setShowForm(false);
        await fetchTools();
      }
    } catch {
      // silent
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (toolId: string) => {
    setDeletingId(toolId);
    try {
      const res = await fetch(`/api/sandbox/tools?id=${toolId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTools(prev => prev.filter(t => t.id !== toolId));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const executionTypeLabel = (type: string) => {
    switch (type) {
      case 'webhook': return 'webhook';
      case 'mock': return 'mock';
      case 'code': return 'code';
      default: return type;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 font-mono">
          <Link
            href="/dashboard/agent"
            className="text-sm text-muted hover:text-foreground"
          >
            ./agente
          </Link>
          <span className="text-sm text-border">/</span>
          <span className="text-sm text-foreground">tools</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground font-mono">
              ./custom-tools_
            </h1>
            <p className="text-sm mt-1 text-muted">
              Herramientas que tu agente puede ejecutar durante conversaciones
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-4 h-4" />
            agregar
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-4 rounded-2xl border border-border bg-surface">
          <label className="block text-label font-medium mb-3 text-muted">
            nueva herramienta
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="nombre_snake_case"
                required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono"
              />
              <input
                type="text"
                value={toolDisplayName}
                onChange={(e) => setToolDisplayName(e.target.value)}
                placeholder="Nombre para mostrar"
                required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
              />
            </div>
            <input
              type="text"
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              placeholder="Descripción de qué hace esta herramienta"
              required
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />

            {/* Execution Type */}
            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                tipo de ejecución
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setToolExecutionType('mock')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-colors border ${
                    toolExecutionType === 'mock'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-surface text-muted border-border hover:text-foreground'
                  }`}
                >
                  mock
                </button>
                <button
                  type="button"
                  onClick={() => setToolExecutionType('webhook')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl transition-colors border ${
                    toolExecutionType === 'webhook'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-surface text-muted border-border hover:text-foreground'
                  }`}
                >
                  webhook
                </button>
              </div>
            </div>

            {toolExecutionType === 'webhook' && (
              <input
                type="url"
                value={toolWebhookUrl}
                onChange={(e) => setToolWebhookUrl(e.target.value)}
                placeholder="https://tu-api.com/endpoint"
                required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono"
              />
            )}

            {/* Parameters */}
            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                parámetros (JSON Schema)
              </label>
              <textarea
                value={toolParameters}
                onChange={(e) => setToolParameters(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Mock Response */}
            {toolExecutionType === 'mock' && (
              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  respuesta mock (JSON)
                </label>
                <textarea
                  value={toolMockResponse}
                  onChange={(e) => setToolMockResponse(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono text-xs leading-relaxed"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
              >
                cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating || !toolName.trim() || !toolDisplayName.trim() || !toolDescription.trim()}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 font-mono"
              >
                {isCreating ? 'guardando...' : './guardar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tools List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="w-10 h-10 text-border mx-auto mb-4" />
          <p className="text-sm text-muted">
            Sin herramientas aún
          </p>
          <p className="text-xs text-muted mt-1">
            Agrega herramientas para que tu agente pueda ejecutar acciones
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="p-4 rounded-2xl border border-border bg-surface-elevated shadow-subtle hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground font-mono truncate">
                      {tool.displayName}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-surface-2 text-muted font-mono flex-shrink-0">
                      {tool.name}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded font-mono flex-shrink-0 ${
                      tool.executionType === 'webhook'
                        ? 'bg-info/10 text-info'
                        : 'bg-surface-2 text-muted'
                    }`}>
                      {executionTypeLabel(tool.executionType)}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 ml-6">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 ml-6">
                    <span className="text-xs text-muted">
                      {new Date(tool.createdAt).toLocaleDateString()}
                    </span>
                    {tool.webhookUrl && (
                      <span className="text-xs text-muted truncate max-w-[200px]">
                        {tool.webhookUrl}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tool.id)}
                  disabled={deletingId === tool.id}
                  className="p-2 rounded transition-colors text-muted hover:text-terminal-red disabled:opacity-50"
                  title="Eliminar herramienta"
                >
                  {deletingId === tool.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-10 pt-6 border-t border-border flex gap-3 font-mono">
        <Link
          href="/dashboard/agent"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          config básica
        </Link>
        <Link
          href="/dashboard/agent/prompt"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          prompt
        </Link>
        <Link
          href="/dashboard/agent/knowledge"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          knowledge
        </Link>
      </div>
    </div>
  );
}

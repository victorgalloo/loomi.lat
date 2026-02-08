'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string | null;
  docType: string;
  content: string;
  contentTokens: number | null;
  fileSize: number | null;
  createdAt: string;
}

interface KnowledgeViewProps {
  tenantId: string;
}

export default function KnowledgeView({ tenantId }: KnowledgeViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docContent, setDocContent] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/sandbox/documents?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/sandbox/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: docName.trim(),
          description: docDescription.trim() || null,
          docType: 'text',
          content: docContent.trim(),
        }),
      });

      if (res.ok) {
        setDocName('');
        setDocDescription('');
        setDocContent('');
        setShowForm(false);
        await fetchDocuments();
      }
    } catch {
      // silent
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/sandbox/documents?id=${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
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
          <span className="text-sm text-foreground">knowledge</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground font-mono">
              ./knowledge-base_
            </h1>
            <p className="text-sm mt-1 text-muted">
              Documentos que tu agente usa como base de conocimiento
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
            nuevo documento
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Nombre del documento"
              required
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
            <input
              type="text"
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30"
            />
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Contenido del documento (FAQ, info de productos, políticas...)"
              rows={10}
              required
              className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors bg-background border border-border text-foreground placeholder:text-muted focus:border-foreground/30 font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted">
              Máximo 50KB de contenido. El agente usará este documento para responder preguntas.
            </p>
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
                disabled={isCreating || !docName.trim() || !docContent.trim()}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 font-mono"
              >
                {isCreating ? 'guardando...' : './guardar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 text-border mx-auto mb-4" />
          <p className="text-sm text-muted">
            Sin documentos aún
          </p>
          <p className="text-xs text-muted mt-1">
            Agrega documentos para que tu agente tenga contexto sobre tu negocio
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl border border-border bg-surface"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground font-mono truncate">
                      {doc.name}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded bg-surface-2 text-muted font-mono flex-shrink-0">
                      {doc.docType}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted mt-1 ml-6">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 ml-6">
                    <span className="text-xs text-muted">
                      {formatSize(doc.fileSize)}
                    </span>
                    {doc.contentTokens && (
                      <span className="text-xs text-muted">
                        ~{doc.contentTokens.toLocaleString()} tokens
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded transition-colors text-muted hover:text-terminal-red disabled:opacity-50"
                  title="Eliminar documento"
                >
                  {deletingId === doc.id ? (
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
          href="/dashboard/agent/tools"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          tools
        </Link>
      </div>
    </div>
  );
}

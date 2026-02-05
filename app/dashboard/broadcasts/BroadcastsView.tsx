'use client';

import { useState, useRef, DragEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Send, Upload, ChevronRight, X, FileText, AlertTriangle } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  template_name: string;
  template_language: string;
  template_components: unknown;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface BroadcastsViewProps {
  campaigns: Campaign[];
  tenantId: string;
}

type ModalStep = 'config' | 'csv' | 'confirm';

const statusColors: Record<string, string> = {
  draft: 'text-muted',
  sending: 'text-terminal-yellow',
  completed: 'text-terminal-green',
  failed: 'text-terminal-red',
};

const statusLabels: Record<string, string> = {
  draft: 'borrador',
  sending: 'enviando...',
  completed: 'completado',
  failed: 'fallido',
};

export default function BroadcastsView({ campaigns: initialCampaigns, tenantId }: BroadcastsViewProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('config');

  // Form state
  const [formName, setFormName] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formLanguage, setFormLanguage] = useState('es');
  const [formComponents, setFormComponents] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvTotal, setCsvTotal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.failed_count || 0), 0);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.template_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetModal = () => {
    setShowModal(false);
    setModalStep('config');
    setFormName('');
    setFormTemplate('');
    setFormLanguage('es');
    setFormComponents('');
    setCsvFile(null);
    setCsvPreview([]);
    setCsvTotal(0);
    setError('');
  };

  const parseCSVPreview = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split('\n');
    const separator = lines[0]?.includes(';') ? ';' : ',';
    const rows = lines.slice(0, 6).map(line =>
      line.split(separator).map(c => c.trim().replace(/"/g, ''))
    );
    setCsvPreview(rows);

    // Count valid rows (skip header if detected)
    const firstLine = lines[0]?.toLowerCase() || '';
    const hasHeader = firstLine.includes('phone') || firstLine.includes('nombre') || firstLine.includes('name') || firstLine.includes('telefono');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const validCount = dataLines.filter(l => {
      const phone = l.split(separator)[0]?.replace(/[^\d+]/g, '') || '';
      return phone.replace(/\D/g, '').length >= 8;
    }).length;
    setCsvTotal(validCount);
  }, []);

  const handleCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Solo se aceptan archivos .csv o .txt');
      return;
    }
    setCsvFile(file);
    setError('');
    parseCSVPreview(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) handleCSVFile(files[0]);
  };

  const handleSubmit = async () => {
    setCreating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('templateName', formTemplate);
      formData.append('language', formLanguage);
      if (formComponents.trim()) {
        formData.append('components', formComponents);
      }
      if (csvFile) {
        formData.append('csv', csvFile);
      }

      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al crear campaña');
        setCreating(false);
        return;
      }

      const newCampaign = await res.json();
      setCampaigns(prev => [newCampaign, ...prev]);
      resetModal();
      // Navigate to campaign detail
      router.push(`/dashboard/broadcasts/${newCampaign.id}`);
    } catch {
      setError('Error de red');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-terminal-red" />
            <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
            <div className="w-3 h-3 rounded-full bg-terminal-green" />
          </div>
          <span className="text-sm font-mono text-foreground ml-2">./broadcasts_</span>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono">campañas:</span>
            <span className="text-sm font-mono text-foreground">{totalCampaigns}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono">enviados:</span>
            <span className="text-sm font-mono text-terminal-green">{totalSent.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-mono">fallidos:</span>
            <span className="text-sm font-mono text-terminal-red">{totalFailed.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            nueva campaña
          </button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30"
            />
          </div>
        </div>

        {/* Campaign List */}
        <div className="divide-y divide-border">
          {filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Send className="w-10 h-10 text-muted mb-4" />
              <p className="text-sm text-muted font-mono mb-4">
                {searchQuery ? 'Sin resultados' : 'No hay campañas aún'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  crear primera campaña
                </button>
              )}
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => router.push(`/dashboard/broadcasts/${campaign.id}`)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface-2 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-mono text-foreground truncate">
                      {campaign.name}
                    </span>
                    <span className={`text-xs font-mono ${statusColors[campaign.status] || 'text-muted'}`}>
                      {statusLabels[campaign.status] || campaign.status}
                    </span>
                    {campaign.total_recipients > 0 && (
                      <span className="text-xs font-mono text-muted">
                        {campaign.sent_count.toLocaleString()}/{campaign.total_recipients.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted font-mono">
                    <span>template: {campaign.template_name}</span>
                    <span>{new Date(campaign.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetModal} />
          <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-surface overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
                </div>
                <span className="text-sm font-mono text-foreground ml-2">
                  ./nueva-campaña_{modalStep === 'config' ? '1' : modalStep === 'csv' ? '2' : '3'}/3
                </span>
              </div>
              <button onClick={resetModal} className="text-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-terminal-red/10 border border-terminal-red/20">
                  <AlertTriangle className="w-4 h-4 text-terminal-red flex-shrink-0" />
                  <span className="text-sm text-terminal-red font-mono">{error}</span>
                </div>
              )}

              {/* Step 1: Config */}
              {modalStep === 'config' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-mono mb-1.5">nombre de campaña</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Ej: Lanzamiento Edición 13"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-mono mb-1.5">nombre del template (Meta)</label>
                    <input
                      type="text"
                      value={formTemplate}
                      onChange={e => setFormTemplate(e.target.value)}
                      placeholder="Ej: growth_ed13"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-mono mb-1.5">idioma</label>
                    <select
                      value={formLanguage}
                      onChange={e => setFormLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:border-foreground/30"
                    >
                      <option value="es">Español (es)</option>
                      <option value="en">English (en)</option>
                      <option value="pt_BR">Portugués (pt_BR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-mono mb-1.5">
                      components (JSON, opcional)
                    </label>
                    <textarea
                      value={formComponents}
                      onChange={e => setFormComponents(e.target.value)}
                      placeholder='[{"type":"header","parameters":[{"type":"image","image":{"link":"https://..."}}]}]'
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: CSV Upload */}
              {modalStep === 'csv' && (
                <div className="space-y-4">
                  <div
                    onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={e => e.preventDefault()}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-foreground/50 bg-foreground/5'
                        : csvFile
                          ? 'border-terminal-green/30 bg-terminal-green/5'
                          : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleCSVFile(f);
                      }}
                      className="hidden"
                    />
                    {csvFile ? (
                      <>
                        <FileText className="w-8 h-8 text-terminal-green mb-2" />
                        <span className="text-sm font-mono text-foreground">{csvFile.name}</span>
                        <span className="text-xs font-mono text-terminal-green mt-1">
                          {csvTotal.toLocaleString()} contactos detectados
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted mb-2" />
                        <span className="text-sm font-mono text-muted">
                          Arrastra un CSV o haz clic
                        </span>
                        <span className="text-xs font-mono text-muted mt-1">
                          Columnas: phone (obligatorio), name (opcional)
                        </span>
                      </>
                    )}
                  </div>

                  {/* CSV Preview */}
                  {csvPreview.length > 0 && (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-background">
                        <span className="text-xs font-mono text-muted">preview (primeras 5 filas)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <tbody>
                            {csvPreview.map((row, i) => (
                              <tr key={i} className={i === 0 ? 'bg-background' : ''}>
                                {row.map((cell, j) => (
                                  <td key={j} className="px-3 py-1.5 text-foreground border-b border-border/50 truncate max-w-[150px]">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Confirm */}
              {modalStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted">campaña</span>
                      <span className="text-sm font-mono text-foreground">{formName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted">template</span>
                      <span className="text-sm font-mono text-foreground">{formTemplate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted">idioma</span>
                      <span className="text-sm font-mono text-foreground">{formLanguage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted">destinatarios</span>
                      <span className="text-sm font-mono text-terminal-green">{csvTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terminal-yellow/10 border border-terminal-yellow/20">
                    <AlertTriangle className="w-4 h-4 text-terminal-yellow flex-shrink-0" />
                    <span className="text-xs text-terminal-yellow font-mono">
                      Se creará la campaña con {csvTotal.toLocaleString()} destinatarios. Podrás enviar desde la vista de detalle.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <button
                onClick={() => {
                  if (modalStep === 'csv') setModalStep('config');
                  else if (modalStep === 'confirm') setModalStep('csv');
                  else resetModal();
                }}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-mono text-muted hover:text-foreground transition-colors"
              >
                {modalStep === 'config' ? 'cancelar' : 'atrás'}
              </button>

              {modalStep === 'config' && (
                <button
                  onClick={() => {
                    if (!formName.trim() || !formTemplate.trim()) {
                      setError('Nombre y template son requeridos');
                      return;
                    }
                    if (formComponents.trim()) {
                      try { JSON.parse(formComponents); } catch {
                        setError('JSON de components inválido');
                        return;
                      }
                    }
                    setError('');
                    setModalStep('csv');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
                >
                  siguiente
                </button>
              )}

              {modalStep === 'csv' && (
                <button
                  onClick={() => {
                    if (!csvFile || csvTotal === 0) {
                      setError('Sube un CSV con al menos 1 contacto válido');
                      return;
                    }
                    setError('');
                    setModalStep('confirm');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
                >
                  siguiente
                </button>
              )}

              {modalStep === 'confirm' && (
                <button
                  onClick={handleSubmit}
                  disabled={creating}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {creating ? 'creando...' : './crear-campaña'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

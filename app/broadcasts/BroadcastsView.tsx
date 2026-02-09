'use client';

import { useState, useRef, useEffect, DragEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Send, Upload, ChevronRight, X, FileText, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

interface MetaTemplate {
  name: string;
  language: string;
  category: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string }>;
    example?: { body_text?: string[][] };
  }>;
}

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
type Lang = 'en' | 'es';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-2 text-muted border-border',
  sending: 'bg-terminal-yellow/10 text-terminal-yellow border-terminal-yellow/20',
  completed: 'bg-terminal-green/10 text-terminal-green border-terminal-green/20',
  failed: 'bg-terminal-red/10 text-terminal-red border-terminal-red/20',
};

const i18n: Record<Lang, Record<string, string>> = {
  en: {
    campaigns: 'campaigns',
    sent: 'sent',
    failed: 'failed',
    newCampaign: 'new campaign',
    search: 'search...',
    noResults: 'No results',
    noCampaigns: 'No campaigns yet',
    createFirst: 'create first campaign',
    draft: 'draft',
    sending: 'sending...',
    completed: 'completed',
    failedStatus: 'failed',
    campaignName: 'campaign name',
    campaignNamePlaceholder: 'e.g. Launch Edition 13',
    approvedTemplate: 'approved template',
    loadingTemplates: 'loading templates from Meta...',
    noTemplates: 'No approved templates found',
    templatePreview: 'template preview',
    templateVariables: 'template variables',
    variablePlaceholder: 'Value for',
    noVariables: 'This template has no variables',
    useNameFromCsv: 'Use name from CSV',
    fixedValue: 'Fixed value',
    dragCsv: 'Drag a CSV or click',
    csvColumns: 'Columns: phone (required), name (optional)',
    contactsDetected: 'contacts detected',
    csvPreview: 'preview (first 5 rows)',
    campaign: 'campaign',
    template: 'template',
    language: 'language',
    recipients: 'recipients',
    variables: 'variables',
    fromCsv: '(from CSV)',
    confirmWarning: 'Campaign will be created with {count} recipients. You can send from the detail view.',
    cancel: 'cancel',
    back: 'back',
    next: 'next',
    creating: 'creating...',
    createCampaign: './create-campaign',
    nameRequired: 'Campaign name is required',
    selectTemplate: 'Select a template',
    csvRequired: 'Upload a CSV with at least 1 valid contact',
    variablesRequired: 'Fill all template variables (or select "Use name from CSV")',
    networkError: 'Network error',
    createError: 'Error creating campaign',
    csvOnly: 'Only .csv or .txt files accepted',
    templateLoadError: 'Could not load templates',
  },
  es: {
    campaigns: 'campañas',
    sent: 'enviados',
    failed: 'fallidos',
    newCampaign: 'nueva campaña',
    search: 'buscar...',
    noResults: 'Sin resultados',
    noCampaigns: 'No hay campañas aún',
    createFirst: 'crear primera campaña',
    draft: 'borrador',
    sending: 'enviando...',
    completed: 'completado',
    failedStatus: 'fallido',
    campaignName: 'nombre de campaña',
    campaignNamePlaceholder: 'Ej: Lanzamiento Edición 13',
    approvedTemplate: 'template aprobado',
    loadingTemplates: 'cargando templates de Meta...',
    noTemplates: 'No se encontraron templates aprobados',
    templatePreview: 'preview del template',
    templateVariables: 'variables del template',
    variablePlaceholder: 'Valor para',
    noVariables: 'Este template no tiene variables',
    useNameFromCsv: 'Usar nombre del CSV',
    fixedValue: 'Valor fijo',
    dragCsv: 'Arrastra un CSV o haz clic',
    csvColumns: 'Columnas: phone (obligatorio), name (opcional)',
    contactsDetected: 'contactos detectados',
    csvPreview: 'preview (primeras 5 filas)',
    campaign: 'campaña',
    template: 'template',
    language: 'idioma',
    recipients: 'destinatarios',
    variables: 'variables',
    fromCsv: '(del CSV)',
    confirmWarning: 'Se creará la campaña con {count} destinatarios. Podrás enviar desde la vista de detalle.',
    cancel: 'cancelar',
    back: 'atrás',
    next: 'siguiente',
    creating: 'creando...',
    createCampaign: './crear-campaña',
    nameRequired: 'Nombre de campaña es requerido',
    selectTemplate: 'Selecciona un template',
    csvRequired: 'Sube un CSV con al menos 1 contacto válido',
    variablesRequired: 'Completa todas las variables (o selecciona "Usar nombre del CSV")',
    networkError: 'Error de red',
    createError: 'Error al crear campaña',
    csvOnly: 'Solo se aceptan archivos .csv o .txt',
    templateLoadError: 'No se pudieron cargar los templates',
  },
};

export default function BroadcastsView({ campaigns: initialCampaigns, tenantId }: BroadcastsViewProps) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = i18n[lang];
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('config');

  // Templates from Meta
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formLanguage, setFormLanguage] = useState('');
  const [formVariables, setFormVariables] = useState<Record<string, string>>({});
  const [formVariableSource, setFormVariableSource] = useState<Record<string, 'fixed' | 'csv_name'>>({});
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

  // Fetch templates when modal opens
  useEffect(() => {
    if (!showModal || templatesLoaded) return;
    setLoadingTemplates(true);
    fetch('/api/broadcasts/templates')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: MetaTemplate[]) => {
        setTemplates(data);
        setTemplatesLoaded(true);
      })
      .catch(() => setError(t.templateLoadError))
      .finally(() => setLoadingTemplates(false));
  }, [showModal, templatesLoaded]);

  const selectedTemplate = templates.find(t => t.name === formTemplate && t.language === formLanguage);

  const getTemplatePreview = (tmpl: MetaTemplate) => {
    const body = tmpl.components.find(c => c.type === 'BODY');
    return body?.text || '';
  };

  // Extract variables like {{1}}, {{2}} from template text
  const extractVariables = (tmpl: MetaTemplate): { type: 'header' | 'body'; index: number; placeholder: string }[] => {
    const vars: { type: 'header' | 'body'; index: number; placeholder: string }[] = [];

    // Check header
    const header = tmpl.components.find(c => c.type === 'HEADER');
    if (header?.text) {
      const headerMatches = header.text.match(/\{\{(\d+)\}\}/g) || [];
      headerMatches.forEach(match => {
        const num = parseInt(match.replace(/[{}]/g, ''));
        vars.push({ type: 'header', index: num, placeholder: `Header {{${num}}}` });
      });
    }

    // Check body
    const body = tmpl.components.find(c => c.type === 'BODY');
    if (body?.text) {
      const bodyMatches = body.text.match(/\{\{(\d+)\}\}/g) || [];
      bodyMatches.forEach(match => {
        const num = parseInt(match.replace(/[{}]/g, ''));
        vars.push({ type: 'body', index: num, placeholder: `Body {{${num}}}` });
      });
    }

    return vars;
  };

  const templateVariables = selectedTemplate ? extractVariables(selectedTemplate) : [];

  // Build template_components for API
  // Variables with source 'csv_name' will have text: '{{csv_name}}' as placeholder
  const buildTemplateComponents = () => {
    if (!selectedTemplate || templateVariables.length === 0) return undefined;

    const components: Array<{
      type: string;
      parameters: Array<{ type: string; text: string }>;
    }> = [];

    // Group by type
    const headerVars = templateVariables.filter(v => v.type === 'header');
    const bodyVars = templateVariables.filter(v => v.type === 'body');

    if (headerVars.length > 0) {
      components.push({
        type: 'header',
        parameters: headerVars.map(v => {
          const key = `${v.type}_${v.index}`;
          const source = formVariableSource[key] || 'fixed';
          return {
            type: 'text',
            text: source === 'csv_name' ? '{{csv_name}}' : (formVariables[key] || ''),
          };
        }),
      });
    }

    if (bodyVars.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVars.map(v => {
          const key = `${v.type}_${v.index}`;
          const source = formVariableSource[key] || 'fixed';
          return {
            type: 'text',
            text: source === 'csv_name' ? '{{csv_name}}' : (formVariables[key] || ''),
          };
        }),
      });
    }

    return components;
  };

  const resetModal = () => {
    setShowModal(false);
    setModalStep('config');
    setFormName('');
    setFormTemplate('');
    setFormLanguage('');
    setFormVariables({});
    setFormVariableSource({});
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
      setError(t.csvOnly);
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
      const components = buildTemplateComponents();
      if (components) {
        formData.append('components', JSON.stringify(components));
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
        setError(data.error || t.createError);
        setCreating(false);
        return;
      }

      const newCampaign = await res.json();
      setCampaigns(prev => [newCampaign, ...prev]);
      resetModal();
      // Navigate to campaign detail
      router.push(`/broadcasts/${newCampaign.id}`);
    } catch {
      setError(t.networkError);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-foreground font-mono">./broadcasts_</h1>
        <button
          onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
          className="text-xs font-mono text-muted hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
        >
          {lang === 'en' ? 'ES' : 'EN'}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 text-sm pb-6 mb-6 border-b border-border">
        <div>
          <span className="text-muted">{t.campaigns}</span>
          <span className="ml-2 font-mono text-foreground">{totalCampaigns}</span>
        </div>
        <span className="text-border">·</span>
        <div>
          <span className="text-muted">{t.sent}</span>
          <span className="ml-2 font-mono text-terminal-green">{totalSent.toLocaleString()}</span>
        </div>
        <span className="text-border">·</span>
        <div>
          <span className="text-muted">{t.failed}</span>
          <span className="ml-2 font-mono text-terminal-red">{totalFailed.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t.newCampaign}
          </button>
          <a
            href="https://business.facebook.com/latest/whatsapp_manager/message_templates"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="font-mono">templates</span>
          </a>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-info/30"
          />
        </div>
      </div>

      {/* Campaign List */}
      <div className="divide-y divide-border border-t border-border">
        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Send className="w-10 h-10 text-muted mb-4" />
            <p className="text-sm text-muted mb-4">
              {searchQuery ? t.noResults : t.noCampaigns}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                {t.createFirst}
              </button>
            )}
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => router.push(`/broadcasts/${campaign.id}`)}
              className="w-full flex items-center justify-between py-3 -mx-3 px-3 rounded-xl hover:bg-surface-2 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm text-foreground truncate">
                    {campaign.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[campaign.status] || 'bg-surface-2 text-muted border-border'}`}>
                    {({draft: t.draft, sending: t.sending, completed: t.completed, failed: t.failedStatus})[campaign.status] || campaign.status}
                  </span>
                  {campaign.total_recipients > 0 && (
                    <span className="text-xs font-mono text-muted">
                      {campaign.sent_count.toLocaleString()}/{campaign.total_recipients.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
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

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetModal} />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-surface-elevated overflow-hidden max-h-[90vh] flex flex-col shadow-elevated">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                  <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
                </div>
                <span className="text-sm font-mono text-foreground ml-2">
                  ./new-campaign_{modalStep === 'config' ? '1' : modalStep === 'csv' ? '2' : '3'}/3
                </span>
              </div>
              <button onClick={resetModal} className="text-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-2xl bg-terminal-red/10 border border-terminal-red/20">
                  <AlertTriangle className="w-4 h-4 text-terminal-red flex-shrink-0" />
                  <span className="text-sm text-terminal-red font-mono">{error}</span>
                </div>
              )}

              {/* Step 1: Config */}
              {modalStep === 'config' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-label text-muted mb-2.5">{t.campaignName}</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder={t.campaignNamePlaceholder}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-info/30"
                    />
                  </div>

                  {/* Template Selector */}
                  <div>
                    <label className="block text-label text-muted mb-2.5">{t.approvedTemplate}</label>
                    {loadingTemplates ? (
                      <div className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-background border border-border">
                        <Loader2 className="w-4 h-4 animate-spin text-muted" />
                        <span className="text-xs font-mono text-muted">{t.loadingTemplates}</span>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="px-3 py-3 rounded-2xl bg-background border border-border space-y-2">
                        <span className="text-xs font-mono text-muted block">{t.noTemplates}</span>
                        <a
                          href="https://business.facebook.com/latest/whatsapp_manager/message_templates"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-info hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {lang === 'es' ? 'Crear templates en Meta' : 'Create templates on Meta'}
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto rounded-2xl border border-border">
                        {templates.map((t, i) => {
                          const isSelected = formTemplate === t.name && formLanguage === t.language;
                          const preview = getTemplatePreview(t);
                          return (
                            <button
                              key={`${t.name}-${t.language}-${i}`}
                              type="button"
                              onClick={() => {
                                setFormTemplate(t.name);
                                setFormLanguage(t.language);
                              }}
                              className={`w-full text-left px-3 py-2.5 transition-colors ${
                                isSelected
                                  ? 'bg-foreground/10 border-l-2 border-l-info'
                                  : 'hover:bg-surface-2 border-l-2 border-l-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-mono text-foreground">{t.name}</span>
                                <span className="text-xs text-muted px-1.5 py-0.5 rounded bg-background border border-border">
                                  {t.language}
                                </span>
                                <span className="text-xs text-muted">
                                  {t.category.toLowerCase()}
                                </span>
                              </div>
                              {preview && (
                                <p className="text-xs text-muted truncate">{preview}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected template preview */}
                  {selectedTemplate && (
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <span className="text-xs text-muted block mb-1">{t.templatePreview}</span>
                      <p className="text-xs font-mono text-foreground whitespace-pre-wrap">
                        {getTemplatePreview(selectedTemplate)}
                      </p>
                    </div>
                  )}

                  {/* Template Variables */}
                  {selectedTemplate && (
                    <div>
                      <label className="block text-label text-muted mb-2.5">{t.templateVariables}</label>
                      {templateVariables.length === 0 ? (
                        <div className="px-3 py-2 rounded-2xl bg-background border border-border">
                          <span className="text-xs text-muted">{t.noVariables}</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {templateVariables.map((v) => {
                            const key = `${v.type}_${v.index}`;
                            const source = formVariableSource[key] || 'fixed';
                            return (
                              <div key={key} className="rounded-2xl border border-border bg-background p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-mono text-foreground">
                                    {v.placeholder}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setFormVariableSource(prev => ({ ...prev, [key]: 'fixed' }))}
                                      className={`text-xs px-3 py-1.5 rounded transition-colors ${
                                        source === 'fixed'
                                          ? 'bg-foreground text-background'
                                          : 'bg-surface-2 text-muted hover:text-foreground'
                                      }`}
                                    >
                                      {t.fixedValue}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFormVariableSource(prev => ({ ...prev, [key]: 'csv_name' }))}
                                      className={`text-xs px-3 py-1.5 rounded transition-colors ${
                                        source === 'csv_name'
                                          ? 'bg-info text-background'
                                          : 'bg-surface-2 text-muted hover:text-foreground'
                                      }`}
                                    >
                                      {t.useNameFromCsv}
                                    </button>
                                  </div>
                                </div>
                                {source === 'fixed' ? (
                                  <input
                                    type="text"
                                    value={formVariables[key] || ''}
                                    onChange={e => setFormVariables(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder={`${t.variablePlaceholder} ${v.placeholder}`}
                                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30"
                                  />
                                ) : (
                                  <div className="px-3 py-1.5 rounded-xl bg-info/10 border border-info/20 text-sm font-mono text-info">
                                    → recipient.name
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

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
                    className={`flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-foreground/50 bg-foreground/5'
                        : csvFile
                          ? 'border-info/30 bg-info/5'
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
                        <FileText className="w-8 h-8 text-info mb-2" />
                        <span className="text-sm text-foreground">{csvFile.name}</span>
                        <span className="text-xs text-info mt-1">
                          {csvTotal.toLocaleString()} {t.contactsDetected}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted mb-2" />
                        <span className="text-sm text-muted">
                          {t.dragCsv}
                        </span>
                        <span className="text-xs text-muted mt-1">
                          {t.csvColumns}
                        </span>
                      </>
                    )}
                  </div>

                  {/* CSV Preview */}
                  {csvPreview.length > 0 && (
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-background">
                        <span className="text-xs text-muted">{t.csvPreview}</span>
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
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-label text-muted">{t.campaign}</span>
                      <span className="text-sm font-mono text-foreground">{formName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-muted">{t.template}</span>
                      <span className="text-sm font-mono text-foreground">{formTemplate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-muted">{t.language}</span>
                      <span className="text-sm font-mono text-foreground">{formLanguage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label text-muted">{t.recipients}</span>
                      <span className="text-sm font-mono text-info">{csvTotal.toLocaleString()}</span>
                    </div>
                    {templateVariables.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-xs text-muted block mb-2">{t.variables}</span>
                        {templateVariables.map(v => {
                          const key = `${v.type}_${v.index}`;
                          const source = formVariableSource[key] || 'fixed';
                          return (
                            <div key={key} className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted">{v.placeholder}</span>
                              {source === 'csv_name' ? (
                                <span className="font-mono text-info">recipient.name {t.fromCsv}</span>
                              ) : (
                                <span className="font-mono text-foreground">{formVariables[key]}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-terminal-yellow/10 border border-terminal-yellow/20">
                    <AlertTriangle className="w-4 h-4 text-terminal-yellow flex-shrink-0" />
                    <span className="text-xs text-terminal-yellow font-mono">
                      {t.confirmWarning.replace('{count}', csvTotal.toLocaleString())}
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
                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-muted hover:text-foreground transition-colors"
              >
                {modalStep === 'config' ? t.cancel : t.back}
              </button>

              {modalStep === 'config' && (
                <button
                  onClick={() => {
                    if (!formName.trim()) {
                      setError(t.nameRequired);
                      return;
                    }
                    if (!formTemplate) {
                      setError(t.selectTemplate);
                      return;
                    }
                    // Check all variables are filled (either fixed value or csv_name)
                    const missingVars = templateVariables.some(v => {
                      const key = `${v.type}_${v.index}`;
                      const source = formVariableSource[key] || 'fixed';
                      // If using csv_name, it's valid
                      if (source === 'csv_name') return false;
                      // If fixed, must have a value
                      return !formVariables[key]?.trim();
                    });
                    if (missingVars) {
                      setError(t.variablesRequired);
                      return;
                    }
                    setError('');
                    setModalStep('csv');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
                >
                  {t.next}
                </button>
              )}

              {modalStep === 'csv' && (
                <button
                  onClick={() => {
                    if (!csvFile || csvTotal === 0) {
                      setError(t.csvRequired);
                      return;
                    }
                    setError('');
                    setModalStep('confirm');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity"
                >
                  {t.next}
                </button>
              )}

              {modalStep === 'confirm' && (
                <button
                  onClick={handleSubmit}
                  disabled={creating}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {creating ? t.creating : t.createCampaign}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

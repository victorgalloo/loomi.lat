'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import BroadcastConversations from './BroadcastConversations';

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

interface Recipient {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  error_message: string | null;
  wa_message_id: string | null;
  sent_at: string | null;
}

interface CampaignDetailViewProps {
  campaign: Campaign;
  recipients: Recipient[];
  tenantId: string;
}

type Lang = 'en' | 'es';

const recipientStatusColors: Record<string, string> = {
  pending: 'text-muted',
  sent: 'text-terminal-green',
  failed: 'text-terminal-red',
};

const campaignStatusColors: Record<string, string> = {
  draft: 'text-muted',
  sending: 'text-terminal-yellow',
  completed: 'text-terminal-green',
  failed: 'text-terminal-red',
};

const i18n: Record<Lang, Record<string, string>> = {
  en: {
    total: 'total',
    sent: 'sent',
    failed: 'failed',
    pending: 'pending',
    sending: 'sending...',
    sendingProgress: 'Sending... {pct}% completed',
    phone: 'phone',
    name: 'name',
    status: 'status',
    sentAt: 'sent at',
    error: 'error',
    noRecipients: 'No recipients',
    sendBroadcast: './send-broadcast',
    sendError: 'Error sending',
    networkError: 'Network error',
    confirmTitle: './confirm-send_',
    confirmWarning: 'This action will send {count} WhatsApp messages',
    cancel: 'cancel',
    confirmSend: 'confirm send',
    draft: 'draft',
    completed: 'completed',
    failedStatus: 'failed',
    recipientPending: 'pending',
    recipientSent: 'sent',
    recipientFailed: 'failed',
  },
  es: {
    total: 'total',
    sent: 'enviados',
    failed: 'fallidos',
    pending: 'pendientes',
    sending: 'enviando...',
    sendingProgress: 'Enviando... {pct}% completado',
    phone: 'teléfono',
    name: 'nombre',
    status: 'status',
    sentAt: 'enviado',
    error: 'error',
    noRecipients: 'Sin destinatarios',
    sendBroadcast: './enviar-broadcast',
    sendError: 'Error al enviar',
    networkError: 'Error de red',
    confirmTitle: './confirmar-envío_',
    confirmWarning: 'Esta acción enviará {count} mensajes de WhatsApp',
    cancel: 'cancelar',
    confirmSend: 'confirmar envío',
    draft: 'borrador',
    completed: 'completado',
    failedStatus: 'fallido',
    recipientPending: 'pendiente',
    recipientSent: 'enviado',
    recipientFailed: 'fallido',
  },
};

export default function CampaignDetailView({
  campaign: initialCampaign,
  recipients: initialRecipients,
  tenantId,
}: CampaignDetailViewProps) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const t = i18n[lang];
  const [campaign, setCampaign] = useState(initialCampaign);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const pendingCount = recipients.filter(r => r.status === 'pending').length;
  const sentCount = recipients.filter(r => r.status === 'sent').length;
  const failedCount = recipients.filter(r => r.status === 'failed').length;
  const totalCount = recipients.length;
  const progress = totalCount > 0 ? ((sentCount + failedCount) / totalCount) * 100 : 0;

  const campaignStatusLabel = ({draft: t.draft, sending: t.sending, completed: t.completed, failed: t.failedStatus})[campaign.status] || campaign.status;
  const getRecipientStatus = (status: string) => ({pending: t.recipientPending, sent: t.recipientSent, failed: t.recipientFailed})[status] || status;

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`/api/broadcasts/${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign({
          id: data.id,
          name: data.name,
          template_name: data.template_name,
          template_language: data.template_language,
          template_components: data.template_components,
          status: data.status,
          total_recipients: data.total_recipients,
          sent_count: data.sent_count,
          failed_count: data.failed_count,
          started_at: data.started_at,
          completed_at: data.completed_at,
          created_at: data.created_at,
        });
        if (data.recipients) {
          setRecipients(data.recipients);
        }
      }
    } catch {
      // ignore
    }
  }, [campaign.id]);

  // Auto-refresh while sending
  useEffect(() => {
    if (campaign.status !== 'sending') return;
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [campaign.status, refreshData]);

  const handleSend = async () => {
    setSending(true);
    setError('');
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/broadcasts/${campaign.id}/send`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.sendError);
        setSending(false);
        return;
      }

      // Refresh data after completion
      await refreshData();
    } catch {
      setError(t.networkError);
    } finally {
      setSending(false);
    }
  };

  const canSend = (campaign.status === 'draft' || campaign.status === 'failed') && pendingCount > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-sm font-mono text-foreground ml-2">./campaign-detail_</span>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="text-xs font-mono text-muted hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
        </div>

        {/* Back + Title */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/broadcasts')}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-mono text-foreground">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-mono text-muted">
                  template: {campaign.template_name}
                </span>
                <span className="text-xs font-mono text-muted">
                  lang: {campaign.template_language}
                </span>
                <span className={`text-xs font-mono ${campaignStatusColors[campaign.status] || 'text-muted'}`}>
                  {campaignStatusLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {canSend && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={sending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? t.sending : t.sendBroadcast}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-terminal-red/5">
            <AlertTriangle className="w-4 h-4 text-terminal-red flex-shrink-0" />
            <span className="text-sm text-terminal-red font-mono">{error}</span>
          </div>
        )}

        {/* Progress & Stats */}
        <div className="px-4 py-4 border-b border-border space-y-3">
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full flex">
              {sentCount > 0 && (
                <div
                  className="h-full bg-terminal-green transition-all duration-500"
                  style={{ width: `${(sentCount / totalCount) * 100}%` }}
                />
              )}
              {failedCount > 0 && (
                <div
                  className="h-full bg-terminal-red transition-all duration-500"
                  style={{ width: `${(failedCount / totalCount) * 100}%` }}
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono">{t.total}:</span>
              <span className="text-sm font-mono text-foreground">{totalCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terminal-green" />
              <span className="text-xs text-muted font-mono">{t.sent}:</span>
              <span className="text-sm font-mono text-terminal-green">{sentCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terminal-red" />
              <span className="text-xs text-muted font-mono">{t.failed}:</span>
              <span className="text-sm font-mono text-terminal-red">{failedCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-xs text-muted font-mono">{t.pending}:</span>
              <span className="text-sm font-mono text-muted">{pendingCount.toLocaleString()}</span>
            </div>
          </div>

          {campaign.status === 'sending' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-terminal-yellow border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-terminal-yellow">
                {t.sendingProgress.replace('{pct}', String(Math.round(progress)))}
              </span>
            </div>
          )}
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-4 py-2 text-xs font-mono text-muted font-normal">{t.phone}</th>
                <th className="text-left px-4 py-2 text-xs font-mono text-muted font-normal">{t.name}</th>
                <th className="text-left px-4 py-2 text-xs font-mono text-muted font-normal">{t.status}</th>
                <th className="text-left px-4 py-2 text-xs font-mono text-muted font-normal">{t.sentAt}</th>
                <th className="text-left px-4 py-2 text-xs font-mono text-muted font-normal">{t.error}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recipients.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-2 font-mono text-foreground">{r.phone}</td>
                  <td className="px-4 py-2 font-mono text-muted">{r.name || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`font-mono text-xs ${recipientStatusColors[r.status] || 'text-muted'}`}>
                      {getRecipientStatus(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted">
                    {r.sent_at
                      ? new Date(r.sent_at).toLocaleTimeString(lang === 'es' ? 'es-MX' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-terminal-red truncate max-w-[200px]">
                    {r.error_message || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recipients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-sm text-muted font-mono">{t.noRecipients}</span>
          </div>
        )}
      </div>

      <BroadcastConversations
        campaignId={campaign.id}
        campaignStartedAt={campaign.started_at}
        lang={lang}
        totalSent={sentCount}
      />

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-sm mx-4 rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
              </div>
              <span className="text-sm font-mono text-foreground ml-2">{t.confirmTitle}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terminal-yellow/10 border border-terminal-yellow/20">
                <AlertTriangle className="w-4 h-4 text-terminal-yellow flex-shrink-0" />
                <span className="text-xs text-terminal-yellow font-mono">
                  {t.confirmWarning.replace('{count}', pendingCount.toLocaleString())}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-mono text-muted hover:text-foreground transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-mono hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? t.sending : t.confirmSend}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

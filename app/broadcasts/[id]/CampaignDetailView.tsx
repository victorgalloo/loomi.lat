'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import BroadcastConversations from './BroadcastConversations';
import StatCard from '@/components/dashboard/StatCard';

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
  pending: 'bg-surface-2 text-muted border-border',
  sent: 'bg-terminal-yellow/10 text-terminal-yellow border-terminal-yellow/20',
  delivered: 'bg-terminal-green/10 text-terminal-green border-terminal-green/20',
  read: 'bg-info/10 text-info border-info/20',
  failed: 'bg-terminal-red/10 text-terminal-red border-terminal-red/20',
};

const campaignStatusColors: Record<string, string> = {
  draft: 'bg-surface-2 text-muted border-border',
  sending: 'bg-terminal-yellow/10 text-terminal-yellow border-terminal-yellow/20',
  completed: 'bg-terminal-green/10 text-terminal-green border-terminal-green/20',
  failed: 'bg-terminal-red/10 text-terminal-red border-terminal-red/20',
};

const i18n: Record<Lang, Record<string, string>> = {
  en: {
    total: 'total',
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
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
    sendBroadcast: 'Send Broadcast',
    sendError: 'Error sending',
    networkError: 'Network error',
    confirmTitle: 'Confirm Send',
    confirmWarning: 'This action will send {count} WhatsApp messages',
    cancel: 'Cancel',
    confirmSend: 'Confirm Send',
    draft: 'draft',
    completed: 'completed',
    failedStatus: 'failed',
    recipientPending: 'pending',
    recipientSent: 'sent',
    recipientDelivered: 'delivered',
    recipientRead: 'read',
    recipientFailed: 'failed',
  },
  es: {
    total: 'total',
    sent: 'enviados',
    delivered: 'entregados',
    read: 'leídos',
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
    sendBroadcast: 'Enviar Broadcast',
    sendError: 'Error al enviar',
    networkError: 'Error de red',
    confirmTitle: 'Confirmar Envío',
    confirmWarning: 'Esta acción enviará {count} mensajes de WhatsApp',
    cancel: 'Cancelar',
    confirmSend: 'Confirmar Envío',
    draft: 'borrador',
    completed: 'completado',
    failedStatus: 'fallido',
    recipientPending: 'pendiente',
    recipientSent: 'enviado',
    recipientDelivered: 'entregado',
    recipientRead: 'leído',
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
  const deliveredCount = recipients.filter(r => r.status === 'delivered').length;
  const readCount = recipients.filter(r => r.status === 'read').length;
  const failedCount = recipients.filter(r => r.status === 'failed').length;
  const totalCount = recipients.length;
  const processedCount = sentCount + deliveredCount + readCount + failedCount;
  const progress = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

  const campaignStatusLabel = ({draft: t.draft, sending: t.sending, completed: t.completed, failed: t.failedStatus})[campaign.status] || campaign.status;
  const getRecipientStatus = (status: string) => ({pending: t.recipientPending, sent: t.recipientSent, delivered: t.recipientDelivered, read: t.recipientRead, failed: t.recipientFailed})[status] || status;

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
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/broadcasts')}
            className="p-1.5 rounded-xl hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-medium text-foreground">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs font-mono text-muted">
                template: {campaign.template_name}
              </span>
              <span className="text-xs font-mono text-muted">
                lang: {campaign.template_language}
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${campaignStatusColors[campaign.status] || 'bg-surface-2 text-muted border-border'}`}>
                {campaignStatusLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="text-xs font-mono text-muted hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <button
            onClick={refreshData}
            className="p-1.5 rounded-xl bg-surface border border-border text-muted hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canSend && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={sending}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground text-background text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? t.sending : t.sendBroadcast}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 mb-6 rounded-2xl bg-terminal-red/10 border border-terminal-red/20">
          <AlertTriangle className="w-4 h-4 text-terminal-red flex-shrink-0" />
          <span className="text-sm text-terminal-red font-mono">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pb-6 mb-6 border-b border-border">
        <StatCard label={t.total} value={totalCount.toLocaleString()} />
        <StatCard label={t.read} value={readCount.toLocaleString()} />
        <StatCard label={t.delivered} value={deliveredCount.toLocaleString()} />
        <StatCard label={t.sent} value={sentCount.toLocaleString()} />
        <StatCard label={t.failed} value={failedCount.toLocaleString()} />
        <StatCard label={t.pending} value={pendingCount.toLocaleString()} />
      </div>

      {/* Progress bar */}
      {processedCount > 0 && (
        <div className="mb-6 space-y-2">
          <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full flex">
              {readCount > 0 && (
                <div
                  className="h-full bg-info transition-all duration-500"
                  style={{ width: `${(readCount / totalCount) * 100}%` }}
                />
              )}
              {deliveredCount > 0 && (
                <div
                  className="h-full bg-terminal-green transition-all duration-500"
                  style={{ width: `${(deliveredCount / totalCount) * 100}%` }}
                />
              )}
              {sentCount > 0 && (
                <div
                  className="h-full bg-terminal-yellow transition-all duration-500"
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
          {campaign.status === 'sending' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-terminal-yellow border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-terminal-yellow">
                {t.sendingProgress.replace('{pct}', String(Math.round(progress)))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recipients Table */}
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-label text-muted font-medium">{t.phone}</th>
              <th className="text-left px-4 py-2 text-label text-muted font-medium">{t.name}</th>
              <th className="text-left px-4 py-2 text-label text-muted font-medium">{t.status}</th>
              <th className="text-left px-4 py-2 text-label text-muted font-medium">{t.sentAt}</th>
              <th className="text-left px-4 py-2 text-label text-muted font-medium">{t.error}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recipients.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2 transition-colors">
                <td className="px-4 py-2 font-mono text-foreground">{r.phone}</td>
                <td className="px-4 py-2 text-muted">{r.name || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${recipientStatusColors[r.status] || 'bg-surface-2 text-muted border-border'}`}>
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
          <span className="text-sm text-muted">{t.noRecipients}</span>
        </div>
      )}

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
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-surface-elevated overflow-hidden shadow-elevated">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
              </div>
              <span className="text-sm font-medium text-foreground ml-2">{t.confirmTitle}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-terminal-yellow/10 border border-terminal-yellow/20">
                <AlertTriangle className="w-4 h-4 text-terminal-yellow flex-shrink-0" />
                <span className="text-xs text-terminal-yellow font-mono">
                  {t.confirmWarning.replace('{count}', pendingCount.toLocaleString())}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border text-sm text-muted hover:text-foreground transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground text-background text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
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

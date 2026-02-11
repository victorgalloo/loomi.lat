'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ExternalLink, Unplug, Save } from 'lucide-react';
import type { TenantIntegration, IntegrationProvider } from '@/lib/integrations/tenant-integrations';

interface IntegrationsViewProps {
  tenantId: string;
  integrations: TenantIntegration[];
}

const STATUS_STYLES = {
  connected: 'text-terminal-green',
  pending: 'text-terminal-yellow',
  error: 'text-terminal-red',
  disconnected: 'text-muted',
} as const;

const STATUS_LABELS: Record<string, string> = {
  connected: 'conectado',
  pending: 'pendiente',
  error: 'error',
  disconnected: 'desconectado',
};

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7.5A4.5 4.5 0 017.5 3h9A4.5 4.5 0 0121 7.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9z" fill="#635BFF"/>
      <path d="M11.2 10.16c0-.53.44-.74.97-.74.87 0 1.97.27 2.84.74V7.74A7.6 7.6 0 0012.17 7c-2.37 0-3.95 1.24-3.95 3.31 0 3.23 4.45 2.72 4.45 4.11 0 .63-.55.83-1.08.83-.93 0-2.13-.38-3.08-.9v2.44a7.82 7.82 0 003.08.65c2.43 0 4.1-1.2 4.1-3.3-.01-3.49-4.49-2.87-4.49-4.23z" fill="white"/>
    </svg>
  );
}

export default function IntegrationsView({ tenantId, integrations: initialIntegrations }: IntegrationsViewProps) {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [disconnecting, setDisconnecting] = useState<IntegrationProvider | null>(null);

  // Cal.com credential state
  const [calClientId, setCalClientId] = useState('');
  const [calClientSecret, setCalClientSecret] = useState('');
  const [savingCalCreds, setSavingCalCreds] = useState(false);
  const [calCredsSaved, setCalCredsSaved] = useState(false);

  // Stripe credential state
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [savingStripeCreds, setSavingStripeCreds] = useState(false);
  const [stripeCredsSaved, setStripeCredsSaved] = useState(false);

  // Flash messages from OAuth redirects
  const calcomStatus = searchParams.get('calcom');
  const stripeStatus = searchParams.get('stripe');

  const getIntegration = (provider: IntegrationProvider) =>
    integrations.find(i => i.provider === provider);

  const calcom = getIntegration('calcom');
  const stripe = getIntegration('stripe_connect');

  const handleDisconnect = async (provider: IntegrationProvider) => {
    setDisconnecting(provider);
    try {
      const endpoint = provider === 'calcom'
        ? '/api/integrations/calcom/disconnect'
        : '/api/integrations/stripe/disconnect';

      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        setIntegrations(prev =>
          prev.map(i =>
            i.provider === provider
              ? { ...i, status: 'disconnected' as const, calClientId: null, calUsername: null, stripeHasKey: false, stripeAccountId: null, stripeOnboardingComplete: false, connectedAt: null }
              : i
          )
        );
        if (provider === 'calcom') setCalCredsSaved(false);
        if (provider === 'stripe_connect') setStripeCredsSaved(false);
      }
    } catch {
      // silent
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSaveCalCredentials = async () => {
    if (!calClientId.trim() || !calClientSecret.trim()) return;
    setSavingCalCreds(true);
    try {
      const res = await fetch('/api/integrations/calcom/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: calClientId.trim(), clientSecret: calClientSecret.trim() }),
      });
      if (res.ok) {
        setCalCredsSaved(true);
        setIntegrations(prev => {
          const exists = prev.some(i => i.provider === 'calcom');
          if (exists) {
            return prev.map(i =>
              i.provider === 'calcom' ? { ...i, calClientId: calClientId.trim() } : i
            );
          }
          return [...prev, {
            id: '', tenantId, provider: 'calcom' as const, status: 'disconnected' as const,
            calClientId: calClientId.trim(), calEventTypeId: null, calUsername: null,
            stripeHasKey: false, stripeAccountId: null, stripeOnboardingComplete: false,
            connectedAt: null, errorMessage: null, settings: {},
          }];
        });
      }
    } catch {
      // silent
    } finally {
      setSavingCalCreds(false);
    }
  };

  const handleSaveStripeCredentials = async () => {
    if (!stripeSecretKey.trim()) return;
    setSavingStripeCreds(true);
    try {
      const res = await fetch('/api/integrations/stripe/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: stripeSecretKey.trim() }),
      });
      if (res.ok) {
        setStripeCredsSaved(true);
        setIntegrations(prev => {
          const exists = prev.some(i => i.provider === 'stripe_connect');
          if (exists) {
            return prev.map(i =>
              i.provider === 'stripe_connect' ? { ...i, stripeHasKey: true } : i
            );
          }
          return [...prev, {
            id: '', tenantId, provider: 'stripe_connect' as const, status: 'disconnected' as const,
            calClientId: null, calEventTypeId: null, calUsername: null,
            stripeHasKey: true, stripeAccountId: null, stripeOnboardingComplete: false,
            connectedAt: null, errorMessage: null, settings: {},
          }];
        });
      }
    } catch {
      // silent
    } finally {
      setSavingStripeCreds(false);
    }
  };

  const calHasCredentials = !!(calcom?.calClientId || calCredsSaved);
  const stripeHasCredentials = !!(stripe?.stripeHasKey || stripeCredsSaved);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard/agent"
            className="text-sm text-muted hover:text-foreground"
          >
            Agente
          </Link>
          <span className="text-sm text-border">/</span>
          <span className="text-sm text-foreground">Integraciones</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Integraciones
          </h1>
          <p className="text-sm mt-1 text-muted">
            Conecta servicios externos a tu agente de WhatsApp
          </p>
        </div>
      </div>

      {/* Flash messages */}
      {calcomStatus === 'connected' && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-terminal-green/20 bg-terminal-green/5 text-sm text-terminal-green">
          Cal.com conectado correctamente
        </div>
      )}
      {calcomStatus === 'error' && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-terminal-red/20 bg-terminal-red/5 text-sm text-terminal-red">
          Error al conectar Cal.com. Intenta de nuevo.
        </div>
      )}
      {stripeStatus === 'connected' && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-terminal-green/20 bg-terminal-green/5 text-sm text-terminal-green">
          Stripe Connect conectado correctamente
        </div>
      )}
      {stripeStatus === 'pending' && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-terminal-yellow/20 bg-terminal-yellow/5 text-sm text-terminal-yellow">
          Stripe Connect: onboarding pendiente. Completa la configuración en Stripe.
        </div>
      )}
      {stripeStatus === 'error' && (
        <div className="mb-6 px-4 py-3 rounded-xl border border-terminal-red/20 bg-terminal-red/5 text-sm text-terminal-red">
          Error al conectar Stripe. Intenta de nuevo.
        </div>
      )}

      {/* Integration Cards */}
      <div className="space-y-4">
        {/* Cal.com */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/logos/calcom.png" alt="Cal.com" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Cal.com</span>
                  <span className={`text-xs ${STATUS_STYLES[calcom?.status || 'disconnected']}`}>
                    {STATUS_LABELS[calcom?.status || 'disconnected']}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Agenda demos y reuniones directamente desde WhatsApp
                </p>
              </div>
            </div>
            <div>
              {calcom?.status === 'connected' ? (
                <button
                  onClick={() => handleDisconnect('calcom')}
                  disabled={disconnecting === 'calcom'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-muted hover:text-terminal-red border border-border hover:border-terminal-red/30"
                >
                  {disconnecting === 'calcom' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unplug className="w-3.5 h-3.5" />
                  )}
                  desconectar
                </button>
              ) : calHasCredentials ? (
                <a
                  href="/api/integrations/calcom/connect"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-foreground text-background hover:bg-foreground/90"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  conectar
                </a>
              ) : null}
            </div>
          </div>
          {calcom?.status === 'connected' && (
            <div className="mt-3 ml-[52px] flex items-center gap-3 text-xs text-muted">
              {calcom.calUsername && (
                <span className="font-mono">@{calcom.calUsername}</span>
              )}
              {calcom.calEventTypeId && (
                <span>event type: <span className="font-mono">{calcom.calEventTypeId}</span></span>
              )}
              {calcom.connectedAt && (
                <span>conectado {new Date(calcom.connectedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
          {calcom?.status === 'error' && calcom.errorMessage && (
            <p className="mt-2 ml-[52px] text-xs text-terminal-red">
              {calcom.errorMessage}
            </p>
          )}
          {calcom?.status !== 'connected' && (
            <div className="mt-4 ml-[52px] space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted">Client ID</label>
                <input
                  type="text"
                  value={calClientId}
                  onChange={e => setCalClientId(e.target.value)}
                  placeholder="cal_live_..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted">Client Secret</label>
                <input
                  type="password"
                  value={calClientSecret}
                  onChange={e => setCalClientSecret(e.target.value)}
                  placeholder="cal_secret_..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground/30"
                />
              </div>
              <button
                onClick={handleSaveCalCredentials}
                disabled={savingCalCreds || !calClientId.trim() || !calClientSecret.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingCalCreds ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                guardar credenciales
              </button>
              {calCredsSaved && (
                <p className="text-xs text-terminal-green">
                  Credenciales guardadas. Ya puedes conectar Cal.com.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stripe Connect */}
        <div className="p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <StripeLogo className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Stripe Connect</span>
                  <span className={`text-xs ${STATUS_STYLES[stripe?.status || 'disconnected']}`}>
                    {STATUS_LABELS[stripe?.status || 'disconnected']}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Recibe pagos directos de tus clientes via WhatsApp
                </p>
              </div>
            </div>
            <div>
              {stripe?.status === 'connected' ? (
                <button
                  onClick={() => handleDisconnect('stripe_connect')}
                  disabled={disconnecting === 'stripe_connect'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-muted hover:text-terminal-red border border-border hover:border-terminal-red/30"
                >
                  {disconnecting === 'stripe_connect' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unplug className="w-3.5 h-3.5" />
                  )}
                  desconectar
                </button>
              ) : stripe?.status === 'pending' ? (
                <a
                  href="/api/integrations/stripe/connect"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-terminal-yellow/10 text-terminal-yellow border border-terminal-yellow/20 hover:bg-terminal-yellow/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  completar
                </a>
              ) : stripeHasCredentials ? (
                <a
                  href="/api/integrations/stripe/connect"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-foreground text-background hover:bg-foreground/90"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  conectar
                </a>
              ) : null}
            </div>
          </div>
          {stripe?.status === 'connected' && (
            <div className="mt-3 ml-[52px] flex items-center gap-3 text-xs text-muted">
              {stripe.stripeAccountId && (
                <span className="font-mono">{stripe.stripeAccountId}</span>
              )}
              {stripe.connectedAt && (
                <span>conectado {new Date(stripe.connectedAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
          {stripe?.status === 'pending' && (
            <p className="mt-2 ml-[52px] text-xs text-terminal-yellow">
              Completa el onboarding en Stripe para activar pagos
            </p>
          )}
          {stripe?.status === 'error' && stripe.errorMessage && (
            <p className="mt-2 ml-[52px] text-xs text-terminal-red">
              {stripe.errorMessage}
            </p>
          )}
          {stripe?.status !== 'connected' && stripe?.status !== 'pending' && (
            <div className="mt-4 ml-[52px] space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted">Secret Key</label>
                <input
                  type="password"
                  value={stripeSecretKey}
                  onChange={e => setStripeSecretKey(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground/30"
                />
              </div>
              <button
                onClick={handleSaveStripeCredentials}
                disabled={savingStripeCreds || !stripeSecretKey.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingStripeCreds ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                guardar credenciales
              </button>
              {stripeCredsSaved && (
                <p className="text-xs text-terminal-green">
                  Credenciales guardadas. Ya puedes conectar Stripe.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-10 pt-6 border-t border-border flex gap-3">
        <Link
          href="/dashboard/agent"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          Configuracion basica
        </Link>
        <Link
          href="/dashboard/agent/prompt"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          Prompt
        </Link>
        <Link
          href="/dashboard/agent/knowledge"
          className="px-4 py-2 text-sm font-medium rounded-xl transition-colors bg-surface text-muted hover:text-foreground border border-border"
        >
          Knowledge
        </Link>
      </div>
    </div>
  );
}

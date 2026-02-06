'use client';

import { useState } from 'react';
import { MessageCircle, CheckCircle, Phone, Building, Calendar, Shield, HelpCircle, Plus, Trash2 } from 'lucide-react';

interface WhatsAppAccountInfo {
  phoneNumberId: string;
  displayPhoneNumber?: string | null;
  businessName?: string | null;
  wabaId?: string | null;
  connectedAt?: string | null;
}

interface ConnectViewProps {
  isConnected: boolean;
  whatsappAccounts: WhatsAppAccountInfo[];
}

export default function ConnectView({ isConnected, whatsappAccounts }: ConnectViewProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDisconnect = async (phoneNumberId: string) => {
    if (!confirm('¿Estás seguro de que quieres desconectar este número?')) return;

    setDisconnecting(phoneNumberId);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', phone_number_id: phoneNumberId }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground font-mono">
            ./whatsapp_
          </h1>
          <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium font-mono ${
            isConnected
              ? 'bg-terminal-green/10 text-terminal-green'
              : 'bg-terminal-yellow/10 text-terminal-yellow'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-terminal-green' : 'bg-terminal-yellow'}`} />
            {isConnected ? 'conectado' : 'desconectado'}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-8 pb-6 mb-6 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">
            estado
          </p>
          <p className={`text-xl font-semibold mt-1 font-mono ${isConnected ? 'text-terminal-green' : 'text-terminal-yellow'}`}>
            {isConnected ? 'activo' : 'pendiente'}
          </p>
        </div>

        {isConnected && (
          <>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted font-mono">
                números
              </p>
              <p className="text-sm font-mono mt-1 text-foreground">
                {whatsappAccounts.length}
              </p>
            </div>
          </>
        )}
      </div>

      {isConnected ? (
        /* Connected State */
        <div className="space-y-4">
          {/* Connected Numbers List */}
          {whatsappAccounts.map((account) => (
            <div key={account.phoneNumberId} className="rounded-xl p-5 bg-surface border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium flex items-center gap-2 text-foreground font-mono">
                  <CheckCircle className="w-4 h-4 text-terminal-green" />
                  {account.displayPhoneNumber || account.phoneNumberId}
                </h2>
                <button
                  type="button"
                  onClick={() => handleDisconnect(account.phoneNumberId)}
                  disabled={disconnecting === account.phoneNumberId}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors text-terminal-red bg-terminal-red/10 hover:bg-terminal-red/20 font-mono disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  {disconnecting === account.phoneNumberId ? 'desconectando...' : 'desconectar'}
                </button>
              </div>

              <dl className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <dt className="text-sm flex items-center gap-2 text-muted">
                    <Phone className="w-4 h-4" />
                    número de teléfono
                  </dt>
                  <dd className="text-sm font-mono text-foreground">
                    {account.displayPhoneNumber || 'No disponible'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <dt className="text-sm flex items-center gap-2 text-muted">
                    <Building className="w-4 h-4" />
                    nombre del negocio
                  </dt>
                  <dd className="text-sm text-foreground">
                    {account.businessName || 'No disponible'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border">
                  <dt className="text-sm flex items-center gap-2 text-muted">
                    <Shield className="w-4 h-4" />
                    ID de cuenta
                  </dt>
                  <dd className="text-xs font-mono text-muted">
                    {account.wabaId || 'No disponible'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-3">
                  <dt className="text-sm flex items-center gap-2 text-muted">
                    <Calendar className="w-4 h-4" />
                    conectado desde
                  </dt>
                  <dd className="text-sm text-foreground">
                    {account.connectedAt ? formatDate(account.connectedAt) : 'No disponible'}
                  </dd>
                </div>
              </dl>
            </div>
          ))}

          {/* Add Number Button */}
          <div className="rounded-xl p-5 bg-surface border border-border border-dashed">
            <a
              href="/api/whatsapp/connect"
              className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors font-mono"
            >
              <Plus className="w-4 h-4" />
              agregar otro número
            </a>
          </div>
        </div>
      ) : (
        /* Disconnected State - Connect Flow */
        <div className="space-y-4">
          <div className="rounded-xl p-6 text-center bg-surface border border-border">
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-terminal-green/10">
              <MessageCircle className="w-6 h-6 text-terminal-green" />
            </div>
            <h3 className="text-base font-medium mb-2 text-foreground font-mono">
              Conecta tu WhatsApp Business
            </h3>
            <p className="text-sm mb-6 max-w-sm mx-auto text-muted">
              Conecta tu cuenta de WhatsApp Business para empezar a recibir y responder mensajes automáticamente
            </p>
            <a
              href="/api/whatsapp/connect"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-foreground text-background hover:bg-foreground/90 font-mono"
            >
              <MessageCircle className="w-4 h-4" />
              ./conectar-whatsapp
            </a>
          </div>

          {/* Requirements */}
          <div className="rounded-xl p-5 bg-surface border border-border">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground font-mono">
              <HelpCircle className="w-4 h-4 text-muted" />
              requisitos
            </h3>
            <ul className="space-y-3">
              {[
                'Cuenta de Facebook Business Manager',
                'Número de teléfono que pueda recibir SMS o llamadas',
                'El proceso toma aproximadamente 5 minutos'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-terminal-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

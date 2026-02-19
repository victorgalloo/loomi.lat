'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Phone, Building, Calendar, Shield, HelpCircle, Plus, Trash2, RefreshCw, Loader2, Globe } from 'lucide-react';
import WhatsAppConnectFlow from '@/components/dashboard/WhatsAppConnectFlow';
import TwilioNumberProvisioning from '@/components/dashboard/TwilioNumberProvisioning';

interface WhatsAppAccountInfo {
  phoneNumberId: string;
  displayPhoneNumber?: string | null;
  businessName?: string | null;
  wabaId?: string | null;
  connectedAt?: string | null;
}

interface PendingTwilioNumber {
  id: string;
  phoneNumber: string;
  status: string;
}

interface MetaWABAInfo {
  id: string;
  name: string;
  account_review_status?: string;
}

interface ConnectViewProps {
  isConnected: boolean;
  whatsappAccounts: WhatsAppAccountInfo[];
  pendingTwilioNumbers?: PendingTwilioNumber[];
  metaBusinessId?: string | null;
  tenantId?: string;
}

export default function ConnectView({ isConnected, whatsappAccounts, pendingTwilioNumbers = [], metaBusinessId, tenantId }: ConnectViewProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [addNumberMode, setAddNumberMode] = useState<'choose' | 'new' | 'existing' | null>(null);

  // WABA management state
  const [clientWABAs, setClientWABAs] = useState<MetaWABAInfo[]>([]);
  const [wabaLoading, setWabaLoading] = useState(false);
  const [wabaError, setWabaError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [addingNumber, setAddingNumber] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  const fetchWABAs = useCallback(async () => {
    if (!metaBusinessId) return;
    setWabaLoading(true);
    setWabaError(null);
    try {
      const res = await fetch('/api/whatsapp/waba');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener WABAs');
      setClientWABAs(data.wabas || []);
    } catch (err) {
      setWabaError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setWabaLoading(false);
    }
  }, [metaBusinessId]);

  useEffect(() => {
    if (metaBusinessId) {
      fetchWABAs();
    }
  }, [metaBusinessId, fetchWABAs]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/waba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al sincronizar');
      setClientWABAs(data.wabas || []);
    } catch (err) {
      setWabaError(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddPreverifiedNumber = async () => {
    if (!newPhoneNumber.trim()) return;
    setAddingNumber(true);
    setWabaError(null);
    try {
      const res = await fetch('/api/whatsapp/waba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_number', phone_number: newPhoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar número');
      setNewPhoneNumber('');
      await fetchWABAs();
    } catch (err) {
      setWabaError(err instanceof Error ? err.message : 'Error al registrar número');
    } finally {
      setAddingNumber(false);
    }
  };

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
          <h1 className="text-xl font-semibold text-foreground">
            Conexión WhatsApp
          </h1>
          <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
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
          <p className="text-label uppercase tracking-wider text-muted">
            estado
          </p>
          <p className={`text-xl font-semibold mt-1 ${isConnected ? 'text-info' : 'text-terminal-yellow'}`}>
            {isConnected ? 'activo' : 'pendiente'}
          </p>
        </div>

        {isConnected && (
          <>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-label uppercase tracking-wider text-muted">
                números
              </p>
              <p className="text-sm mt-1 text-foreground">
                {whatsappAccounts.length}
              </p>
            </div>
          </>
        )}
      </div>

      {isConnected ? (
        /* Connected State */
        <div className="space-y-6">
          {/* Connected Numbers List */}
          {whatsappAccounts.map((account) => (
            <div key={account.phoneNumberId} className="pb-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <CheckCircle className="w-4 h-4 text-terminal-green" />
                  {account.displayPhoneNumber || account.phoneNumberId}
                </h2>
                <button
                  type="button"
                  onClick={() => handleDisconnect(account.phoneNumberId)}
                  disabled={disconnecting === account.phoneNumberId}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl transition-colors text-terminal-red bg-terminal-red/10 hover:bg-terminal-red/20 disabled:opacity-50"
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

          {/* Pending Twilio Numbers */}
          {pendingTwilioNumbers.filter(n => n.status === 'active').map((num) => (
            <div key={num.id} className="flex items-center justify-between pb-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-terminal-yellow" />
                <span className="text-sm font-mono text-foreground">{num.phoneNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-terminal-yellow/10 text-terminal-yellow">
                  pendiente
                </span>
              </div>
              <button
                onClick={() => {
                  setShowAddNumber(true);
                  setAddNumberMode('existing');
                }}
                className="text-xs text-foreground bg-foreground/10 hover:bg-foreground/20 px-3 py-1.5 rounded-xl transition-colors"
              >
                conectar a WhatsApp
              </button>
            </div>
          ))}

          {/* Add Number */}
          {showAddNumber ? (
            addNumberMode === 'new' ? (
              <TwilioNumberProvisioning
                onBack={() => setAddNumberMode('choose')}
                onConnectWhatsApp={() => setAddNumberMode('existing')}
                onNumberPurchased={() => {}}
              />
            ) : addNumberMode === 'existing' ? (
              <WhatsAppConnectFlow
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            ) : (
              /* Choose mode */
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">agregar número</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAddNumberMode('new')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-muted" />
                    <span className="text-sm text-foreground">obtener número nuevo</span>
                    <span className="text-xs text-muted">Comprar via Twilio</span>
                  </button>
                  <button
                    onClick={() => setAddNumberMode('existing')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-muted" />
                    <span className="text-sm text-foreground">ya tengo un número</span>
                    <span className="text-xs text-muted">Conectar existente</span>
                  </button>
                </div>
                <button
                  onClick={() => { setShowAddNumber(false); setAddNumberMode(null); }}
                  className="w-full text-xs text-muted hover:text-foreground transition-colors"
                >
                  cancelar
                </button>
              </div>
            )
          ) : (
            <button
              onClick={() => { setShowAddNumber(true); setAddNumberMode('choose'); }}
              className="flex items-center justify-center gap-2 py-3 w-full text-sm text-muted hover:text-foreground transition-colors border-t border-dashed border-border"
            >
              <Plus className="w-4 h-4" />
              agregar otro número
            </button>
          )}

          {/* WABA Management (Tech Provider) */}
          {metaBusinessId && (
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Globe className="w-4 h-4 text-muted" />
                  gestión WABA
                </h2>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl transition-colors text-foreground bg-foreground/10 hover:bg-foreground/20 disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  sincronizar
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted">Meta Business ID</span>
                <span className="text-xs font-mono text-foreground">{metaBusinessId}</span>
              </div>

              {wabaError && (
                <div className="text-xs text-terminal-red bg-terminal-red/10 px-3 py-2 rounded-xl">
                  {wabaError}
                </div>
              )}

              {wabaLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                </div>
              ) : clientWABAs.length > 0 ? (
                <div className="space-y-3">
                  {clientWABAs.map((waba) => (
                    <div key={waba.id} className="pb-3 border-b border-border">
                      <dl className="space-y-0">
                        <div className="flex items-center justify-between py-2">
                          <dt className="text-xs text-muted">WABA</dt>
                          <dd className="text-xs text-foreground">{waba.name}</dd>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <dt className="text-xs text-muted">ID</dt>
                          <dd className="text-xs font-mono text-muted">{waba.id}</dd>
                        </div>
                        {waba.account_review_status && (
                          <div className="flex items-center justify-between py-2">
                            <dt className="text-xs text-muted">estado de revisión</dt>
                            <dd className={`text-xs font-medium ${
                              waba.account_review_status === 'APPROVED'
                                ? 'text-terminal-green'
                                : waba.account_review_status === 'PENDING'
                                  ? 'text-terminal-yellow'
                                  : 'text-terminal-red'
                            }`}>
                              {waba.account_review_status.toLowerCase()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-2">No se encontraron WABAs para este negocio.</p>
              )}

              {/* Add pre-verified number */}
              <div className="space-y-2">
                <label className="text-xs text-muted">registrar número pre-verificado</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="+521234567890"
                    className="flex-1 px-3 py-1.5 text-sm font-mono bg-background border border-border rounded-xl focus:outline-none focus:border-foreground/30 transition-colors"
                  />
                  <button
                    onClick={handleAddPreverifiedNumber}
                    disabled={addingNumber || !newPhoneNumber.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors bg-foreground text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {addingNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    registrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Disconnected State - Choose how to connect */
        <div className="space-y-6">
          {addNumberMode === 'new' ? (
            <TwilioNumberProvisioning
              onBack={() => setAddNumberMode(null)}
              onConnectWhatsApp={() => setAddNumberMode('existing')}
              onNumberPurchased={() => {}}
            />
          ) : addNumberMode === 'existing' ? (
            <>
              <button
                onClick={() => setAddNumberMode(null)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                <span>&larr;</span> volver
              </button>
              <WhatsAppConnectFlow
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            </>
          ) : (
            <>
              {/* Two options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAddNumberMode('new')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                >
                  <Plus className="w-6 h-6 text-terminal-green" />
                  <span className="text-sm font-medium text-foreground">obtener número nuevo</span>
                  <span className="text-xs text-muted text-center">Compra un número via Twilio y conéctalo a WhatsApp</span>
                </button>
                <button
                  onClick={() => setAddNumberMode('existing')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors"
                >
                  <Phone className="w-6 h-6 text-foreground" />
                  <span className="text-sm font-medium text-foreground">ya tengo un número</span>
                  <span className="text-xs text-muted text-center">Conecta tu número existente con Meta Embedded Signup</span>
                </button>
              </div>

              {/* Pending Twilio numbers */}
              {pendingTwilioNumbers.filter(n => n.status === 'active').map((num) => (
                <div key={num.id} className="flex items-center justify-between py-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-terminal-yellow" />
                    <span className="text-sm font-mono text-foreground">{num.phoneNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-terminal-yellow/10 text-terminal-yellow">
                      pendiente de WhatsApp
                    </span>
                  </div>
                  <button
                    onClick={() => setAddNumberMode('existing')}
                    className="text-xs text-background bg-foreground hover:opacity-90 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    conectar
                  </button>
                </div>
              ))}

              {/* Requirements */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

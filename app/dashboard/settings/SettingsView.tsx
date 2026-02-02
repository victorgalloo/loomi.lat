'use client';

import Link from 'next/link';

interface SettingsViewProps {
  tenant: {
    name: string;
    email: string;
    companyName: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
    createdAt: string;
  };
  whatsapp: {
    connected: boolean;
    phoneNumber: string | null;
    businessName: string | null;
  };
}

export default function SettingsView({ tenant, whatsapp }: SettingsViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const Row = ({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <span className="text-sm text-muted font-mono">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{value}</span>
        {action}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-medium text-foreground font-mono">
          ./settings_
        </h1>
        <p className="text-sm mt-1 text-muted">
          Administra tu cuenta
        </p>
      </div>

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4 text-muted font-mono">
          cuenta
        </h2>
        <div>
          <Row label="nombre" value={tenant.name} />
          <Row label="email" value={tenant.email} />
          {tenant.companyName && <Row label="empresa" value={tenant.companyName} />}
          <Row label="miembro desde" value={formatDate(tenant.createdAt)} />
        </div>
      </section>

      {/* Plan */}
      <section className="mb-10">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4 text-muted font-mono">
          plan
        </h2>
        <div>
          <Row
            label="plan actual"
            value={tenant.subscriptionTier.charAt(0).toUpperCase() + tenant.subscriptionTier.slice(1)}
          />
          <Row
            label="estado"
            value={tenant.subscriptionStatus === 'active' ? 'Activo' : tenant.subscriptionStatus}
          />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="mb-10">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4 text-muted font-mono">
          whatsapp
        </h2>
        <div>
          <Row
            label="estado"
            value={whatsapp.connected ? 'Conectado' : 'Desconectado'}
            action={
              <Link
                href="/dashboard/connect"
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {whatsapp.connected ? 'Gestionar' : 'Conectar'}
              </Link>
            }
          />
          {whatsapp.connected && whatsapp.phoneNumber && (
            <Row label="número" value={whatsapp.phoneNumber} />
          )}
          {whatsapp.connected && whatsapp.businessName && (
            <Row label="negocio" value={whatsapp.businessName} />
          )}
        </div>
      </section>

      {/* Danger */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-4 text-terminal-red font-mono">
          zona de peligro
        </h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-foreground">Eliminar cuenta</p>
            <p className="text-xs text-muted">Esta acción es irreversible</p>
          </div>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-terminal-red bg-terminal-red/10 hover:bg-terminal-red/20 font-mono"
          >
            eliminar
          </button>
        </div>
      </section>
    </div>
  );
}

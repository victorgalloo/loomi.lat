'use client';

import Link from 'next/link';
import { useTheme } from '@/components/dashboard/ThemeProvider';

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
  const { isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const Row = ({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) => (
    <div className={`flex items-center justify-between py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
      <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{value}</span>
        {action}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Settings
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Administra tu cuenta
        </p>
      </div>

      {/* Account */}
      <section className="mb-10">
        <h2 className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Cuenta
        </h2>
        <div>
          <Row label="Nombre" value={tenant.name} />
          <Row label="Email" value={tenant.email} />
          {tenant.companyName && <Row label="Empresa" value={tenant.companyName} />}
          <Row label="Miembro desde" value={formatDate(tenant.createdAt)} />
        </div>
      </section>

      {/* Plan */}
      <section className="mb-10">
        <h2 className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Plan
        </h2>
        <div>
          <Row
            label="Plan actual"
            value={tenant.subscriptionTier.charAt(0).toUpperCase() + tenant.subscriptionTier.slice(1)}
          />
          <Row
            label="Estado"
            value={tenant.subscriptionStatus === 'active' ? 'Activo' : tenant.subscriptionStatus}
          />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="mb-10">
        <h2 className={`text-xs font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          WhatsApp
        </h2>
        <div>
          <Row
            label="Estado"
            value={whatsapp.connected ? 'Conectado' : 'Desconectado'}
            action={
              <Link
                href="/loomi/dashboard/connect"
                className={`text-xs ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                {whatsapp.connected ? 'Gestionar' : 'Conectar'}
              </Link>
            }
          />
          {whatsapp.connected && whatsapp.phoneNumber && (
            <Row label="Número" value={whatsapp.phoneNumber} />
          )}
          {whatsapp.connected && whatsapp.businessName && (
            <Row label="Negocio" value={whatsapp.businessName} />
          )}
        </div>
      </section>

      {/* Danger */}
      <section>
        <h2 className={`text-xs font-medium uppercase tracking-wider mb-4 text-red-500`}>
          Zona de peligro
        </h2>
        <div className={`flex items-center justify-between py-3`}>
          <div>
            <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Eliminar cuenta</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Esta acción es irreversible</p>
          </div>
          <button
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${isDark
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'text-red-600 bg-red-50 hover:bg-red-100'
              }
            `}
          >
            Eliminar
          </button>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Member {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string | null;
}

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
    totalNumbers?: number;
  };
  members: Member[];
  currentUserRole: 'owner' | 'admin' | 'member';
}

export default function SettingsView({ tenant, whatsapp, members: initialMembers, currentUserRole }: SettingsViewProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'Error al invitar');
        return;
      }

      setMembers(prev => [...prev, {
        id: data.member.id,
        email: data.member.email,
        role: data.member.role,
        joinedAt: data.member.joined_at,
      }]);
      setInviteEmail('');
    } catch {
      setInviteError('Error de conexión');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error al remover');
        return;
      }

      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {
      alert('Error de conexión');
    } finally {
      setRemovingId(null);
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'text-terminal-green',
      admin: 'text-terminal-yellow',
      member: 'text-muted',
    };
    return <span className={`text-xs font-mono ${colors[role] || 'text-muted'}`}>{role}</span>;
  };

  const Row = ({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-border hover:bg-surface/50 rounded-lg px-2 -mx-2 transition-colors">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{value}</span>
        {action}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm mt-1 text-muted">
          Administra tu cuenta
        </p>
      </div>

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-label font-medium uppercase tracking-wider mb-4 text-muted border-l-2 border-l-info pl-3">
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
        <h2 className="text-label font-medium uppercase tracking-wider mb-4 text-muted border-l-2 border-l-info pl-3">
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
        <h2 className="text-label font-medium uppercase tracking-wider mb-4 text-muted border-l-2 border-l-info pl-3">
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
          {whatsapp.connected && (whatsapp.totalNumbers ?? 0) > 1 && (
            <Row label="números conectados" value={String(whatsapp.totalNumbers)} />
          )}
        </div>
      </section>

      {/* Team */}
      <section className="mb-10">
        <h2 className="text-label font-medium uppercase tracking-wider mb-4 text-muted border-l-2 border-l-info pl-3">
          equipo
        </h2>

        {/* Member list */}
        <div className="mb-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 border-b border-border hover:bg-surface/50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground">{member.email}</span>
                {roleBadge(member.role)}
                {!member.joinedAt && (
                  <span className="text-xs text-terminal-yellow">pendiente</span>
                )}
              </div>
              {canManageTeam && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={removingId === member.id}
                  className="text-xs text-muted hover:text-terminal-red transition-colors disabled:opacity-50"
                >
                  {removingId === member.id ? '...' : 'remover'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite form - only for owner/admin */}
        {canManageTeam && (
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="email@ejemplo.com"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg font-mono focus:outline-none focus:border-foreground/30 transition-colors"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-2 py-1.5 text-sm bg-background border border-border rounded-lg font-mono focus:outline-none focus:border-foreground/30 transition-colors"
              >
                <option value="member">member</option>
                {currentUserRole === 'owner' && <option value="admin">admin</option>}
              </select>
              <button
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {inviteLoading ? '...' : 'invitar'}
              </button>
            </div>
            {inviteError && (
              <p className="text-xs text-terminal-red mt-2">{inviteError}</p>
            )}
          </div>
        )}
      </section>

      {/* Danger */}
      <section>
        <h2 className="text-label font-medium uppercase tracking-wider mb-4 text-terminal-red border-l-2 border-l-error pl-3">
          zona de peligro
        </h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-foreground">Eliminar cuenta</p>
            <p className="text-xs text-muted">Esta acción es irreversible</p>
          </div>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-xl transition-colors text-terminal-red bg-terminal-red/10 hover:bg-terminal-red/20"
          >
            eliminar
          </button>
        </div>
      </section>
    </div>
  );
}

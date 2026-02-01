import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getTenantById, getWhatsAppAccount } from "@/lib/tenant/context";
import Link from "next/link";
import { ArrowLeft, Settings, User, CreditCard, MessageCircle, AlertTriangle, Sparkles, CheckCircle } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Only allow tenant users
  const userRole = await getUserRole(user.email);
  if (userRole !== "tenant") {
    redirect("/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  const tenant = await getTenantById(tenantId);
  const whatsappAccount = await getWhatsAppAccount(tenantId);

  if (!tenant) {
    redirect("/login");
  }

  const subscriptionLabels: Record<string, { name: string; price: string }> = {
    starter: { name: 'Starter', price: '$199/mes' },
    growth: { name: 'Growth', price: '$349/mes' },
    pro: { name: 'Pro', price: '$599/mes' },
    enterprise: { name: 'Enterprise', price: 'Personalizado' }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'text-amber-700 bg-amber-100 border-amber-200' },
    active: { label: 'Activo', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
    past_due: { label: 'Pago vencido', color: 'text-red-700 bg-red-100 border-red-200' },
    canceled: { label: 'Cancelado', color: 'text-gray-600 bg-gray-100 border-gray-200' }
  };

  const status = statusLabels[tenant.subscriptionStatus] || statusLabels.pending;
  const plan = subscriptionLabels[tenant.subscriptionTier] || { name: tenant.subscriptionTier, price: '' };

  const planFeatures: Record<string, string[]> = {
    starter: ['Hasta 100 mensajes diarios', 'Respuestas AI', 'Dashboard basico'],
    growth: ['Hasta 300 mensajes diarios', 'Todas las funciones de Starter', 'Soporte prioritario'],
    pro: ['Mensajes ilimitados', 'Todas las funciones', 'Soporte dedicado'],
    enterprise: ['Mensajes ilimitados', 'Todas las funciones', 'Soporte dedicado', 'Integraciones personalizadas']
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          Administra tu cuenta y suscripcion.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-600" />
          Informacion de cuenta
        </h2>
        <dl className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <dt className="text-gray-600">Nombre</dt>
            <dd className="font-medium text-gray-900">{tenant.name}</dd>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <dt className="text-gray-600">Email</dt>
            <dd className="font-medium text-gray-900">{tenant.email}</dd>
          </div>
          {tenant.companyName && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <dt className="text-gray-600">Empresa</dt>
              <dd className="font-medium text-gray-900">{tenant.companyName}</dd>
            </div>
          )}
          <div className="flex justify-between items-center py-3">
            <dt className="text-gray-600">Miembro desde</dt>
            <dd className="font-medium text-gray-900">
              {tenant.createdAt.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />

        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Suscripcion
        </h2>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-2xl font-bold text-purple-700">
              {plan.name}
            </p>
            <p className="text-gray-600 mt-1">{plan.price}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-3 border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <Link
            href="#"
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-600 transition-all"
          >
            Cambiar plan
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 relative z-10">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Tu plan incluye:
          </h3>
          <ul className="space-y-3">
            {(planFeatures[tenant.subscriptionTier] || planFeatures.starter).map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Conexion WhatsApp
        </h2>
        {whatsappAccount?.status === 'active' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{whatsappAccount.businessName || 'WhatsApp conectado'}</p>
                <p className="text-sm text-gray-600 font-mono">{whatsappAccount.displayPhoneNumber}</p>
              </div>
            </div>
            <Link
              href="/dashboard/connect"
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all"
            >
              Administrar
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-600">No hay cuenta de WhatsApp conectada</p>
            <Link
              href="/dashboard/connect"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Conectar WhatsApp
            </Link>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-600 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zona de peligro
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Eliminar cuenta</p>
            <p className="text-sm text-gray-600">
              Una vez que elimines tu cuenta, no hay vuelta atras.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

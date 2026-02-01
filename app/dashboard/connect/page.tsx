import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccount } from "@/lib/tenant/context";
import WhatsAppConnectFlow from "@/components/dashboard/WhatsAppConnectFlow";
import ConnectionStatus from "@/components/dashboard/ConnectionStatus";
import Link from "next/link";

export default async function ConnectPage() {
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

  const whatsappAccount = await getWhatsAppAccount(tenantId);
  const isConnected = whatsappAccount?.status === 'active';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Conexion WhatsApp</h1>
        <p className="text-gray-600 mt-1">
          Administra tu conexion de WhatsApp Business.
        </p>
      </div>

      {/* Current Status */}
      <ConnectionStatus
        connected={isConnected}
        phoneNumber={whatsappAccount?.displayPhoneNumber || undefined}
        businessName={whatsappAccount?.businessName || undefined}
      />

      {/* Connect or Reconnect */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isConnected ? (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de conexion</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Numero de telefono</dt>
                <dd className="text-gray-900 font-medium">{whatsappAccount?.displayPhoneNumber || 'No disponible'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Nombre del negocio</dt>
                <dd className="text-gray-900 font-medium">{whatsappAccount?.businessName || 'No disponible'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">ID de cuenta</dt>
                <dd className="text-gray-900 font-mono text-sm">{whatsappAccount?.wabaId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Estado</dt>
                <dd className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-700 font-medium">Activo</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Conectado desde</dt>
                <dd className="text-gray-900">
                  {whatsappAccount?.connectedAt
                    ? new Date(whatsappAccount.connectedAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No disponible'
                  }
                </dd>
              </div>
            </dl>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Acciones</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reconectar
                </button>
                <form action="/api/whatsapp/connect" method="POST">
                  <input type="hidden" name="action" value="disconnect" />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Desconectar
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <WhatsAppConnectFlow />
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Necesitas ayuda?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Necesitas una cuenta de Facebook Business Manager
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            El numero de telefono debe poder recibir SMS o llamadas
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            El proceso toma aproximadamente 5 minutos
          </li>
        </ul>
      </div>
    </div>
  );
}

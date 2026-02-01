import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import { getWhatsAppAccount } from "@/lib/tenant/context";
import WhatsAppConnectFlow from "@/components/dashboard/WhatsAppConnectFlow";
import ConnectionStatus from "@/components/dashboard/ConnectionStatus";
import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle, HelpCircle } from "lucide-react";

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
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conexion WhatsApp</h1>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isConnected ? (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Detalles de conexion
            </h2>
            <dl className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <dt className="text-gray-600">Numero de telefono</dt>
                <dd className="text-gray-900 font-mono">{whatsappAccount?.displayPhoneNumber || 'No disponible'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <dt className="text-gray-600">Nombre del negocio</dt>
                <dd className="text-gray-900 font-medium">{whatsappAccount?.businessName || 'No disponible'}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <dt className="text-gray-600">ID de cuenta</dt>
                <dd className="text-gray-500 font-mono text-sm">{whatsappAccount?.wabaId}</dd>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <dt className="text-gray-600">Estado</dt>
                <dd className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-emerald-600 font-medium">Activo</span>
                </dd>
              </div>
              <div className="flex justify-between items-center py-3">
                <dt className="text-gray-600">Conectado desde</dt>
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

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Acciones</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  Reconectar
                </button>
                <form action="/api/whatsapp/connect" method="POST">
                  <input type="hidden" name="action" value="disconnect" />
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
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
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-600" />
          Necesitas ayuda?
        </h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            Necesitas una cuenta de Facebook Business Manager
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            El numero de telefono debe poder recibir SMS o llamadas
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            El proceso toma aproximadamente 5 minutos
          </li>
        </ul>
      </div>
    </div>
  );
}

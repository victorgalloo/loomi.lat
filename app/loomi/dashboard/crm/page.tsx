import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, getTenantIdForUser } from "@/lib/supabase/user-role";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, DollarSign, TrendingUp } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/crm";

export default async function CRMPage() {
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
    redirect("/loomi/dashboard");
  }

  const tenantId = await getTenantIdForUser(user.email);
  if (!tenantId) {
    redirect("/login");
  }

  // Fetch pipeline stages
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position");

  // If no stages, use defaults
  const pipelineStages = stages && stages.length > 0
    ? stages.map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        position: s.position,
        isWon: s.is_won,
        isLost: s.is_lost,
      }))
    : [
        { id: '1', name: 'Nuevo', color: 'cyan', position: 0, isWon: false, isLost: false },
        { id: '2', name: 'Contactado', color: 'amber', position: 1, isWon: false, isLost: false },
        { id: '3', name: 'Calificado', color: 'purple', position: 2, isWon: false, isLost: false },
        { id: '4', name: 'Propuesta', color: 'blue', position: 3, isWon: false, isLost: false },
        { id: '5', name: 'Negociacion', color: 'orange', position: 4, isWon: false, isLost: false },
        { id: '6', name: 'Ganado', color: 'emerald', position: 5, isWon: true, isLost: false },
        { id: '7', name: 'Perdido', color: 'red', position: 6, isWon: false, isLost: true },
      ];

  // Fetch leads with conversation count
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id,
      name,
      phone,
      company_name,
      contact_email,
      deal_value,
      stage,
      priority,
      last_activity_at,
      conversations(count)
    `)
    .eq("tenant_id", tenantId)
    .order("last_activity_at", { ascending: false });

  const formattedLeads = (leads || []).map(lead => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    companyName: lead.company_name,
    contactEmail: lead.contact_email,
    dealValue: lead.deal_value,
    stage: lead.stage || 'Nuevo',
    priority: (lead.priority || 'medium') as 'low' | 'medium' | 'high',
    lastActivityAt: lead.last_activity_at,
    conversationCount: lead.conversations?.[0]?.count || 0,
  }));

  // Calculate stats
  const totalLeads = formattedLeads.length;
  const totalValue = formattedLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
  const wonDeals = formattedLeads.filter(l => l.stage === 'Ganado');
  const wonValue = wonDeals.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonDeals.length / totalLeads) * 100) : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/loomi/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Pipeline de ventas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-sm text-gray-500">Total leads</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-gray-500">Pipeline total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(wonValue)}</p>
              <p className="text-sm text-gray-500">Ganados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{conversionRate}%</p>
              <p className="text-sm text-gray-500">Conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm overflow-hidden">
        <KanbanBoard
          stages={pipelineStages}
          initialLeads={formattedLeads}
        />
      </div>

      {/* Empty State */}
      {formattedLeads.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin leads aún</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Los leads aparecerán aquí automáticamente cuando recibas mensajes por WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}

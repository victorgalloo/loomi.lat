'use client';

import Link from 'next/link';

interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  stage: string;
}

interface ConversationListProps {
  conversations: Conversation[];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function getStageLabel(stage: string): { label: string; color: string } {
  const stages: Record<string, { label: string; color: string }> = {
    initial: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
    qualified: { label: 'Calificado', color: 'bg-green-100 text-green-700' },
    demo_scheduled: { label: 'Demo agendada', color: 'bg-purple-100 text-purple-700' },
    demo_completed: { label: 'Demo completada', color: 'bg-indigo-100 text-indigo-700' },
    payment_pending: { label: 'Pago pendiente', color: 'bg-yellow-100 text-yellow-700' },
    customer: { label: 'Cliente', color: 'bg-green-100 text-green-700' },
    cold: { label: 'Frio', color: 'bg-gray-100 text-gray-700' },
  };

  return stages[stage] || { label: stage, color: 'bg-gray-100 text-gray-700' };
}

export default function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay conversaciones</h3>
        <p className="text-gray-600">
          Las conversaciones apareceran aqui cuando tus clientes te escriban por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {conversations.map((conversation) => {
          const stage = getStageLabel(conversation.stage);
          return (
            <li key={conversation.id}>
              <Link
                href={`/dashboard/conversations/${conversation.id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {conversation.leadName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{conversation.leadName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{conversation.leadPhone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatTimeAgo(conversation.lastMessageTime)}</p>
                      <p className="text-xs text-gray-400">{conversation.messageCount} mensajes</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-1 pl-16">
                    {conversation.lastMessage}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

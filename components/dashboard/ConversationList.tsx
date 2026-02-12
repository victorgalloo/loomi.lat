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
    Cold: { label: 'Cold', color: 'bg-info/10 text-info' },
    Warm: { label: 'Warm', color: 'bg-terminal-yellow/10 text-terminal-yellow' },
    Hot: { label: 'Hot', color: 'bg-warning/10 text-warning' },
    Ganado: { label: 'Ganado', color: 'bg-terminal-green/10 text-terminal-green' },
    Perdido: { label: 'Perdido', color: 'bg-surface-2 text-muted' },
    // Legacy aliases
    initial: { label: 'Cold', color: 'bg-info/10 text-info' },
    qualified: { label: 'Hot', color: 'bg-warning/10 text-warning' },
    demo_scheduled: { label: 'Hot', color: 'bg-warning/10 text-warning' },
    customer: { label: 'Ganado', color: 'bg-terminal-green/10 text-terminal-green' },
    cold: { label: 'Cold', color: 'bg-info/10 text-info' },
  };

  return stages[stage] || { label: stage, color: 'bg-surface-2 text-muted' };
}

export default function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="bg-surface-elevated rounded-2xl border border-border p-12 text-center">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No hay conversaciones</h3>
        <p className="text-muted">
          Las conversaciones apareceran aqui cuando tus clientes te escriban por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
      <ul className="divide-y divide-border">
        {conversations.map((conversation) => {
          const stage = getStageLabel(conversation.stage);
          return (
            <li key={conversation.id}>
              <Link
                href={`/dashboard/conversations/${conversation.id}`}
                className="block hover:bg-surface transition-colors"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-muted">
                          {conversation.leadName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{conversation.leadName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted">{conversation.leadPhone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">{formatTimeAgo(conversation.lastMessageTime)}</p>
                      <p className="text-xs text-muted">{conversation.messageCount} mensajes</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted line-clamp-1 pl-16">
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

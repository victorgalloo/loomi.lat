'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal } from 'lucide-react';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  companyName?: string | null;
  contactEmail?: string | null;
  dealValue?: number | null;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  lastActivityAt?: string | null;
  broadcastClassification?: string | null;
  conversationCount?: number;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Classification stripe takes priority, then priority, then nothing
  const getLeftAccent = () => {
    if (lead.broadcastClassification) {
      const colors: Record<string, string> = {
        hot: 'border-l-[3px] border-l-warning',
        warm: 'border-l-[3px] border-l-terminal-yellow',
        cold: 'border-l-[3px] border-l-info',
        bot_autoresponse: 'border-l-[3px] border-l-muted',
      };
      return colors[lead.broadcastClassification] || '';
    }
    if (lead.priority === 'high') return 'border-l-[3px] border-l-warning';
    if (lead.priority === 'medium') return 'border-l-[3px] border-l-border-hover';
    return '';
  };

  const getRelativeTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
  };

  const relativeTime = getRelativeTime(lead.lastActivityAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group relative rounded-xl border p-2 cursor-grab active:cursor-grabbing
        transition-all duration-150
        bg-surface-elevated border-border hover:shadow-subtle hover:-translate-y-0.5
        ${getLeftAccent()}
        ${isDragging ? 'opacity-50 scale-105 shadow-elevated z-50' : ''}
      `}
    >

      {/* Content */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate text-foreground">{lead.name}</p>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {lead.dealValue && lead.dealValue > 0 && (
              <span className="text-xs tabular-nums font-mono text-muted">
                {formatCurrency(lead.dealValue)}
              </span>
            )}
            {relativeTime && (
              <span className="text-xs tabular-nums text-muted/60">{relativeTime}</span>
            )}
          </div>
        </div>
        {lead.companyName && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate text-muted">{lead.companyName}</p>
            {lead.conversationCount && lead.conversationCount > 0 && (
              <span className="text-xs tabular-nums text-muted/50">{lead.conversationCount} msg</span>
            )}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity duration-200 hover:bg-surface-2 text-muted"
        title="Opciones"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default memo(LeadCard);

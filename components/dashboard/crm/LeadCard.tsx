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

  const priorityBorder = {
    low: '',
    medium: 'border-l-[3px] border-l-warning',
    high: 'border-l-[3px] border-l-error',
  };

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
        ${priorityBorder[lead.priority]}
        ${isDragging ? 'opacity-50 scale-105 shadow-elevated z-50' : ''}
      `}
    >

      {/* Content */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate text-foreground">{lead.name}</p>
          {lead.broadcastClassification && (
            <span
              className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                ({
                  hot: 'bg-error',
                  warm: 'bg-warning',
                  cold: 'bg-info',
                  bot_autoresponse: 'bg-muted',
                } as Record<string, string>)[lead.broadcastClassification] || 'bg-muted'
              }`}
              title={lead.broadcastClassification === 'bot_autoresponse' ? 'bot' : lead.broadcastClassification}
            />
          )}
          {lead.dealValue && lead.dealValue > 0 && (
            <span className="ml-auto flex-shrink-0 text-xs tabular-nums font-mono text-muted">
              {formatCurrency(lead.dealValue)}
            </span>
          )}
        </div>
        {lead.companyName && (
          <p className="text-xs truncate mt-0.5 text-muted">{lead.companyName}</p>
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

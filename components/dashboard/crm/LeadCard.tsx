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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        group relative rounded-2xl border p-3 cursor-grab active:cursor-grabbing
        transition-all duration-150 shadow-subtle
        bg-surface-elevated border-border hover:shadow-card hover:-translate-y-0.5
        ${priorityBorder[lead.priority]}
        ${isDragging ? 'opacity-50 scale-105 shadow-elevated z-50' : ''}
      `}
    >

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium flex-shrink-0 bg-info-muted text-info">
          {getInitials(lead.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">
            {lead.name}
          </p>
          {lead.companyName && (
            <p className="text-xs truncate mt-0.5 text-muted">
              {lead.companyName}
            </p>
          )}
          {lead.broadcastClassification && (
            <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
              {
                hot: 'bg-orange-500/20 text-orange-400',
                warm: 'bg-yellow-500/20 text-yellow-400',
                cold: 'bg-blue-500/20 text-blue-400',
                bot_autoresponse: 'bg-zinc-500/20 text-zinc-400',
              }[lead.broadcastClassification] || 'bg-zinc-500/20 text-zinc-400'
            }`}>
              {lead.broadcastClassification === 'hot' && '🔥 '}{lead.broadcastClassification === 'bot_autoresponse' ? 'bot' : lead.broadcastClassification}
            </span>
          )}
        </div>
      </div>

      {/* Deal Value */}
      {lead.dealValue && lead.dealValue > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-sm tabular-nums font-medium text-info">
            {formatCurrency(lead.dealValue)}
          </span>
        </div>
      )}

      {/* Hover actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity duration-200 hover:bg-surface-2 text-muted"
        title="Opciones"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default memo(LeadCard);

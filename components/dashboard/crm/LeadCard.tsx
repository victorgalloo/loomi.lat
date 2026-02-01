'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { User, DollarSign, Clock, MessageCircle } from 'lucide-react';

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
  conversationCount?: number;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function LeadCard({ lead, onClick }: LeadCardProps) {
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-100 p-4 cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-emerald-500/20' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{lead.name}</p>
            {lead.companyName && (
              <p className="text-xs text-gray-500 truncate">{lead.companyName}</p>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityColors[lead.priority]}`}>
          {lead.priority === 'high' ? 'Alta' : lead.priority === 'medium' ? 'Media' : 'Baja'}
        </span>
      </div>

      {/* Deal Value */}
      {lead.dealValue && lead.dealValue > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="text-lg font-bold text-emerald-700">
            {formatCurrency(lead.dealValue)}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {lead.conversationCount !== undefined && lead.conversationCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lead.conversationCount}</span>
            </div>
          )}
          {lead.lastActivityAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(lead.lastActivityAt)}</span>
            </div>
          )}
        </div>
        <span className="font-mono text-gray-400">{lead.phone.slice(-4)}</span>
      </div>
    </motion.div>
  );
}

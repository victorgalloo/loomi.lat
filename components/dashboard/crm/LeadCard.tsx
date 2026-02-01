'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
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
  conversationCount?: number;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDarkMode?: boolean;
}

export default function LeadCard({ lead, onClick, isDarkMode = false }: LeadCardProps) {
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

  const priorityIndicator = {
    low: isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300',
    medium: 'bg-amber-500',
    high: 'bg-red-500',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group relative rounded-lg border p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-out
        ${isDarkMode
          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
        }
        ${isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : ''}
      `}
    >
      {/* Priority indicator */}
      <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${priorityIndicator[lead.priority]}`} />

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0
          ${isDarkMode
            ? 'bg-zinc-800 text-zinc-400'
            : 'bg-zinc-100 text-zinc-600'
          }
        `}>
          {getInitials(lead.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {lead.name}
          </p>
          {lead.companyName && (
            <p className={`text-xs truncate mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {lead.companyName}
            </p>
          )}
        </div>
      </div>

      {/* Deal Value */}
      {lead.dealValue && lead.dealValue > 0 && (
        <div className={`
          mt-3 pt-3 border-t
          ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}
        `}>
          <span className={`text-sm font-mono font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatCurrency(lead.dealValue)}
          </span>
        </div>
      )}

      {/* Hover actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`
          absolute top-2 right-6 opacity-0 group-hover:opacity-100 p-1 rounded
          transition-opacity duration-200
          ${isDarkMode ? 'hover:bg-zinc-700 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'}
        `}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

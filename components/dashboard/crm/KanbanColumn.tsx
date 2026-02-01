'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import LeadCard, { Lead } from './LeadCard';
import { Plus } from 'lucide-react';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  isWon?: boolean;
  isLost?: boolean;
}

interface KanbanColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onAddLead?: () => void;
}

const colorClasses: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export default function KanbanColumn({ stage, leads, onLeadClick, onAddLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.name });
  const colors = colorClasses[stage.color] || colorClasses.gray;

  const totalValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

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
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Header */}
      <div className={`p-3 rounded-t-xl ${colors.bg} border ${colors.border} border-b-0`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
            <h3 className={`font-semibold ${colors.text}`}>{stage.name}</h3>
          </div>
          <span className={`text-sm font-medium ${colors.text} bg-white/60 px-2 py-0.5 rounded-full`}>
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{formatCurrency(totalValue)}</span>
          </p>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-2 rounded-b-xl border border-gray-200 bg-gray-50/50
          min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto
          transition-colors duration-200
          ${isOver ? 'bg-emerald-50/50 border-emerald-300' : ''}
        `}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Lead Button */}
        {leads.length === 0 && (
          <motion.button
            onClick={onAddLead}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl
              text-gray-400 hover:text-emerald-600 hover:border-emerald-300
              transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Agregar lead</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

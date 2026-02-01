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
  isDarkMode?: boolean;
}

export default function KanbanColumn({ stage, leads, onLeadClick, onAddLead, isDarkMode = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.name });

  const totalValue = leads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Minimal color accents
  const stageColors: Record<string, string> = {
    cyan: isDarkMode ? 'bg-cyan-500' : 'bg-cyan-500',
    amber: isDarkMode ? 'bg-amber-500' : 'bg-amber-500',
    purple: isDarkMode ? 'bg-purple-500' : 'bg-purple-500',
    blue: isDarkMode ? 'bg-blue-500' : 'bg-blue-500',
    orange: isDarkMode ? 'bg-orange-500' : 'bg-orange-500',
    emerald: isDarkMode ? 'bg-emerald-500' : 'bg-emerald-500',
    red: isDarkMode ? 'bg-red-500' : 'bg-red-500',
    gray: isDarkMode ? 'bg-zinc-500' : 'bg-zinc-400',
  };

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stageColors[stage.color] || stageColors.gray}`} />
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {stage.name}
          </h3>
          <span className={`
            text-xs px-1.5 py-0.5 rounded font-medium
            ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-500'}
          `}>
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-lg p-2 space-y-2
          min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto
          transition-colors duration-200
          ${isDarkMode
            ? isOver ? 'bg-zinc-800/50' : 'bg-zinc-900/30'
            : isOver ? 'bg-zinc-100' : 'bg-zinc-50/50'
          }
        `}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? '#3f3f46 transparent' : '#d4d4d8 transparent',
        }}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick?.(lead)}
              isDarkMode={isDarkMode}
            />
          ))}
        </SortableContext>

        {/* Add Lead Button */}
        {leads.length === 0 && (
          <motion.button
            onClick={onAddLead}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              w-full p-3 rounded-lg border border-dashed
              transition-colors duration-200 flex items-center justify-center gap-2
              ${isDarkMode
                ? 'border-zinc-700 text-zinc-600 hover:border-zinc-600 hover:text-zinc-500'
                : 'border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-500'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium">Agregar</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

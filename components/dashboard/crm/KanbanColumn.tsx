'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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

function KanbanColumn({ stage, leads, onLeadClick, onAddLead }: KanbanColumnProps) {
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

  // Minimal color accents (stage dots keep accent colors)
  const stageColors: Record<string, string> = {
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    gray: 'bg-zinc-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
        minWidth: '300px',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 bg-surface rounded-xl px-3 py-2.5 border border-border/50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stageColors[stage.color] || stageColors.gray}`} />
          <h3 className="text-sm font-medium text-foreground/70">
            {stage.name}
          </h3>
          <span className="text-sm px-1.5 py-0.5 rounded font-medium bg-surface-2 border border-border text-muted">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-sm font-mono text-muted">
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-2xl p-2 space-y-2
          min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto
          transition-colors duration-200
          border border-border/50
          ${isOver ? 'bg-surface' : 'bg-surface/30'}
        `}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent',
        }}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick?.(lead)}
            />
          ))}
        </SortableContext>

        {/* Add Lead Button */}
        {leads.length === 0 && (
          <button
            onClick={onAddLead}
            className="w-full p-3 rounded-xl border border-dashed transition-colors duration-150 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] border-border text-muted hover:border-foreground/20 hover:text-foreground/50"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium">Agregar</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(KanbanColumn);

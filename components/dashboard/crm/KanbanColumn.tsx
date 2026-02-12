'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard, { Lead } from './LeadCard';
import { Download, Plus } from 'lucide-react';

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
  onExport?: (stage: PipelineStage, leads: Lead[]) => void;
}

function KanbanColumn({ stage, leads, onLeadClick, onAddLead, onExport }: KanbanColumnProps) {
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
    cyan: 'bg-info',
    amber: 'bg-warning',
    purple: 'bg-info',
    blue: 'bg-info',
    orange: 'bg-warning',
    emerald: 'bg-success',
    red: 'bg-warning',
    gray: 'bg-muted',
    indigo: 'bg-info',
  };

  const stageBorderColors: Record<string, string> = {
    cyan: 'border-t-info',
    amber: 'border-t-warning',
    purple: 'border-t-info',
    blue: 'border-t-info',
    orange: 'border-t-warning',
    emerald: 'border-t-success',
    red: 'border-t-warning',
    gray: 'border-t-muted',
    indigo: 'border-t-info',
  };

  return (
    <div className="flex flex-col w-[260px] min-w-[260px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1 py-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stageColors[stage.color] || stageColors.gray}`} />
          <h3 className="text-label font-medium text-muted">
            {stage.name}
          </h3>
          <span className="text-label tabular-nums text-muted/60">
            {leads.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalValue > 0 && (
            <span className="text-sm tabular-nums font-mono text-muted">
              {formatCurrency(totalValue)}
            </span>
          )}
          {leads.length > 0 && onExport && (
            <button
              onClick={() => onExport(stage, leads)}
              className="p-0.5 rounded-lg transition-colors text-muted hover:text-foreground hover:bg-surface-2"
              title={`Exportar ${stage.name}`}
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-xl p-1.5 space-y-1.5
          min-h-[120px] max-h-[calc(100vh-240px)] overflow-y-auto
          transition-colors duration-200
          border-t-2 ${stageBorderColors[stage.color] || 'border-t-muted'}
          ${isOver ? 'bg-surface/50' : ''}
        `}
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

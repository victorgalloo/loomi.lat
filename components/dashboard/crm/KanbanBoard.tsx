'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn, { PipelineStage } from './KanbanColumn';
import LeadCard, { Lead } from './LeadCard';
import LeadDetailModal from './LeadDetailModal';

interface KanbanBoardProps {
  stages: PipelineStage[];
  initialLeads: Lead[];
  onLeadMove?: (leadId: string, newStage: string) => Promise<void>;
  onLeadUpdate?: (leadId: string, data: Partial<Lead>) => Promise<void>;
  onLeadDelete?: (leadId: string) => Promise<void>;
  onAddLead?: () => void;
  onExportColumn?: (stage: PipelineStage, leads: Lead[]) => void;
}

function KanbanBoard({
  stages,
  initialLeads,
  onLeadMove,
  onLeadUpdate,
  onLeadDelete,
  onAddLead,
  onExportColumn,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sync leads when initialLeads changes (from realtime or parent state)
  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getLeadsByStage = useCallback((stageName: string) => {
    return leads.filter((lead) => lead.stage === stageName);
  }, [leads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    const isOverColumn = stages.some(s => s.name === overId);
    const newStage = isOverColumn
      ? overId
      : leads.find(l => l.id === overId)?.stage;

    if (!newStage) return;

    const activeLead = leads.find(l => l.id === activeLeadId);
    if (!activeLead || activeLead.stage === newStage) return;

    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === activeLeadId ? { ...lead, stage: newStage } : lead
      )
    );

    try {
      await onLeadMove?.(activeLeadId, newStage);
    } catch (error) {
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === activeLeadId ? { ...lead, stage: activeLead.stage } : lead
        )
      );
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleLeadSave = async (leadId: string, data: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, ...data } : lead
      )
    );
    setSelectedLead(null);

    await onLeadUpdate?.(leadId, data);
  };

  const handleLeadDelete = async (leadId: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    setSelectedLead(null);
    await onLeadDelete?.(leadId);
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-3 overflow-x-auto pb-4 min-w-max">
          {stages
            .sort((a, b) => a.position - b.position)
            .map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.name)}
                onLeadClick={handleLeadClick}
                onAddLead={onAddLead}
                onExport={onExportColumn}
              />
            ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 scale-105">
              <LeadCard lead={activeLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          stages={stages}
          onClose={() => setSelectedLead(null)}
          onSave={handleLeadSave}
          onDelete={handleLeadDelete}
        />
      )}
    </>
  );
}

export default KanbanBoard;

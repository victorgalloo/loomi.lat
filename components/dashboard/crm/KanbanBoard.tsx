'use client';

import { useState, memo, useCallback } from 'react';
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
  isDarkMode?: boolean;
}

function KanbanBoard({
  stages,
  initialLeads,
  onLeadMove,
  onLeadUpdate,
  isDarkMode = false,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {stages
            .sort((a, b) => a.position - b.position)
            .map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.name)}
                onLeadClick={handleLeadClick}
                isDarkMode={isDarkMode}
              />
            ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-2 scale-105">
              <LeadCard lead={activeLead} isDarkMode={isDarkMode} />
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
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}

export default memo(KanbanBoard);

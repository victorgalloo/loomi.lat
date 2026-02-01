'use client';

import { useState } from 'react';
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
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn, { PipelineStage } from './KanbanColumn';
import LeadCard, { Lead } from './LeadCard';
import LeadDetailModal from './LeadDetailModal';

interface KanbanBoardProps {
  stages: PipelineStage[];
  initialLeads: Lead[];
  onLeadMove?: (leadId: string, newStage: string) => Promise<void>;
  onLeadUpdate?: (leadId: string, data: Partial<Lead>) => Promise<void>;
}

export default function KanbanBoard({
  stages,
  initialLeads,
  onLeadMove,
  onLeadUpdate,
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

  const getLeadsByStage = (stageName: string) => {
    return leads.filter((lead) => lead.stage === stageName);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column (stage name) or another card
    const isOverColumn = stages.some(s => s.name === overId);
    const newStage = isOverColumn
      ? overId
      : leads.find(l => l.id === overId)?.stage;

    if (!newStage) return;

    const activeLead = leads.find(l => l.id === activeLeadId);
    if (!activeLead || activeLead.stage === newStage) return;

    // Optimistic update
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === activeLeadId ? { ...lead, stage: newStage } : lead
      )
    );

    // Call API
    try {
      await onLeadMove?.(activeLeadId, newStage);
    } catch (error) {
      // Revert on error
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
    // Optimistic update
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
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {stages
            .sort((a, b) => a.position - b.position)
            .map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.name)}
                onLeadClick={handleLeadClick}
              />
            ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="rotate-3 opacity-90">
              <LeadCard lead={activeLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          stages={stages}
          onClose={() => setSelectedLead(null)}
          onSave={handleLeadSave}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = ['CRM', 'Inbox', 'Agente'] as const;
type Tab = (typeof TABS)[number];

// CRM Tab - Kanban columns with cards
function CRMTab() {
  const columns = [
    {
      title: 'Cold',
      cards: [
        { name: 'María López', phone: '+52 55 1234', badge: 'cold' },
        { name: 'Carlos Ruiz', phone: '+52 33 5678', badge: 'cold' },
      ],
    },
    {
      title: 'Warm',
      cards: [
        { name: 'Ana Torres', phone: '+52 81 9012', badge: 'warm' },
        { name: 'Diego Mora', phone: '+52 44 3456', badge: 'warm' },
      ],
    },
    {
      title: 'Hot',
      cards: [
        { name: 'Laura Vega', phone: '+52 55 7890', badge: 'hot' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {columns.map((col) => (
        <div key={col.title} className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted">{col.title}</span>
            <span className="text-xs font-mono text-muted">{col.cards.length}</span>
          </div>
          <AnimatePresence mode="popLayout">
            {col.cards.map((card) => (
              <motion.div
                key={card.name}
                layoutId={`dp-${card.name}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-lg bg-surface border border-border"
              >
                <p className="text-sm text-foreground font-medium truncate">{card.name}</p>
                <p className="text-xs font-mono text-muted mt-1">{card.phone}</p>
                <span className={`inline-block mt-2 text-xs font-mono px-2 py-0.5 rounded-full ${
                  card.badge === 'hot'
                    ? 'bg-warning/10 text-warning'
                    : card.badge === 'warm'
                    ? 'bg-terminal-yellow/10 text-terminal-yellow'
                    : 'bg-info/10 text-info'
                }`}>
                  {card.badge}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// Inbox Tab - Conversation list
function InboxTab() {
  const conversations = [
    { name: 'María López', preview: 'Sí me interesa, ¿cuánto cuesta?', time: '2m', active: true },
    { name: 'Carlos Ruiz', preview: 'Perfecto, agendado para el jueves', time: '15m', active: false },
    { name: 'Ana Torres', preview: 'Gracias por la info', time: '1h', active: false },
    { name: 'Diego Mora', preview: '¿Tienen plan enterprise?', time: '3h', active: false },
  ];

  return (
    <div className="p-4 space-y-1">
      {conversations.map((conv, i) => (
        <motion.div
          key={conv.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            conv.active ? 'bg-surface-2' : 'hover:bg-surface'
          }`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
              <span className="text-xs font-mono text-muted">{conv.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            {conv.active && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-terminal-green border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{conv.name}</span>
              <span className="text-xs font-mono text-muted">{conv.time}</span>
            </div>
            <p className="text-xs text-muted truncate mt-0.5">{conv.preview}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Agent Tab - Config preview
function AgentTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Prompt area */}
      <div>
        <span className="text-xs font-mono text-muted mb-2 block">system_prompt</span>
        <div className="p-3 rounded-lg bg-surface border border-border font-mono text-xs text-muted leading-relaxed h-20 overflow-hidden">
          Eres un agente de ventas para {"{{empresa}}"}. Tu objetivo es calificar leads y agendar demos. Responde siempre en español, sé profesional pero cercano...
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { label: 'Análisis IA', enabled: true },
          { label: 'Auto-reply', enabled: true },
          { label: 'Voz', enabled: false },
        ].map((toggle) => (
          <div key={toggle.label} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{toggle.label}</span>
            <div className={`w-10 h-6 rounded-full ${toggle.enabled ? 'bg-terminal-green' : 'bg-border'}`}>
              <div
                className={`w-4 h-4 rounded-full bg-background mt-1 transition-transform ${
                  toggle.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tone badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Tono:</span>
        <span className="text-xs font-mono px-2 py-1 rounded-full bg-surface-2 border border-border text-foreground">
          profesional
        </span>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<Tab>('CRM');

  return (
    <section className="py-32 sm:py-48 px-4 sm:px-6 relative overflow-hidden bg-background">
      <div className="relative max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-20 text-center font-mono"
        >
          Así se ve por dentro
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-surface overflow-hidden"
        >
          {/* Terminal header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-terminal-red" />
              <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
              <div className="w-3 h-3 rounded-full bg-terminal-green" />
            </div>
            <span className="text-xs text-muted font-mono ml-2">loomi_dashboard</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-mono transition-colors relative ${
                  activeTab === tab ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="dp-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'CRM' && <CRMTab />}
                {activeTab === 'Inbox' && <InboxTab />}
                {activeTab === 'Agente' && <AgentTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

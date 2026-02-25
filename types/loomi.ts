export interface WhatsAppMessage {
  phone: string;
  name: string;
  text: string;
  messageId: string;
  timestamp: Date;
}

export interface Lead {
  id: string;
  phone: string;
  name: string;
  email?: string;
  company?: string;
  industry?: string;
  stage: string;
  createdAt: Date;
  lastInteraction: Date;
  // Datos de calificación del Flow
  challenge?: string;
  messageVolume?: string;
  isQualified?: boolean;
  serviceWindowStart?: Date | null;
  serviceWindowType?: 'standard' | 'ctwa' | null;
}

export interface Conversation {
  id: string;
  leadId: string;
  startedAt: Date;
  endedAt?: Date;
  summary?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Appointment {
  id: string;
  scheduledAt: Date;
  eventId?: string;
}

export type Intent =
  | 'SALUDO'
  | 'PREGUNTA_SERVICIO'
  | 'INTERES'
  | 'OBJECION_PRECIO'
  | 'OBJECION_TIEMPO'
  | 'OBJECION_DUDA'
  | 'AGENDAR'
  | 'REAGENDAR'
  | 'CONFIRMAR_HORA'
  | 'CANCELAR_CITA'
  | 'CONFIRMAR_EMAIL'
  | 'PROPORCIONAR_EMAIL'
  | 'DESPEDIDA'
  | 'OTRO';

export interface Classification {
  intent: Intent;
  date?: string;
  time?: string;
  email?: string;
  industry?: string;
  confidence: number;
}

export interface ConversationContext {
  lead: Lead;
  conversation: Conversation;
  recentMessages: Message[];
  memory?: string | null;
  appointment?: Appointment;
  hasActiveAppointment: boolean;
  isFirstConversation?: boolean;
  totalConversations?: number;
  firstInteractionDate?: Date | null;
}

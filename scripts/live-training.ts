/**
 * Script de entrenamiento en vivo
 * Permite probar conversaciones interactivas con el bot
 *
 * Uso:
 *   npm run train:live
 */

import * as dotenv from 'dotenv';
// Load .env.local first
dotenv.config({ path: '.env.local' });

import * as readline from 'readline';
import { simpleAgent } from '../lib/agents/simple-agent';
import { ConversationContext, Message } from '../types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n===========================================');
  console.log('   LIVE TRAINING MODE');
  console.log('===========================================');
  console.log('Escribe mensajes como si fueras un cliente.');
  console.log('Escribe "exit" para salir, "reset" para nueva conversación.\n');

  let messages: Message[] = [];
  const startTime = new Date();

  const context: ConversationContext = {
    lead: {
      id: 'live-test',
      phone: '+1234567890',
      name: 'Usuario Test',
      stage: 'new',
      createdAt: startTime,
      lastInteraction: startTime,
    },
    conversation: {
      id: 'conv-live',
      leadId: 'live-test',
      startedAt: startTime,
    },
    recentMessages: messages,
    hasActiveAppointment: false,
  };

  while (true) {
    const input = await prompt('\n👤 Tú: ');

    if (input.toLowerCase() === 'exit') {
      console.log('\nGracias por entrenar. Hasta luego!');
      break;
    }

    if (input.toLowerCase() === 'reset') {
      messages = [];
      context.recentMessages = messages;
      console.log('\n--- Conversación reiniciada ---\n');
      continue;
    }

    if (!input.trim()) {
      continue;
    }

    // Agregar mensaje del usuario
    messages.push({
      id: `msg-${messages.length}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    });

    try {
      // Obtener respuesta del agente
      const result = await simpleAgent(input, context);

      // Agregar respuesta del agente
      messages.push({
        id: `msg-${messages.length}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      });

      console.log(`\n🤖 Bot: ${result.response}`);

      if (result.showScheduleList) {
        console.log(`   [Action: Show schedule list]`);
      }
      if (result.appointmentBooked) {
        console.log(`   [Action: Appointment booked for ${result.appointmentBooked.date} ${result.appointmentBooked.time}]`);
      }
    } catch (error) {
      console.error('\n❌ Error:', error);
    }
  }

  rl.close();
}

main().catch(console.error);

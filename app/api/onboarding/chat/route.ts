/**
 * Conversational Onboarding API
 *
 * Uses GPT to have a natural conversation that extracts:
 * - Business name
 * - What they sell/offer
 * - Desired tone
 *
 * Then generates a custom system prompt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const ONBOARDING_SYSTEM_PROMPT = `Eres un asistente que ayuda a configurar un agente de WhatsApp para negocios.

Tu objetivo es extraer esta información en una conversación natural y breve (máximo 4-5 intercambios):
1. Nombre del negocio
2. Qué venden o qué servicios ofrecen (breve)
3. Cómo quieren que suene el agente (tono: formal, amigable, directo, etc.)

Reglas:
- Sé conciso y directo, no hagas preguntas largas
- Una pregunta a la vez
- Si el usuario da respuestas cortas, está bien, no pidas más detalles innecesarios
- Cuando tengas la info suficiente (nombre, qué hacen, tono), responde con el JSON de extracción

Cuando tengas suficiente información, termina tu mensaje con este formato EXACTO en una línea nueva:
[COMPLETE]{"businessName":"...","businessDescription":"...","productsServices":"...","tone":"...","industry":"..."}[/COMPLETE]

Para industry usa uno de: real_estate, ecommerce, professional_services, restaurant, healthcare, education, saas, fitness, automotive, custom

Para tone usa: professional, friendly, casual, formal

Ejemplo de flujo:
- Tú: ¿Cómo se llama tu negocio?
- Usuario: Seguros García
- Tú: ¿Qué tipo de seguros manejan?
- Usuario: Vida y gastos médicos mayores
- Tú: ¿Cómo te gustaría que suene tu agente? ¿Formal, amigable, directo?
- Usuario: Amigable pero profesional
- Tú: Perfecto, ya tengo todo lo que necesito para crear tu agente.
[COMPLETE]{"businessName":"Seguros García","businessDescription":"Agencia de seguros","productsServices":"Seguros de vida y gastos médicos mayores","tone":"friendly","industry":"professional_services"}[/COMPLETE]`;

const PROMPT_GENERATOR_SYSTEM = `Genera un system prompt en español para un agente de WhatsApp de ventas.

El prompt debe:
1. Definir el rol del agente (asistente de [negocio])
2. Describir brevemente qué ofrece el negocio
3. Establecer el tono de comunicación
4. Dar instrucciones claras de:
   - Cómo saludar
   - Qué información recolectar del cliente
   - Cuándo ofrecer agendar una cita/demo
   - Cómo manejar preguntas de precio
5. Ser conciso (máximo 300 palabras)

No uses placeholders como {{variable}}, usa la información real proporcionada.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Build messages for the onboarding conversation
    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content.replace(/\[COMPLETE\][\s\S]*\[\/COMPLETE\]/, '').trim(),
      })),
      { role: 'user' as const, content: message },
    ];

    // Generate response
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: ONBOARDING_SYSTEM_PROMPT,
      messages,
      maxOutputTokens: 500,
    });

    let response = result.text || '';
    let isComplete = false;
    let extractedConfig = null;
    let generatedPrompt = '';

    // Check if onboarding is complete
    const completeMatch = response.match(/\[COMPLETE\]([\s\S]*?)\[\/COMPLETE\]/);
    if (completeMatch) {
      try {
        extractedConfig = JSON.parse(completeMatch[1]);
        isComplete = true;

        // Clean the response (remove the JSON part)
        response = response.replace(/\[COMPLETE\][\s\S]*\[\/COMPLETE\]/, '').trim();

        // Generate the actual system prompt
        const promptResult = await generateText({
          model: openai('gpt-4o-mini'),
          system: PROMPT_GENERATOR_SYSTEM,
          messages: [{
            role: 'user',
            content: `Genera el system prompt para:
- Negocio: ${extractedConfig.businessName}
- Descripción: ${extractedConfig.businessDescription}
- Productos/Servicios: ${extractedConfig.productsServices}
- Tono: ${extractedConfig.tone}
- Industria: ${extractedConfig.industry}`
          }],
          maxOutputTokens: 800,
        });

        generatedPrompt = promptResult.text || '';
      } catch (e) {
        console.error('Error parsing config:', e);
      }
    }

    return NextResponse.json({
      response,
      isComplete,
      extractedConfig,
      generatedPrompt,
    });
  } catch (error) {
    console.error('Onboarding chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

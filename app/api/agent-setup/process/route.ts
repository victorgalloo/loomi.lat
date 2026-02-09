/**
 * POST /api/agent-setup/process
 *
 * Processes raw tenant content (conversations, website copy, emails, catalogs)
 * with an LLM to extract structured agent configuration fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ExtractedConfigSchema = z.object({
  systemPrompt: z.string().describe('System prompt completo para el agente, incluyendo personalidad, tono y reglas'),
  productContext: z.string().describe('Descripción del producto/servicio, features, diferenciadores'),
  pricingContext: z.string().describe('Planes, precios, ROI, ofertas'),
  salesProcessContext: z.string().describe('Pasos del proceso de venta ideal'),
  qualificationContext: z.string().describe('Criterios de buen/mal fit para el producto'),
  competitorContext: z.string().describe('Alternativas del mercado y cómo diferenciarse'),
  objectionHandlers: z.record(z.string(), z.string()).describe('Tipo de objeción → script de manejo'),
  agentName: z.string().describe('Nombre sugerido para el agente (ej: "Sofía", "Carlos")'),
  agentRole: z.string().describe('Rol del agente (ej: "asesora de ventas", "especialista en seguros")'),
  fewShotExamples: z.array(z.object({
    id: z.string(),
    tags: z.array(z.string()),
    context: z.string(),
    conversation: z.string(),
    whyItWorked: z.string(),
  })).describe('Ejemplos de conversaciones extraídos del contenido'),
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { rawContent, contentType, existingConfig } = body as {
      rawContent: string;
      contentType?: string;
      existingConfig?: Record<string, unknown>;
    };

    if (!rawContent || typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'rawContent es requerido' }, { status: 400 });
    }

    if (rawContent.length > 50000) {
      return NextResponse.json({ error: 'Contenido demasiado largo (máximo 50,000 caracteres)' }, { status: 400 });
    }

    const contentHint = contentType
      ? `El usuario indica que el contenido es de tipo: ${contentType}.`
      : 'El tipo de contenido no fue especificado, analiza el formato para determinarlo.';

    const existingConfigHint = existingConfig
      ? `\n\nConfig existente del agente (para referencia):\n${JSON.stringify(existingConfig, null, 2)}`
      : '';

    const result = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: ExtractedConfigSchema,
      prompt: `Eres un experto en configurar agentes de ventas por WhatsApp. Analiza el siguiente contenido proporcionado por un negocio y extrae toda la información relevante para configurar su agente de IA.

${contentHint}${existingConfigHint}

# CONTENIDO DEL NEGOCIO
${rawContent}

# TU TAREA

Extrae la siguiente información del contenido. Si algo no está claro, infiere razonablemente basándote en el tipo de negocio. Si no hay suficiente información para un campo, proporciona un valor útil por defecto.

1. **systemPrompt**: Escribe un system prompt completo para el agente. Incluye:
   - Personalidad y tono (inferido del contenido - si hay conversaciones, imita su estilo)
   - Descripción del negocio y qué vende
   - Reglas de conversación (mensajes cortos, una pregunta a la vez, usar nombre)
   - Proceso de venta paso a paso
   - Manejo de multimedia y audios
   - Cuándo escalar a humano
   El prompt debe estar en español y ser específico para este negocio.

2. **productContext**: Qué vende el negocio, features clave, diferenciadores.

3. **pricingContext**: Precios, planes, ROI. Si no hay precios explícitos, indica "Consultar precios con el equipo".

4. **salesProcessContext**: Cómo debería fluir una conversación de venta ideal (pasos numerados).

5. **qualificationContext**: Quién es buen fit y quién no para este producto/servicio.

6. **competitorContext**: Alternativas mencionadas y cómo diferenciarse.

7. **objectionHandlers**: Objeciones comunes para este tipo de negocio con scripts de manejo. Usa claves como: "precio", "timing", "no_confio_ia", "ya_tengo", "no_necesito".

8. **agentName**: Sugiere un nombre apropiado para el agente.

9. **agentRole**: Define el rol (ej: "asesora de ventas de [negocio]").

10. **fewShotExamples**: Si el contenido incluye conversaciones reales, extrae los mejores ejemplos como few-shot. Si no hay conversaciones, genera 2-3 ejemplos ficticios pero realistas.

IMPORTANTE:
- Todo en español
- Sé específico para este negocio, no genérico
- El system prompt debe ser detallado (mínimo 500 palabras)
- Los objection handlers deben ser prácticos y accionables`,
      temperature: 0.4,
    });

    // Calculate confidence based on content length and richness
    const contentLength = rawContent.length;
    const hasConversations = /cliente:|usuario:|lead:/i.test(rawContent);
    const hasPricing = /\$|\bprecio|\bplan|\bcost/i.test(rawContent);
    const hasProducts = /producto|servicio|feature|característica/i.test(rawContent);

    let confidence = 0.5;
    if (contentLength > 2000) confidence += 0.1;
    if (contentLength > 5000) confidence += 0.1;
    if (hasConversations) confidence += 0.1;
    if (hasPricing) confidence += 0.1;
    if (hasProducts) confidence += 0.1;
    confidence = Math.min(confidence, 1.0);

    // Generate suggestions for what else the user could provide
    const suggestions: string[] = [];
    if (!hasConversations) {
      suggestions.push('Pega conversaciones reales de WhatsApp para que el agente aprenda tu estilo de comunicación');
    }
    if (!hasPricing) {
      suggestions.push('Incluye información de precios y planes para que el agente pueda responder consultas');
    }
    if (contentLength < 1000) {
      suggestions.push('Agrega más contenido (textos de tu web, emails, catálogos) para una mejor configuración');
    }

    return NextResponse.json({
      extracted: result.object,
      confidence,
      suggestions,
    });
  } catch (error) {
    console.error('[AgentSetup] Process error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el contenido. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}

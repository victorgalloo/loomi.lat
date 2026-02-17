/**
 * Generate pre-computed embeddings for few-shot examples
 *
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/generate-few-shot-embeddings.ts
 *
 * Reads the EXAMPLES from few-shot.ts, generates embeddings via Azure OpenAI,
 * and writes them to lib/agents/few-shot-embeddings.json
 */

import { AzureOpenAIEmbeddings } from '@langchain/openai';
import * as fs from 'fs';
import * as path from 'path';

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_RESOURCE_NAME ?? 'loomi',
  azureOpenAIApiDeploymentName: 'text-embedding-3-small',
  azureOpenAIApiVersion: '2024-02-15-preview',
});

// Manually define the examples data (same IDs/tags/context as few-shot.ts)
// We extract just what we need for embedding generation
const EXAMPLES = [
  {
    id: 'new_lead_ad',
    tags: ['hola', 'anuncio', 'vi', 'información', 'nuevo'],
    context: 'Lead nuevo que llega del anuncio de Meta',
    firstUserMessage: 'Hola, vi su anuncio',
  },
  {
    id: 'new_lead_curious',
    tags: ['hola', 'qué es', 'cómo funciona', 'nuevo'],
    context: 'Lead curioso preguntando qué es Loomi',
    firstUserMessage: 'Hola, ¿qué es exactamente Loomi?',
  },
  {
    id: 'price_question',
    tags: ['precio', 'cuánto', 'cuesta', 'planes', 'costo'],
    context: 'Lead preguntando directamente por precio',
    firstUserMessage: '¿Cuánto cuesta?',
  },
  {
    id: 'price_expensive',
    tags: ['caro', 'presupuesto', 'mucho', 'no tengo'],
    context: 'Lead dice que está caro',
    firstUserMessage: '$199 está caro para nosotros',
  },
  {
    id: 'has_wati',
    tags: ['wati', 'manychat', 'leadsales', 'ya uso', 'ya tengo', 'bot'],
    context: 'Lead que ya usa un competidor',
    firstUserMessage: 'Ya usamos Wati',
  },
  {
    id: 'comparing_options',
    tags: ['comparar', 'diferencia', 'mejor', 'vs', 'opciones'],
    context: 'Lead comparando opciones',
    firstUserMessage: '¿Qué diferencia hay con otros chatbots?',
  },
  {
    id: 'skeptic_bots',
    tags: ['no sirve', 'no confío', 'bots', 'mal', 'robótico'],
    context: 'Lead escéptico de bots/IA',
    firstUserMessage: 'La neta los bots no sirven, responden muy robótico',
  },
  {
    id: 'low_volume',
    tags: ['pocos', 'poco', 'mensajes', '10', '15', '20'],
    context: 'Lead con bajo volumen de mensajes',
    firstUserMessage: 'Recibimos como 15 mensajes al día',
  },
  {
    id: 'think_about_it',
    tags: ['pienso', 'pensar', 'después', 'luego', 'no sé'],
    context: 'Lead quiere postergar',
    firstUserMessage: 'Déjame pensarlo',
  },
  {
    id: 'first_rejection_probe',
    tags: ['no me interesa', 'no gracias', 'rechazo', 'no quiero'],
    context: 'Lead dice que no le interesa por primera vez',
    firstUserMessage: 'No me interesa, gracias',
  },
  {
    id: 'second_rejection_respect',
    tags: ['no me interesa', 'no gracias', 'rechazo', 'no quiero', 'ya dije que no'],
    context: 'Lead dice que no por segunda vez (ya se hizo sondeo)',
    firstUserMessage: 'No, de verdad no me interesa',
  },
  {
    id: 'wants_demo',
    tags: ['demo', 'mostrar', 'ver', 'funciona', 'probar'],
    context: 'Lead interesado en ver el producto',
    firstUserMessage: 'Me interesa, ¿me puedes mostrar cómo funciona?',
  },
  {
    id: 'ready_to_buy',
    tags: ['quiero', 'contratar', 'activar', 'empezar', 'comprar'],
    context: 'Lead listo para comprar',
    firstUserMessage: 'Ok me convence, ¿cómo le hago?',
  },
  {
    id: 'technical_integration',
    tags: ['integra', 'api', 'crm', 'conectar', 'técnico'],
    context: 'Lead con preguntas técnicas',
    firstUserMessage: '¿Se integra con mi CRM?',
  },
  {
    id: 'ecommerce',
    tags: ['tienda', 'ecommerce', 'productos', 'vendo'],
    context: 'Tienda online / ecommerce',
    firstUserMessage: 'Tenemos una tienda de ropa online',
  },
  {
    id: 'services',
    tags: ['servicios', 'consultoría', 'agencia', 'citas'],
    context: 'Negocio de servicios / citas',
    firstUserMessage: 'Somos una clínica dental',
  },
];

async function generateEmbeddings() {
  console.log(`Generating embeddings for ${EXAMPLES.length} examples...`);

  const results: Array<{ id: string; embedding: number[] }> = [];

  for (const example of EXAMPLES) {
    const text = `${example.context} | ${example.tags.join(', ')} | ${example.firstUserMessage}`;
    console.log(`  → ${example.id}: "${text.substring(0, 60)}..."`);

    const embedding = await embeddings.embedQuery(text);

    results.push({
      id: example.id,
      embedding,
    });
  }

  const outputPath = path.join(__dirname, '..', 'lib', 'agents', 'few-shot-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nDone! Wrote ${results.length} embeddings to ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

generateEmbeddings().catch(console.error);

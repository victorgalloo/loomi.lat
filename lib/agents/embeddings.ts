/**
 * Embeddings Utility
 * Provides text embedding and cosine similarity for semantic matching
 */

import { embed } from 'ai';
import { createAzure } from '@ai-sdk/azure';

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME ?? 'loomi',
  apiKey: process.env.AZURE_OPENAI_API_KEY ?? '',
});

// Simple LRU cache for embeddings
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  embedding: number[];
  timestamp: number;
}

const embeddingCache = new Map<string, CacheEntry>();

function evictStaleEntries(): void {
  const now = Date.now();
  for (const [key, entry] of embeddingCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      embeddingCache.delete(key);
    }
  }
}

/**
 * Generate embedding for text using OpenAI text-embedding-3-small
 * Includes LRU cache with 15min TTL
 */
export async function embedText(text: string): Promise<number[]> {
  // Check cache first
  const cached = embeddingCache.get(text);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.embedding;
  }

  const result = await embed({
    model: azure.embedding('text-embedding-3-small'),
    value: text,
  });

  // Evict stale entries if cache is full
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    evictStaleEntries();
    // If still full after eviction, delete oldest entry
    if (embeddingCache.size >= CACHE_MAX_SIZE) {
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }
  }

  embeddingCache.set(text, {
    embedding: result.embedding,
    timestamp: Date.now(),
  });

  return result.embedding;
}

/**
 * Compute cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return _supabase;
}

const supabase = { get client() { return getSupabase(); } };

// Check if we're in test mode
const isTestMode = (): boolean => {
  return process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
};

// ============================================
// Types
// ============================================

export interface KBResult {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export interface PricingTier {
  id: string;
  name: string;
  minVolume: number;
  maxVolume: number | null;
  priceUsd: number;
  features: string[];
  recommended: boolean;
}

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  companyName: string | null;
  pdfUrl: string | null;
}

// ============================================
// Mock Data for Test Mode
// ============================================

const MOCK_KB: KBResult[] = [
  { id: '1', question: '¿Cómo se integra?', answer: 'Se conecta vía API oficial de WhatsApp Business. El proceso toma entre 1-2 semanas.', category: 'technical' },
  { id: '2', question: '¿Cuánto tarda implementar?', answer: 'Entre 1-2 semanas dependiendo de la complejidad.', category: 'technical' },
  { id: '3', question: '¿Funciona con mi CRM?', answer: 'Sí, integramos con HubSpot, Pipedrive, Salesforce, Zoho y otros CRMs populares.', category: 'technical' },
];

const MOCK_PRICING: PricingTier[] = [
  { id: '1', name: 'Starter', minVolume: 0, maxVolume: 100, priceUsd: 199, features: ['Respuestas 24/7', 'Calificación de leads', 'Agenda automática', 'Dashboard básico'], recommended: false },
  { id: '2', name: 'Growth', minVolume: 101, maxVolume: 300, priceUsd: 349, features: ['Todo de Starter', 'Integraciones CRM', 'Reportes avanzados', 'Soporte prioritario'], recommended: true },
  { id: '3', name: 'Business', minVolume: 301, maxVolume: 1000, priceUsd: 599, features: ['Todo de Growth', 'Multi-agente', 'API personalizada', 'Account manager'], recommended: false },
  { id: '4', name: 'Enterprise', minVolume: 1001, maxVolume: null, priceUsd: 0, features: ['Todo de Business', 'SLA garantizado', 'Desarrollo custom', 'Soporte 24/7'], recommended: false },
];

// ============================================
// Knowledge Base Functions
// ============================================

export async function searchKnowledgeBase(query: string): Promise<KBResult[]> {
  if (isTestMode()) {
    console.log(`[Knowledge Mock] Searching for: ${query}`);
    const lowerQuery = query.toLowerCase();
    const results = MOCK_KB.filter(kb =>
      kb.question.toLowerCase().includes(lowerQuery) ||
      kb.answer.toLowerCase().includes(lowerQuery)
    );
    return results;
  }

  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

    // Search by keywords array or text content
    const { data, error } = await supabase.client
      .from('knowledge_base')
      .select('id, question, answer, category')
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(3);

    if (error) {
      console.error('[Knowledge] Search error:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      // Try broader search with individual terms
      for (const term of searchTerms) {
        const { data: termData } = await supabase.client
          .from('knowledge_base')
          .select('id, question, answer, category')
          .or(`question.ilike.%${term}%,answer.ilike.%${term}%,keywords.cs.{${term}}`)
          .limit(3);

        if (termData && termData.length > 0) {
          return termData.map(row => ({
            id: row.id,
            question: row.question,
            answer: row.answer,
            category: row.category,
          }));
        }
      }
      return [];
    }

    return data.map(row => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category,
    }));
  } catch (error) {
    console.error('[Knowledge] Search error:', error);
    return [];
  }
}

// ============================================
// Pricing Functions
// ============================================

export async function getPricingForVolume(volume: number): Promise<PricingTier> {
  if (isTestMode()) {
    console.log(`[Pricing Mock] Getting pricing for volume: ${volume}`);
    const tier = MOCK_PRICING.find(t =>
      volume >= t.minVolume && (t.maxVolume === null || volume <= t.maxVolume)
    );
    return tier || MOCK_PRICING[MOCK_PRICING.length - 1];
  }

  try {
    const { data, error } = await supabase.client
      .from('pricing_tiers')
      .select('*')
      .lte('min_volume', volume)
      .or(`max_volume.gte.${volume},max_volume.is.null`)
      .order('min_volume', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('[Pricing] Error:', error?.message);
      // Return enterprise tier for high volumes or starter for low
      const { data: fallback } = await supabase.client
        .from('pricing_tiers')
        .select('*')
        .order('min_volume', { ascending: volume < 50 })
        .limit(1)
        .single();

      if (fallback) {
        return {
          id: fallback.id,
          name: fallback.name,
          minVolume: fallback.min_volume,
          maxVolume: fallback.max_volume,
          priceUsd: parseFloat(fallback.price_usd),
          features: fallback.features || [],
          recommended: fallback.recommended,
        };
      }

      // Last resort fallback
      return {
        id: 'default',
        name: 'Starter',
        minVolume: 0,
        maxVolume: 100,
        priceUsd: 199,
        features: ['Respuestas 24/7', 'Calificación de leads'],
        recommended: false,
      };
    }

    return {
      id: data.id,
      name: data.name,
      minVolume: data.min_volume,
      maxVolume: data.max_volume,
      priceUsd: parseFloat(data.price_usd),
      features: data.features || [],
      recommended: data.recommended,
    };
  } catch (error) {
    console.error('[Pricing] Error:', error);
    return {
      id: 'default',
      name: 'Starter',
      minVolume: 0,
      maxVolume: 100,
      priceUsd: 199,
      features: ['Respuestas 24/7', 'Calificación de leads'],
      recommended: false,
    };
  }
}

export async function getAllPricingTiers(): Promise<PricingTier[]> {
  if (isTestMode()) {
    return MOCK_PRICING;
  }

  try {
    const { data, error } = await supabase.client
      .from('pricing_tiers')
      .select('*')
      .order('min_volume', { ascending: true });

    if (error || !data) {
      console.error('[Pricing] Error getting all tiers:', error?.message);
      return MOCK_PRICING;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      minVolume: row.min_volume,
      maxVolume: row.max_volume,
      priceUsd: parseFloat(row.price_usd),
      features: row.features || [],
      recommended: row.recommended,
    }));
  } catch (error) {
    console.error('[Pricing] Error:', error);
    return MOCK_PRICING;
  }
}

// ============================================
// Case Study Functions
// ============================================

export async function getCaseStudyByIndustry(industry: string): Promise<CaseStudy | null> {
  if (isTestMode()) {
    console.log(`[CaseStudy Mock] Getting case study for: ${industry}`);
    // No mock case studies - return null to simulate empty database
    return null;
  }

  try {
    // Normalize industry name for matching
    const normalizedIndustry = industry.toLowerCase().trim();

    const { data, error } = await supabase.client
      .from('case_studies')
      .select('*')
      .ilike('industry', `%${normalizedIndustry}%`)
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`[CaseStudy] No case study found for industry: ${industry}`);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      industry: data.industry,
      challenge: data.challenge,
      solution: data.solution,
      results: data.results,
      companyName: data.company_name,
      pdfUrl: data.pdf_url,
    };
  } catch (error) {
    console.error('[CaseStudy] Error:', error);
    return null;
  }
}

export async function getAllCaseStudies(): Promise<CaseStudy[]> {
  if (isTestMode()) {
    return [];
  }

  try {
    const { data, error } = await supabase.client
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[CaseStudy] Error getting all:', error?.message);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      title: row.title,
      industry: row.industry,
      challenge: row.challenge,
      solution: row.solution,
      results: row.results,
      companyName: row.company_name,
      pdfUrl: row.pdf_url,
    }));
  } catch (error) {
    console.error('[CaseStudy] Error:', error);
    return [];
  }
}

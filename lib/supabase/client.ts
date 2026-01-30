import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use provided Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsnpjpdrznbmyikcflvm.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pmHXinzemWKUEDO0aoJ9ag_TWZjjTIZ'

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      nodeEnv: process.env.NODE_ENV,
    })
    throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

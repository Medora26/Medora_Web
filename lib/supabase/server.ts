import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  // Use service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createSupabaseClient(supabaseUrl, supabaseKey)
}
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// NOTE: In a real environment, these would come from process.env
// We check if they exist. If not, we will use a "Mock Mode" flag in our service.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient<Database> | null = null;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseKey && supabaseUrl !== '' && supabaseKey !== '';
};

if (isSupabaseConfigured()) {
  supabase = createClient<Database>(supabaseUrl, supabaseKey);
}

export const getSupabase = () => supabase;

// Helper to explain setup if missing
export const getSetupInstructions = () => `
To enable persistent storage, create a Supabase project and table:
1. Table Name: urls
2. Columns:
   - id: uuid (primary key, default: gen_random_uuid())
   - original_url: text (not null)
   - short_code: text (unique, not null)
   - created_at: timestamptz (default: now())
   - clicks: int4 (default: 0)
   - title: text (nullable)

Then set process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY.
`;

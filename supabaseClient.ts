import { sql } from '@vercel/postgres';

// Check if Postgres is configured
export const isSupabaseConfigured = (): boolean => {
  return !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL;
};

export const getSupabase = () => {
  // Return sql object for direct queries
  return sql;
};

export const getSetupInstructions = () => `
To enable persistent storage, use Vercel Postgres (Neon):

1. Create a Neon database at https://console.neon.tech
2. Get your CONNECTION STRINGS with these parameters:
   - POSTGRES_URL (pooler) - for general queries
   - POSTGRES_URL_NON_POOLING - for migrations
   
3. Run this SQL to create the urls table:

CREATE TABLE urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicks INT DEFAULT 0,
  title TEXT NULL
);

4. Set environment variables:
   - POSTGRES_URL (from Neon)
   - Or DATABASE_URL (alternative)

5. Deploy to Vercel and add the same env vars there.
`;

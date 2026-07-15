import { getSupabase, isSupabaseConfigured } from '../supabaseClient';
import { ShortenedUrl, ServiceResponse } from '../types';

const MOCK_DELAY = 600;

// In-memory storage for when database is not connected
let mockStorage: ShortenedUrl[] = [];

/**
 * Creates a shortened URL. 
 * If Postgres is connected, it saves to DB. 
 * Otherwise, it saves to local memory.
 */
export const createShortUrl = async (originalUrl: string, customAlias?: string): Promise<ServiceResponse<ShortenedUrl>> => {
  // Simple validation
  if (!originalUrl) {
    return { data: null, error: "URL is required" };
  }
  
  // Basic URL validation
  try {
    new URL(originalUrl);
  } catch (e) {
    return { data: null, error: "Invalid URL format. Please include http:// or https://" };
  }

  // Generate short code if not provided
  const shortCode = customAlias?.trim() || Math.random().toString(36).substring(2, 8);

  if (isSupabaseConfigured()) {
    const sqlClient = getSupabase();
    if (!sqlClient) return { data: null, error: "Database client initialization failed" };

    try {
      // Check for collision first if custom alias
      if (customAlias) {
        const result = await sqlClient`
          SELECT id FROM urls WHERE short_code = ${shortCode}
        `;
        
        if (result.rows.length > 0) {
          return { data: null, error: "Alias already taken. Try another one." };
        }
      }

      const result = await sqlClient`
        INSERT INTO urls (original_url, short_code)
        VALUES (${originalUrl}, ${shortCode})
        RETURNING id, original_url, short_code, created_at, clicks, title
      `;

      if (result.rows.length === 0) {
        return { data: null, error: "Failed to create shortened URL" };
      }

      const row = result.rows[0];
      const data: ShortenedUrl = {
        id: row.id as string,
        original_url: row.original_url as string,
        short_code: row.short_code as string,
        created_at: row.created_at as string,
        clicks: row.clicks as number,
        title: row.title as string | null
      };

      return { data, error: null };
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        return { data: null, error: "This alias is already in use." };
      }
      return { data: null, error: err.message || "Unknown error occurred" };
    }
  } else {
    // MOCK MODE
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    if (mockStorage.some(u => u.short_code === shortCode)) {
      return { data: null, error: "Alias already taken (Mock Mode)." };
    }

    const newUrl: ShortenedUrl = {
      id: crypto.randomUUID(),
      original_url: originalUrl,
      short_code: shortCode,
      created_at: new Date().toISOString(),
      clicks: 0,
      title: null
    };

    mockStorage.unshift(newUrl); 
    return { data: newUrl, error: null };
  }
};

/**
 * Retrieves the list of recently created URLs.
 */
export const getRecentUrls = async (): Promise<ServiceResponse<ShortenedUrl[]>> => {
  if (isSupabaseConfigured()) {
    const sqlClient = getSupabase();
    if (!sqlClient) return { data: [], error: "Database client initialization failed" };

    try {
      const result = await sqlClient`
        SELECT id, original_url, short_code, created_at, clicks, title
        FROM urls
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const data: ShortenedUrl[] = result.rows.map(row => ({
        id: row.id as string,
        original_url: row.original_url as string,
        short_code: row.short_code as string,
        created_at: row.created_at as string,
        clicks: row.clicks as number,
        title: row.title as string | null
      }));

      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: err.message || "Failed to fetch URLs" };
    }
  } else {
    // MOCK MODE
    return { data: mockStorage.slice(0, 50), error: null };
  }
};

/**
 * Retrieves a specific URL by its short code.
 */
export const getUrlByCode = async (code: string): Promise<ServiceResponse<ShortenedUrl>> => {
  if (isSupabaseConfigured()) {
    const sqlClient = getSupabase();
    if (!sqlClient) return { data: null, error: "Database client initialization failed" };

    try {
      const result = await sqlClient`
        SELECT id, original_url, short_code, created_at, clicks, title
        FROM urls
        WHERE short_code = ${code}
      `;

      if (result.rows.length === 0) {
        return { data: null, error: "URL not found" };
      }

      const row = result.rows[0];
      const data: ShortenedUrl = {
        id: row.id as string,
        original_url: row.original_url as string,
        short_code: row.short_code as string,
        created_at: row.created_at as string,
        clicks: row.clicks as number,
        title: row.title as string | null
      };

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to fetch URL" };
    }
  } else {
    // MOCK MODE
    const url = mockStorage.find(u => u.short_code === code);
    return url ? { data: url, error: null } : { data: null, error: "URL not found (Mock Mode)" };
  }
};

/**
 * Increments the click count for a URL.
 */
export const incrementClicks = async (id: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const sqlClient = getSupabase();
    if (!sqlClient) return;

    try {
      await sqlClient`
        UPDATE urls
        SET clicks = clicks + 1
        WHERE id = ${id}
      `;
    } catch (err) {
      console.error("Failed to increment clicks:", err);
    }
  } else {
    // MOCK MODE
    const url = mockStorage.find(u => u.id === id);
    if (url) url.clicks++;
  }
};

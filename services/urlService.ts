import { getSupabase, isSupabaseConfigured } from '../supabaseClient';
import { ShortenedUrl, ServiceResponse } from '../types';

const MOCK_DELAY = 600;

// In-memory storage for when Supabase is not connected
let mockStorage: ShortenedUrl[] = [];

/**
 * Creates a shortened URL. 
 * If Supabase is connected, it saves to DB. 
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
  // In a real app, we'd check for collisions in the DB loop
  const shortCode = customAlias?.trim() || Math.random().toString(36).substring(2, 8);

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: "Supabase client initialization failed" };

    try {
      // Check for collision first if custom alias
      if (customAlias) {
        const { data: existing } = await supabase
          .from('urls')
          .select('id')
          .eq('short_code', shortCode)
          .single();
        
        if (existing) {
          return { data: null, error: "Alias already taken. Try another one." };
        }
      }

      const { data, error } = await supabase
        .from('urls')
        .insert([{ 
          original_url: originalUrl, 
          short_code: shortCode 
        }])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation specifically
        if (error.code === '23505') {
          return { data: null, error: "This alias is already in use." };
        }
        return { data: null, error: error.message };
      }
      return { data: data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Unknown error occurred" };
    }
  } else {
    // MOCK MODE
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    // Check mock collision
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

    mockStorage.unshift(newUrl); // Add to beginning
    return { data: newUrl, error: null };
  }
};

/**
 * Retrieves the list of recently created URLs.
 */
export const getRecentUrls = async (): Promise<ServiceResponse<ShortenedUrl[]>> => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) return { data: [], error: "Supabase client initialization failed" };

    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } else {
    // MOCK MODE
    // Return a copy of mock storage
    return { data: [...mockStorage], error: null };
  }
};

/**
 * Retrieves a single URL by its short code (useful for a redirect page).
 */
export const getUrlByCode = async (code: string): Promise<ServiceResponse<ShortenedUrl>> => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: "Supabase client initialization failed" };

    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('short_code', code)
      .single();
    
    if (error) return { data: null, error: error.message };
    return { data: data, error: null };
  } else {
    const found = mockStorage.find(u => u.short_code === code);
    return { data: found || null, error: found ? null : "Not found" };
  }
};

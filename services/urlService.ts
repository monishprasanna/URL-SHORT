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
    return { data: [...mockStorage], error: null };
  }
};

/**
 * Retrieves a single URL by its short code.
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

/**
 * Increments the click count for a specific URL.
 */
export const incrementClicks = async (id: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) return;
    
    // We use a simple RPC or just fetch-and-update if RPC isn't set up.
    // For simplicity without custom SQL functions, we will read then update.
    // Note: In high concurrency, use database function 'increment'.
    const { data } = await supabase.from('urls').select('clicks').eq('id', id).single();
    if (data) {
      await supabase.from('urls').update({ clicks: (data.clicks || 0) + 1 }).eq('id', id);
    }
  } else {
    const found = mockStorage.find(u => u.id === id);
    if (found) found.clicks++;
  }
};
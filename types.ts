export interface ShortenedUrl {
  id: string;
  original_url: string;
  short_code: string;
  created_at: string;
  clicks: number;
  title: string | null;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface AliasSuggestion {
  alias: string;
  reason: string;
}

// For Supabase DB types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      urls: {
        Row: {
          id: string
          original_url: string
          short_code: string
          created_at: string
          clicks: number
          title: string | null
        }
        Insert: {
          id?: string
          original_url: string
          short_code: string
          created_at?: string
          clicks?: number
          title?: string | null
        }
        Update: {
          id?: string
          original_url?: string
          short_code?: string
          created_at?: string
          clicks?: number
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
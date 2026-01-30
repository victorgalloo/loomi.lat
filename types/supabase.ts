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
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          company_name: string | null
          notes: string | null
          files: Json | null
          process_status: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          company_name?: string | null
          notes?: string | null
          files?: Json | null
          process_status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          company_name?: string | null
          notes?: string | null
          files?: Json | null
          process_status?: string | null
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

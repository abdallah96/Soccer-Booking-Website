/**
 * Database types for Supabase
 * This provides type safety for all database operations
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: 'user' | 'admin';
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: 'user' | 'admin';
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fields: {
        Row: {
          id: string;
          name: string;
          description: string;
          location: string;
          price_per_hour: number;
          night_price_per_hour: number | null;
          capacity: number;
          rating: number;
          images: string[];
          facilities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          location: string;
          price_per_hour: number;
          night_price_per_hour?: number | null;
          capacity: number;
          rating?: number;
          images?: string[];
          facilities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          location?: string;
          price_per_hour?: number;
          night_price_per_hour?: number | null;
          capacity?: number;
          rating?: number;
          images?: string[];
          facilities?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          field_id: string;
          date: string;
          time_slot: string;
          start_time: string;
          duration: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          payment_method: 'wave' | 'orange_money' | 'cash';
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          field_id: string;
          date: string;
          time_slot?: string;
          start_time?: string;
          duration?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          payment_method?: 'wave' | 'orange_money' | 'cash';
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          field_id?: string;
          date?: string;
          time_slot?: string;
          start_time?: string;
          duration?: number;
          status?: 'pending' | 'confirmed' | 'cancelled';
          payment_method?: 'wave' | 'orange_money' | 'cash';
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_slots: {
        Row: {
          id: string;
          field_id: string;
          date: string;
          start_time: string;
          end_time: string;
          full_day: boolean;
          reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          date: string;
          start_time: string;
          end_time: string;
          full_day?: boolean;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          full_day?: boolean;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          field_id: string;
          user_id: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          user_id: string;
          rating: number;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      week_availability: {
        Row: {
          id: string;
          field_id: string;
          week_start_date: string;
          is_open: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          week_start_date: string;
          is_open?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          week_start_date?: string;
          is_open?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          method: string;
          status: 'pending' | 'completed' | 'failed';
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          method: string;
          status?: 'pending' | 'completed' | 'failed';
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          method?: string;
          status?: 'pending' | 'completed' | 'failed';
          amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

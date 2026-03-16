export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      goals: {
        Row: {
          created_at: string
          current: number
          id: string
          name: string
          period: string
          target: number
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current?: number
          id?: string
          name: string
          period?: string
          target: number
          unit?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current?: number
          id?: string
          name?: string
          period?: string
          target?: number
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_budgets: {
        Row: {
          budget: number
          created_at: string
          id: string
          month: string
          user_id: string
        }
        Insert: {
          budget: number
          created_at?: string
          id?: string
          month: string
          user_id: string
        }
        Update: {
          budget?: number
          created_at?: string
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_limits: {
        Row: {
          category: string | null
          created_at: string
          id: string
          limit_amount: number
          period: string
          updated_at: string
          user_id: string
          warn_at_percent: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          limit_amount: number
          period: string
          updated_at?: string
          user_id: string
          warn_at_percent?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          limit_amount?: number
          period?: string
          updated_at?: string
          user_id?: string
          warn_at_percent?: number
        }
        Relationships: []
      }
      finance_savings_goals: {
        Row: {
          created_at: string
          current: number
          id: string
          name: string
          target: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current?: number
          id?: string
          name: string
          target: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current?: number
          id?: string
          name?: string
          target?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          date?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          id: string
          mood: number | null
          tags: string[] | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood?: number | null
          tags?: string[] | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: number | null
          tags?: string[] | null
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          date: string
          emoji: string
          id: string
          label: string
          note: string | null
          triggers: string[] | null
          user_id: string
        }
        Insert: {
          date?: string
          emoji: string
          id?: string
          label: string
          note?: string | null
          triggers?: string[] | null
          user_id: string
        }
        Update: {
          date?: string
          emoji?: string
          id?: string
          label?: string
          note?: string | null
          triggers?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          profile_photo_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_photo_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_photo_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_done: boolean
          remind_at: string
          repeat: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean
          remind_at: string
          repeat?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean
          remind_at?: string
          repeat?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          bedtime: string
          created_at: string
          date: string
          hours_slept: number
          id: string
          quality: number
          user_id: string
          wake_time: string
        }
        Insert: {
          bedtime: string
          created_at?: string
          date: string
          hours_slept: number
          id?: string
          quality: number
          user_id: string
          wake_time: string
        }
        Update: {
          bedtime?: string
          created_at?: string
          date?: string
          hours_slept?: number
          id?: string
          quality?: number
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          column_status: string
          created_at: string
          due_date: string | null
          id: string
          priority: string
          subtasks: Json
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_status?: string
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string
          subtasks?: Json
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          column_status?: string
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string
          subtasks?: Json
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          date: string
          glasses: number
          goal: number
          id: string
          user_id: string
        }
        Insert: {
          date?: string
          glasses?: number
          goal?: number
          id?: string
          user_id: string
        }
        Update: {
          date?: string
          glasses?: number
          goal?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      health_daily_metrics: {
        Row: {
          active_minutes: number | null
          created_at: string
          date: string
          hrv_ms: number | null
          id: string
          resting_hr: number | null
          sleep_minutes: number | null
          source: string
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          created_at?: string
          date: string
          hrv_ms?: number | null
          id?: string
          resting_hr?: number | null
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          created_at?: string
          date?: string
          hrv_ms?: number | null
          id?: string
          resting_hr?: number | null
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_templates: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          tags: string[]
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          tags?: string[]
          text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          tags?: string[]
          text?: string
          updated_at?: string
          user_id?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

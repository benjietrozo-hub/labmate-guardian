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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      borrow_items: {
        Row: {
          borrow_date: string
          borrower_name: string
          created_at: string | null
          created_by: string | null
          id: string
          item: string
          quantity: number
          return_date: string | null
          status: string | null
        }
        Insert: {
          borrow_date: string
          borrower_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          item: string
          quantity?: number
          return_date?: string | null
          status?: string | null
        }
        Update: {
          borrow_date?: string
          borrower_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          item?: string
          quantity?: number
          return_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          accredited_to: string | null
          article: string
          balance_per_card_qty: number | null
          created_at: string | null
          created_by: string | null
          date_acquired: string | null
          description: string | null
          id: string
          new_property_number: string | null
          on_hand_per_card_qty: number | null
          po_number: string | null
          property_number: string | null
          remarks: string | null
          serial_number: string | null
          total_value: number | null
          unit_of_measure: string | null
          unit_value: number | null
        }
        Insert: {
          accredited_to?: string | null
          article: string
          balance_per_card_qty?: number | null
          created_at?: string | null
          created_by?: string | null
          date_acquired?: string | null
          description?: string | null
          id?: string
          new_property_number?: string | null
          on_hand_per_card_qty?: number | null
          po_number?: string | null
          property_number?: string | null
          remarks?: string | null
          serial_number?: string | null
          total_value?: number | null
          unit_of_measure?: string | null
          unit_value?: number | null
        }
        Update: {
          accredited_to?: string | null
          article?: string
          balance_per_card_qty?: number | null
          created_at?: string | null
          created_by?: string | null
          date_acquired?: string | null
          description?: string | null
          id?: string
          new_property_number?: string | null
          on_hand_per_card_qty?: number | null
          po_number?: string | null
          property_number?: string | null
          remarks?: string | null
          serial_number?: string | null
          total_value?: number | null
          unit_of_measure?: string | null
          unit_value?: number | null
        }
        Relationships: []
      }
      inventory_equipment: {
        Row: {
          category: string
          condition: string | null
          created_at: string | null
          created_by: string | null
          date: string
          date_returned: string | null
          id: string
          item_description: string
          name: string
          purpose: string | null
          quantity: number
          serial_number: string | null
          signature: string | null
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          date_returned?: string | null
          id?: string
          item_description: string
          name: string
          purpose?: string | null
          quantity?: number
          serial_number?: string | null
          signature?: string | null
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          date_returned?: string | null
          id?: string
          item_description?: string
          name?: string
          purpose?: string | null
          quantity?: number
          serial_number?: string | null
          signature?: string | null
        }
        Relationships: []
      }
      lost_found: {
        Row: {
          cell_number: string | null
          created_at: string | null
          created_by: string | null
          date: string
          date_claimed: string | null
          finders_name: string
          id: string
          item_description: string
          owner_name: string | null
          signature: string | null
          time: string
        }
        Insert: {
          cell_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          date_claimed?: string | null
          finders_name: string
          id?: string
          item_description: string
          owner_name?: string | null
          signature?: string | null
          time: string
        }
        Update: {
          cell_number?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          date_claimed?: string | null
          finders_name?: string
          id?: string
          item_description?: string
          owner_name?: string | null
          signature?: string | null
          time?: string
        }
        Relationships: []
      }
      repair_maintenance: {
        Row: {
          action_taken: string | null
          created_at: string | null
          created_by: string | null
          date: string
          equipment_name: string
          id: string
          issue_description: string
          serial_number: string | null
          status: string | null
          technician_name: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          equipment_name: string
          id?: string
          issue_description: string
          serial_number?: string | null
          status?: string | null
          technician_name?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          equipment_name?: string
          id?: string
          issue_description?: string
          serial_number?: string | null
          status?: string | null
          technician_name?: string | null
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          name: string
          purpose: string
          signature: string | null
          time_in: string
          time_out: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          name: string
          purpose: string
          signature?: string | null
          time_in: string
          time_out?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          name?: string
          purpose?: string
          signature?: string | null
          time_in?: string
          time_out?: string | null
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

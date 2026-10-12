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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          org_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          org_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cascade_attachments: {
        Row: {
          cascade_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          org_id: string
        }
        Insert: {
          cascade_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          org_id: string
        }
        Update: {
          cascade_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cascade_attachments_cascade_id_fkey"
            columns: ["cascade_id"]
            isOneToOne: false
            referencedRelation: "cascades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cascade_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cascade_recipients: {
        Row: {
          acknowledged_at: string | null
          cascade_id: string
          delivered_at: string
          id: string
          last_nudged_at: string | null
          member_id: string
          org_id: string
          overdue_sent_at: string | null
          reminder_sent_at: string | null
          share_method: string | null
          shared_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          cascade_id: string
          delivered_at?: string
          id?: string
          last_nudged_at?: string | null
          member_id: string
          org_id: string
          overdue_sent_at?: string | null
          reminder_sent_at?: string | null
          share_method?: string | null
          shared_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          cascade_id?: string
          delivered_at?: string
          id?: string
          last_nudged_at?: string | null
          member_id?: string
          org_id?: string
          overdue_sent_at?: string | null
          reminder_sent_at?: string | null
          share_method?: string | null
          shared_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cascade_recipients_cascade_id_fkey"
            columns: ["cascade_id"]
            isOneToOne: false
            referencedRelation: "cascades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cascade_recipients_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cascade_recipients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cascade_responses: {
        Row: {
          cascade_id: string
          created_at: string
          feedback: string
          id: string
          member_id: string
          org_id: string
          questions: string | null
        }
        Insert: {
          cascade_id: string
          created_at?: string
          feedback: string
          id?: string
          member_id: string
          org_id: string
          questions?: string | null
        }
        Update: {
          cascade_id?: string
          created_at?: string
          feedback?: string
          id?: string
          member_id?: string
          org_id?: string
          questions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cascade_responses_cascade_id_fkey"
            columns: ["cascade_id"]
            isOneToOne: false
            referencedRelation: "cascades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cascade_responses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cascade_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cascades: {
        Row: {
          ai_generated_at: string | null
          ai_summary: Json | null
          audience_departments: string[] | null
          created_at: string
          created_by: string | null
          deadline: string | null
          id: string
          message: string
          org_id: string
          sent_at: string | null
          status: string
          talking_points: Json
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated_at?: string | null
          ai_summary?: Json | null
          audience_departments?: string[] | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          message: string
          org_id: string
          sent_at?: string | null
          status?: string
          talking_points?: Json
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated_at?: string | null
          ai_summary?: Json | null
          audience_departments?: string[] | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          message?: string
          org_id?: string
          sent_at?: string | null
          status?: string
          talking_points?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cascades_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          cascade_id: string | null
          created_at: string
          id: string
          kind: string
          org_id: string | null
          status: string
          to_email: string
        }
        Insert: {
          cascade_id?: string | null
          created_at?: string
          id?: string
          kind: string
          org_id?: string | null
          status?: string
          to_email: string
        }
        Update: {
          cascade_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          org_id?: string | null
          status?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_cascade_id_fkey"
            columns: ["cascade_id"]
            isOneToOne: false
            referencedRelation: "cascades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string | null
          id: string
          manager_email: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name?: string | null
          id?: string
          manager_email?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          manager_email?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          reminder_days_before: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          reminder_days_before?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          reminder_days_before?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_my_invites: { Args: never; Returns: number }
      create_organization: {
        Args: { _full_name: string; _name: string }
        Returns: string
      }
      is_org_admin: { Args: { _org: string; _uid: string }; Returns: boolean }
      is_org_member: { Args: { _org: string; _uid: string }; Returns: boolean }
      my_member_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      org_role: "owner" | "admin" | "manager" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      org_role: ["owner", "admin", "manager", "member"],
    },
  },
} as const

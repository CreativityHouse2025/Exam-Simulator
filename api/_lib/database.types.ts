export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allowed_config: {
        Row: {
          config_id: number
          created_at: string
          track_id: string
        }
        Insert: {
          config_id: number
          created_at?: string
          track_id: string
        }
        Update: {
          config_id?: number
          created_at?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allowed_config_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "exam_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_config_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          is_bookmarked: boolean
          question_id: number
          selected_choices: number[]
        }
        Insert: {
          attempt_id: string
          is_bookmarked?: boolean
          question_id: number
          selected_choices?: number[]
        }
        Update: {
          attempt_id?: string
          is_bookmarked?: boolean
          question_id?: number
          selected_choices?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      breaks: {
        Row: {
          config_id: number
          created_at: string
          duration_minutes: number
          id: number
          show_at_index: number
          updated_at: string
        }
        Insert: {
          config_id: number
          created_at?: string
          duration_minutes: number
          id?: number
          show_at_index: number
          updated_at?: string
        }
        Update: {
          config_id?: number
          created_at?: string
          duration_minutes?: number
          id?: number
          show_at_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breaks_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "exam_config"
            referencedColumns: ["id"]
          },
        ]
      }
      choices: {
        Row: {
          is_correct: boolean
          position: number
          question_id: number
          text_ar: string
          text_en: string
        }
        Insert: {
          is_correct: boolean
          position: number
          question_id: number
          text_ar: string
          text_en: string
        }
        Update: {
          is_correct?: boolean
          position?: number
          question_id?: number
          text_ar?: string
          text_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          config_snapshot: Json
          created_at: string
          current_index: number
          exam_id: number
          exam_state: string
          id: string
          question_ids_snapshot: number[]
          score: number
          status: string | null
          time_remaining: number
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          config_snapshot: Json
          created_at?: string
          current_index?: number
          exam_id: number
          exam_state?: string
          id?: string
          question_ids_snapshot: number[]
          score?: number
          status?: string | null
          time_remaining?: number
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          config_snapshot?: Json
          created_at?: string
          current_index?: number
          exam_id?: number
          exam_state?: string
          id?: string
          question_ids_snapshot?: number[]
          score?: number
          status?: string | null
          time_remaining?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_config: {
        Row: {
          allow_retry_wrong: boolean
          can_reveal_answers: boolean
          created_at: string
          exam_duration_minutes: number | null
          id: number
          name_ar: string
          name_en: string
          passing_rate: number
          updated_at: string
        }
        Insert: {
          allow_retry_wrong?: boolean
          can_reveal_answers?: boolean
          created_at?: string
          exam_duration_minutes?: number | null
          id?: number
          name_ar: string
          name_en: string
          passing_rate: number
          updated_at?: string
        }
        Update: {
          allow_retry_wrong?: boolean
          can_reveal_answers?: boolean
          created_at?: string
          exam_duration_minutes?: number | null
          id?: number
          name_ar?: string
          name_en?: string
          passing_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          exam_id: number
          question_id: number
          question_index: number
        }
        Insert: {
          exam_id: number
          question_id: number
          question_index: number
        }
        Update: {
          exam_id?: number
          question_id?: number
          question_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_type: {
        Row: {
          colour: string | null
          created_at: string
          id: number
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: number
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: number
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          config_id: number
          created_at: string
          description_ar: string
          description_en: string
          display_order: number
          id: number
          name_ar: string
          name_en: string
          question_count: number
          track_id: string
          type_id: number
          updated_at: string
        }
        Insert: {
          config_id: number
          created_at?: string
          description_ar: string
          description_en: string
          display_order?: number
          id?: number
          name_ar: string
          name_en: string
          question_count: number
          track_id: string
          type_id: number
          updated_at?: string
        }
        Update: {
          config_id?: number
          created_at?: string
          description_ar?: string
          description_en?: string
          display_order?: number
          id?: number
          name_ar?: string
          name_en?: string
          question_count?: number
          track_id?: string
          type_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_allowed_config_fkey"
            columns: ["track_id", "config_id"]
            isOneToOne: false
            referencedRelation: "allowed_config"
            referencedColumns: ["track_id", "config_id"]
          },
          {
            foreignKeyName: "exams_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "exam_type"
            referencedColumns: ["id"]
          },
        ]
      }
      offered_breaks: {
        Row: {
          attempt_id: string
          offered_at: string
          show_at_index: number
        }
        Insert: {
          attempt_id: string
          offered_at: string
          show_at_index: number
        }
        Update: {
          attempt_id?: string
          offered_at?: string
          show_at_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "offered_breaks_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          explanation_ar: string
          explanation_en: string
          id: number
          text_ar: string
          text_en: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation_ar: string
          explanation_en: string
          id?: number
          text_ar: string
          text_en: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation_ar?: string
          explanation_en?: string
          id?: number
          text_ar?: string
          text_en?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          enrollment_duration_days: number
          id: string
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          enrollment_duration_days: number
          id?: string
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          enrollment_duration_days?: number
          id?: string
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          first_name: string
          highlevel_id: string | null
          id: string
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          highlevel_id?: string | null
          id: string
          last_name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          highlevel_id?: string | null
          id?: string
          last_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_answer_diff: {
        Args: { p_answers: Json; p_attempt_id: string }
        Returns: string
      }
      attempt_correct_question_ids: {
        Args: { p_attempt_id: string }
        Returns: number[]
      }
      revision_question_ids: {
        Args: { p_attempt_id: string; p_user_id: string }
        Returns: {
          exam_id: number
          question_ids: number[]
          result: string
        }[]
      }
      save_attempt: {
        Args: {
          p_answers: Json
          p_attempt_id: string
          p_current_index: number
          p_offered_breaks?: Json
          p_time_remaining: number
          p_user_id: string
        }
        Returns: string
      }
      search_students: {
        Args: { p_limit: number; p_query: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      start_attempt: {
        Args: { p_exam_id: number; p_user_id: string }
        Returns: {
          config_snapshot: Json
          created_at: string
          current_index: number
          exam_id: number
          exam_state: string
          id: string
          question_ids_snapshot: number[]
          result: string
          score: number
          status: string
          time_remaining: number
        }[]
      }
      submit_attempt: {
        Args: {
          p_answers: Json
          p_attempt_id: string
          p_current_index: number
          p_time_remaining: number
          p_user_id: string
        }
        Returns: {
          result: string
          score: number
          status: string
          total_questions: number
          wrong_questions: number
        }[]
      }
    }
    Enums: {
      user_role: "student" | "supervisor"
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
    Enums: {
      user_role: ["student", "supervisor"],
    },
  },
} as const


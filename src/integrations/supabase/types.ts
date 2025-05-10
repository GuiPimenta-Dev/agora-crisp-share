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
      bookings: {
        Row: {
          coach_id: string
          created_at: string
          date: string
          id: string
          meeting_url: string | null
          notes: string | null
          recording_url: string | null
          status: string
          student_id: string
          time: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          date: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          status: string
          student_id: string
          time: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          date?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          status?: string
          student_id?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_availabilities: {
        Row: {
          available_times: string[]
          coach_id: string
          created_at: string
          date: string
          id: string
          updated_at: string
        }
        Insert: {
          available_times: string[]
          coach_id: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
        }
        Update: {
          available_times?: string[]
          coach_id?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availabilities_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          champions: string[]
          created_at: string
          description: string
          id: string
          lane: string
          languages: string[]
          rank: string
          updated_at: string
        }
        Insert: {
          champions?: string[]
          created_at?: string
          description?: string
          id: string
          lane: string
          languages?: string[]
          rank: string
          updated_at?: string
        }
        Update: {
          champions?: string[]
          created_at?: string
          description?: string
          id?: string
          lane?: string
          languages?: string[]
          rank?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      duo_partners: {
        Row: {
          availability: string
          champions: string[]
          created_at: string
          discord: string | null
          id: string
          is_visible: boolean | null
          languages: string[]
          name: string
          notes: string | null
          play_style: string
          playtime: string
          rank: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability: string
          champions: string[]
          created_at?: string
          discord?: string | null
          id?: string
          is_visible?: boolean | null
          languages: string[]
          name: string
          notes?: string | null
          play_style: string
          playtime: string
          rank: string
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string
          champions?: string[]
          created_at?: string
          discord?: string | null
          id?: string
          is_visible?: boolean | null
          languages?: string[]
          name?: string
          notes?: string | null
          play_style?: string
          playtime?: string
          rank?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duo_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          audio_enabled: boolean
          audio_muted: boolean | null
          avatar: string
          created_at: string
          id: string
          meeting_id: string
          name: string
          role: string
          screen_sharing: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_enabled?: boolean
          audio_muted?: boolean | null
          avatar: string
          created_at?: string
          id?: string
          meeting_id: string
          name: string
          role: string
          screen_sharing?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_enabled?: boolean
          audio_muted?: boolean | null
          avatar?: string
          created_at?: string
          id?: string
          meeting_id?: string
          name?: string
          role?: string
          screen_sharing?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_highlights: {
        Row: {
          adc: string
          adc_win_rate: number
          created_at: string
          highest_pdl_player: string
          id: string
          jungle_win_rate: number
          jungler: string
          mid_laner: string
          mid_win_rate: number
          month: number
          pdl_gained: number
          support: string
          support_win_rate: number
          top_laner: string
          top_win_rate: number
          updated_at: string
          year: number
        }
        Insert: {
          adc: string
          adc_win_rate: number
          created_at?: string
          highest_pdl_player: string
          id?: string
          jungle_win_rate: number
          jungler: string
          mid_laner: string
          mid_win_rate: number
          month: number
          pdl_gained: number
          support: string
          support_win_rate: number
          top_laner: string
          top_win_rate: number
          updated_at?: string
          year: number
        }
        Update: {
          adc?: string
          adc_win_rate?: number
          created_at?: string
          highest_pdl_player?: string
          id?: string
          jungle_win_rate?: number
          jungler?: string
          mid_laner?: string
          mid_win_rate?: number
          month?: number
          pdl_gained?: number
          support?: string
          support_win_rate?: number
          top_laner?: string
          top_win_rate?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          summoner: string | null
          tag: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          summoner?: string | null
          tag?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          summoner?: string | null
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_history: {
        Row: {
          created_at: string
          flex_division: string | null
          flex_losses: number | null
          flex_lp: number | null
          flex_tier: string | null
          flex_wins: number | null
          grade: number | null
          id: string
          level: number | null
          login_date: string
          profile_icon_url: string | null
          solo_division: string | null
          solo_losses: number | null
          solo_lp: number | null
          solo_tier: string | null
          solo_wins: number | null
          summoner_name: string
          tag: string
          tier_icon_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          flex_division?: string | null
          flex_losses?: number | null
          flex_lp?: number | null
          flex_tier?: string | null
          flex_wins?: number | null
          grade?: number | null
          id?: string
          level?: number | null
          login_date?: string
          profile_icon_url?: string | null
          solo_division?: string | null
          solo_losses?: number | null
          solo_lp?: number | null
          solo_tier?: string | null
          solo_wins?: number | null
          summoner_name: string
          tag: string
          tier_icon_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          flex_division?: string | null
          flex_losses?: number | null
          flex_lp?: number | null
          flex_tier?: string | null
          flex_wins?: number | null
          grade?: number | null
          id?: string
          level?: number | null
          login_date?: string
          profile_icon_url?: string | null
          solo_division?: string | null
          solo_losses?: number | null
          solo_lp?: number | null
          solo_tier?: string | null
          solo_wins?: number | null
          summoner_name?: string
          tag?: string
          tier_icon_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

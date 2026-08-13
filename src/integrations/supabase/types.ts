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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      profile_brands: {
        Row: {
          brand_name: string
          id: string
          profile_id: string
        }
        Insert: {
          brand_name: string
          id?: string
          profile_id: string
        }
        Update: {
          brand_name?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_brands_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_formats: {
        Row: {
          format: string
          id: string
          profile_id: string
        }
        Insert: {
          format: string
          id?: string
          profile_id: string
        }
        Update: {
          format?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_formats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_metrics: {
        Row: {
          audience_pct: number | null
          followers: string | null
          handle: string | null
          id: string
          network: Database["public"]["Enums"]["social_network"]
          profile_id: string
          social_account_id: string | null
          source: Database["public"]["Enums"]["metric_source"]
          verified_at: string | null
        }
        Insert: {
          audience_pct?: number | null
          followers?: string | null
          handle?: string | null
          id?: string
          network: Database["public"]["Enums"]["social_network"]
          profile_id: string
          social_account_id?: string | null
          source?: Database["public"]["Enums"]["metric_source"]
          verified_at?: string | null
        }
        Update: {
          audience_pct?: number | null
          followers?: string | null
          handle?: string | null
          id?: string
          network?: Database["public"]["Enums"]["social_network"]
          profile_id?: string
          social_account_id?: string | null
          source?: Database["public"]["Enums"]["metric_source"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_works: {
        Row: {
          description: string | null
          id: string
          image_url: string | null
          profile_id: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          image_url?: string | null
          profile_id: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string | null
          profile_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_works_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string
          email: string | null
          full_name: string | null
          id: string
          main_network: Database["public"]["Enums"]["social_network"] | null
          niche: string | null
          slug: string
          status: Database["public"]["Enums"]["profile_status"]
          submitted_at: string | null
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          full_name?: string | null
          id?: string
          main_network?: Database["public"]["Enums"]["social_network"] | null
          niche?: string | null
          slug: string
          status?: Database["public"]["Enums"]["profile_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          full_name?: string | null
          id?: string
          main_network?: Database["public"]["Enums"]["social_network"] | null
          niche?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["profile_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          connected_at: string
          created_at: string
          declared_followers: string | null
          display_name: string | null
          handle: string | null
          id: string
          is_declared: boolean
          last_synced_at: string | null
          network: Database["public"]["Enums"]["social_network"]
          profile_id: string
          profile_url: string | null
          provider: string
          provider_account_id: string | null
          provider_user_id: string | null
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          declared_followers?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string
          is_declared?: boolean
          last_synced_at?: string | null
          network: Database["public"]["Enums"]["social_network"]
          profile_id: string
          profile_url?: string | null
          provider?: string
          provider_account_id?: string | null
          provider_user_id?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          declared_followers?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string
          is_declared?: boolean
          last_synced_at?: string | null
          network?: Database["public"]["Enums"]["social_network"]
          profile_id?: string
          profile_url?: string | null
          provider?: string
          provider_account_id?: string | null
          provider_user_id?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_snapshots: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          avg_views: number | null
          captured_at: string
          created_at: string
          engagement_rate: number | null
          followers: number | null
          following: number | null
          id: string
          posts_count: number | null
          raw: Json | null
          reach: number | null
          social_account_id: string
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          captured_at?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          posts_count?: number | null
          raw?: Json | null
          reach?: number | null
          social_account_id: string
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          captured_at?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          posts_count?: number | null
          raw?: Json | null
          reach?: number | null
          social_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_snapshots_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      metric_source: "manual" | "api"
      profile_status: "draft" | "pending" | "approved" | "rejected"
      social_network:
        | "instagram"
        | "tiktok"
        | "youtube"
        | "facebook"
        | "twitter"
        | "kwai"
        | "linkedin"
      sync_status: "never" | "ok" | "error" | "pending"
      tier: "creator" | "featured" | "reference" | "icon"
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
      app_role: ["admin"],
      metric_source: ["manual", "api"],
      profile_status: ["draft", "pending", "approved", "rejected"],
      social_network: [
        "instagram",
        "tiktok",
        "youtube",
        "facebook",
        "twitter",
        "kwai",
        "linkedin",
      ],
      sync_status: ["never", "ok", "error", "pending"],
      tier: ["creator", "featured", "reference", "icon"],
    },
  },
} as const

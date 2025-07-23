export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      curated_wardrobe_items: {
        Row: {
          affiliate_url: string | null;
          brand: string | null;
          category: string;
          color: string[];
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          occasion: string[];
          popularity_score: number | null;
          price_range: string | null;
          season: string[];
          style: string;
          subcategory: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          affiliate_url?: string | null;
          brand?: string | null;
          category: string;
          color?: string[];
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          occasion?: string[];
          popularity_score?: number | null;
          price_range?: string | null;
          season?: string[];
          style: string;
          subcategory?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          affiliate_url?: string | null;
          brand?: string | null;
          category?: string;
          color?: string[];
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          occasion?: string[];
          popularity_score?: number | null;
          price_range?: string | null;
          season?: string[];
          style?: string;
          subcategory?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      occasion_outfits: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string | null;
          occasion: string;
          optional_items: Json | null;
          outfit_description: string | null;
          outfit_name: string;
          popularity_score: number | null;
          required_items: Json;
          season: string[];
          style_personality: string;
          styling_tips: string[] | null;
          total_price_range: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          occasion: string;
          optional_items?: Json | null;
          outfit_description?: string | null;
          outfit_name: string;
          popularity_score?: number | null;
          required_items: Json;
          season?: string[];
          style_personality: string;
          styling_tips?: string[] | null;
          total_price_range?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          occasion?: string;
          optional_items?: Json | null;
          outfit_description?: string | null;
          outfit_name?: string;
          popularity_score?: number | null;
          required_items?: Json;
          season?: string[];
          style_personality?: string;
          styling_tips?: string[] | null;
          total_price_range?: string | null;
        };
        Relationships: [];
      };
      outfit_feedback: {
        Row: {
          created_at: string | null;
          feedback: string;
          feedback_score: number | null;
          id: string;
          notes: string | null;
          occasion: string | null;
          outfit_item_ids: string[];
          user_id: string;
          weather: string | null;
        };
        Insert: {
          created_at?: string | null;
          feedback: string;
          feedback_score?: number | null;
          id?: string;
          notes?: string | null;
          occasion?: string | null;
          outfit_item_ids: string[];
          user_id: string;
          weather?: string | null;
        };
        Update: {
          created_at?: string | null;
          feedback?: string;
          feedback_score?: number | null;
          id?: string;
          notes?: string | null;
          occasion?: string | null;
          outfit_item_ids?: string[];
          user_id?: string;
          weather?: string | null;
        };
        Relationships: [];
      };
      planned_outfits: {
        Row: {
          created_at: string | null;
          id: string;
          item_ids: string[];
          notes: string | null;
          occasion: string | null;
          outfit_date: string;
          updated_at: string | null;
          user_id: string;
          weather: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          item_ids: string[];
          notes?: string | null;
          occasion?: string | null;
          outfit_date: string;
          updated_at?: string | null;
          user_id: string;
          weather?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          item_ids?: string[];
          notes?: string | null;
          occasion?: string | null;
          outfit_date?: string;
          updated_at?: string | null;
          user_id?: string;
          weather?: string | null;
        };
        Relationships: [];
      };
      price_alerts: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          product_id: string;
          target_price: number;
          triggered_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id: string;
          target_price: number;
          triggered_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id?: string;
          target_price?: number;
          triggered_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "shopping_products";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          access_count: number | null;
          created_at: string | null;
          culture: string | null;
          data_encrypted: boolean | null;
          display_name: string | null;
          face_photo_url: string | null;
          favorite_colors: string[] | null;
          color_palette_colors: string[] | null;
          gender_identity: string | null;
          goals: string[] | null;
          id: string;
          last_accessed: string | null;
          location: string | null;
          preferred_style: string | null;
          selected_palette_id: string | null;
          color_season_analysis: Json | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_count?: number | null;
          created_at?: string | null;
          culture?: string | null;
          data_encrypted?: boolean | null;
          display_name?: string | null;
          face_photo_url?: string | null;
          favorite_colors?: string[] | null;
          color_palette_colors?: string[] | null;
          gender_identity?: string | null;
          goals?: string[] | null;
          id?: string;
          last_accessed?: string | null;
          location?: string | null;
          preferred_style?: string | null;
          selected_palette_id?: string | null;
          color_season_analysis?: Json | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_count?: number | null;
          created_at?: string | null;
          culture?: string | null;
          data_encrypted?: boolean | null;
          display_name?: string | null;
          face_photo_url?: string | null;
          favorite_colors?: string[] | null;
          color_palette_colors?: string[] | null;
          gender_identity?: string | null;
          goals?: string[] | null;
          id?: string;
          last_accessed?: string | null;
          location?: string | null;
          preferred_style?: string | null;
          selected_palette_id?: string | null;
          color_season_analysis?: Json | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      saved_outfits: {
        Row: {
          created_at: string | null;
          id: string;
          items: Json;
          name: string;
          occasion: string | null;
          style: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          items?: Json;
          name: string;
          occasion?: string | null;
          style?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          items?: Json;
          name?: string;
          occasion?: string | null;
          style?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      shopping_products: {
        Row: {
          affiliate_url: string;
          availability_countries: string[] | null;
          brand: string | null;
          category: string;
          colors: string[] | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          external_id: string;
          id: string;
          image_url: string | null;
          is_in_stock: boolean | null;
          last_updated: string | null;
          name: string;
          original_price: number | null;
          price: number | null;
          rating: number | null;
          reviews_count: number | null;
          sizes: string[] | null;
          source_platform: string;
          subcategory: string | null;
          sustainability_score: number | null;
        };
        Insert: {
          affiliate_url: string;
          availability_countries?: string[] | null;
          brand?: string | null;
          category: string;
          colors?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          external_id: string;
          id?: string;
          image_url?: string | null;
          is_in_stock?: boolean | null;
          last_updated?: string | null;
          name: string;
          original_price?: number | null;
          price?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          sizes?: string[] | null;
          source_platform: string;
          subcategory?: string | null;
          sustainability_score?: number | null;
        };
        Update: {
          affiliate_url?: string;
          availability_countries?: string[] | null;
          brand?: string | null;
          category?: string;
          colors?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          external_id?: string;
          id?: string;
          image_url?: string | null;
          is_in_stock?: boolean | null;
          last_updated?: string | null;
          name?: string;
          original_price?: number | null;
          price?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          sizes?: string[] | null;
          source_platform?: string;
          subcategory?: string | null;
          sustainability_score?: number | null;
        };
        Relationships: [];
      };
      shopping_suggestions: {
        Row: {
          affiliate_url: string | null;
          brand: string | null;
          category: string;
          colors: string[] | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          image_url: string | null;
          in_stock: boolean | null;
          name: string;
          original_price: number | null;
          price: number | null;
          rating: number | null;
          recommended_for: string[] | null;
          reviews_count: number | null;
          sizes: string[] | null;
          source: string | null;
          style_match_score: number | null;
          subcategory: string | null;
          updated_at: string | null;
          user_id: string;
          wardrobe_gap_fill: string[] | null;
        };
        Insert: {
          affiliate_url?: string | null;
          brand?: string | null;
          category: string;
          colors?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean | null;
          name: string;
          original_price?: number | null;
          price?: number | null;
          rating?: number | null;
          recommended_for?: string[] | null;
          reviews_count?: number | null;
          sizes?: string[] | null;
          source?: string | null;
          style_match_score?: number | null;
          subcategory?: string | null;
          updated_at?: string | null;
          user_id: string;
          wardrobe_gap_fill?: string[] | null;
        };
        Update: {
          affiliate_url?: string | null;
          brand?: string | null;
          category?: string;
          colors?: string[] | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean | null;
          name?: string;
          original_price?: number | null;
          price?: number | null;
          rating?: number | null;
          recommended_for?: string[] | null;
          reviews_count?: number | null;
          sizes?: string[] | null;
          source?: string | null;
          style_match_score?: number | null;
          subcategory?: string | null;
          updated_at?: string | null;
          user_id?: string;
          wardrobe_gap_fill?: string[] | null;
        };
        Relationships: [];
      };
      user_deletion_log: {
        Row: {
          cleanup_completed: boolean | null;
          deleted_at: string;
          deleted_user_id: string;
          id: string;
        };
        Insert: {
          cleanup_completed?: boolean | null;
          deleted_at?: string;
          deleted_user_id: string;
          id?: string;
        };
        Update: {
          cleanup_completed?: boolean | null;
          deleted_at?: string;
          deleted_user_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          created_at: string | null;
          id: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          item_id: string;
          item_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          item_id?: string;
          item_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_shopping_preferences: {
        Row: {
          budget_max: number | null;
          budget_min: number | null;
          country_code: string;
          created_at: string | null;
          currency_preference: string | null;
          id: string;
          notification_preferences: Json | null;
          preferred_brands: string[] | null;
          size_preferences: Json | null;
          sustainability_preference: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          budget_max?: number | null;
          budget_min?: number | null;
          country_code?: string;
          created_at?: string | null;
          currency_preference?: string | null;
          id?: string;
          notification_preferences?: Json | null;
          preferred_brands?: string[] | null;
          size_preferences?: Json | null;
          sustainability_preference?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          budget_max?: number | null;
          budget_min?: number | null;
          country_code?: string;
          created_at?: string | null;
          currency_preference?: string | null;
          id?: string;
          notification_preferences?: Json | null;
          preferred_brands?: string[] | null;
          size_preferences?: Json | null;
          sustainability_preference?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_onboarding: {
        Row: {
          completed_at: string | null;
          completed_flows: string[] | null;
          created_at: string;
          current_step: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_flows?: string[] | null;
          created_at?: string;
          current_step?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completed_flows?: string[] | null;
          created_at?: string;
          current_step?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_style_quiz: {
        Row: {
          body_type: string | null;
          budget_range: string | null;
          color_preferences: string[];
          confidence_score: number | null;
          created_at: string | null;
          id: string;
          lifestyle: string | null;
          occasion_frequency: Json | null;
          preferred_fit: string | null;
          quiz_answers: Json | null;
          quiz_version: number | null;
          style_goals: string[] | null;
          style_personality: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          body_type?: string | null;
          budget_range?: string | null;
          color_preferences?: string[];
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          lifestyle?: string | null;
          occasion_frequency?: Json | null;
          preferred_fit?: string | null;
          quiz_answers?: Json | null;
          quiz_version?: number | null;
          style_goals?: string[] | null;
          style_personality: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          body_type?: string | null;
          budget_range?: string | null;
          color_preferences?: string[];
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          lifestyle?: string | null;
          occasion_frequency?: Json | null;
          preferred_fit?: string | null;
          quiz_answers?: Json | null;
          quiz_version?: number | null;
          style_goals?: string[] | null;
          style_personality?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      wardrobe_items: {
        Row: {
          category: string;
          color: string[] | null;
          created_at: string | null;
          id: string;
          name: string;
          occasion: string[] | null;
          photo_url: string;
          season: string[] | null;
          style: string;
          tags: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          category: string;
          color?: string[] | null;
          created_at?: string | null;
          id?: string;
          name: string;
          occasion?: string[] | null;
          photo_url: string;
          season?: string[] | null;
          style: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          category?: string;
          color?: string[] | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          occasion?: string[] | null;
          photo_url?: string;
          season?: string[] | null;
          style?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      log_profile_access: {
        Args: { profile_user_id: string };
        Returns: undefined;
      };
      log_profile_access_safe: {
        Args: { profile_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

/**
 * Hungeri database types.
 *
 * Hand-authored to match supabase/migrations. Once your Supabase project is
 * linked, regenerate the canonical version with:
 *
 *   npm run db:types
 *
 * which runs `supabase gen types typescript` and overwrites this file. Keeping it
 * checked in means the app stays typed even before the DB is provisioned.
 */

export type UserRole = "consumer" | "merchant" | "admin";
export type BusinessStatus = "draft" | "live" | "suspended";
export type DealType =
  | "percentage"
  | "fixed_amount"
  | "bogo"
  | "set_menu"
  | "freebie"
  | "happy_hour"
  | "loyalty";
export type DealChannel = "dine_in" | "takeaway" | "delivery";
export type RedemptionMethod = "code" | "show_screen" | "auto" | "link";
export type DealStatus = "draft" | "pending_review" | "live" | "expired" | "rejected";
export type DealSource = "merchant" | "curated" | "partner_api" | "scraped";
export type PlacementTier = "featured" | "boosted" | "spotlight";
export type PlacementStatus = "active" | "scheduled" | "ended";
export type SubscriptionPlan = "free" | "pro" | "premium";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "trialing";
export type ReportStatus = "open" | "resolved";
export type ViewSource = "feed" | "map" | "featured" | "search";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/** Helper to derive Insert/Update shapes from a Row with sensible optionality. */
type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: UserRole;
          email: string;
          display_name: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          role?: UserRole;
          email: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      consumer_profiles: {
        Row: {
          user_id: string;
          home_lat: number | null;
          home_lng: number | null;
          home_geog: unknown | null;
          preferred_cuisines: string[];
          notification_prefs: Json;
        } & Timestamps;
        Insert: {
          user_id: string;
          home_lat?: number | null;
          home_lng?: number | null;
          preferred_cuisines?: string[];
          notification_prefs?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["consumer_profiles"]["Insert"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_url: string | null;
          cuisine_tags: string[];
          price_level: number | null;
          website: string | null;
          socials: Json;
          verified: boolean;
          status: BusinessStatus;
          qr_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          slug: string;
          qr_token?: string;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          cuisine_tags?: string[];
          price_level?: number | null;
          website?: string | null;
          socials?: Json;
          verified?: boolean;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          lat: number;
          lng: number;
          geog: unknown;
          phone: string | null;
          opening_hours: Json | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          lat: number;
          lng: number;
          phone?: string | null;
          opening_hours?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          business_id: string;
          title: string;
          description: string | null;
          deal_type: DealType;
          discount_value: number | null;
          terms: string | null;
          fine_print: string | null;
          image_url: string | null;
          channels: DealChannel[];
          dietary_tags: string[];
          start_at: string;
          end_at: string;
          recurring_rule: Json | null;
          redemption_method: RedemptionMethod;
          redemption_code: string | null;
          redemption_url: string | null;
          status: DealStatus;
          source: DealSource;
          source_attribution: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          title: string;
          description?: string | null;
          deal_type: DealType;
          discount_value?: number | null;
          terms?: string | null;
          fine_print?: string | null;
          image_url?: string | null;
          channels?: DealChannel[];
          dietary_tags?: string[];
          start_at: string;
          end_at: string;
          recurring_rule?: Json | null;
          redemption_method?: RedemptionMethod;
          redemption_code?: string | null;
          redemption_url?: string | null;
          status?: DealStatus;
          source?: DealSource;
          source_attribution?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
        Relationships: [];
      };
      featured_placements: {
        Row: {
          id: string;
          deal_id: string;
          tier: PlacementTier;
          geo_scope: Json | null;
          start_at: string;
          end_at: string;
          price_cents: number;
          stripe_payment_id: string | null;
          status: PlacementStatus;
        } & Timestamps;
        Insert: {
          id?: string;
          deal_id: string;
          tier: PlacementTier;
          geo_scope?: Json | null;
          start_at: string;
          end_at: string;
          price_cents: number;
          stripe_payment_id?: string | null;
          status?: PlacementStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["featured_placements"]["Insert"]>;
        Relationships: [];
      };
      saves: {
        Row: { id: string; consumer_id: string; deal_id: string } & Timestamps;
        Insert: { id?: string; consumer_id: string; deal_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["saves"]["Insert"]>;
        Relationships: [];
      };
      redemptions: {
        Row: {
          id: string;
          deal_id: string;
          consumer_id: string | null;
          method: RedemptionMethod;
          location_id: string | null;
          redeemed_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          consumer_id?: string | null;
          method: RedemptionMethod;
          location_id?: string | null;
          redeemed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["redemptions"]["Insert"]>;
        Relationships: [];
      };
      deal_views: {
        Row: {
          id: string;
          deal_id: string;
          consumer_id: string | null;
          source: ViewSource;
        } & Timestamps;
        Insert: {
          id?: string;
          deal_id: string;
          consumer_id?: string | null;
          source?: ViewSource;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deal_views"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          stripe_subscription_id: string | null;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          deal_id: string;
          reporter_id: string | null;
          reason: string;
          status: ReportStatus;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          deal_id: string;
          reporter_id?: string | null;
          reason: string;
          status?: ReportStatus;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      expire_deals: { Args: Record<string, never>; Returns: number };
      deals_near: {
        Args: { in_lat: number; in_lng: number; in_radius_m?: number };
        Returns: { deal_id: string; location_id: string; distance_m: number }[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      owns_business: { Args: { biz_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      business_status: BusinessStatus;
      deal_type: DealType;
      deal_channel: DealChannel;
      redemption_method: RedemptionMethod;
      deal_status: DealStatus;
      deal_source: DealSource;
      placement_tier: PlacementTier;
      placement_status: PlacementStatus;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      report_status: ReportStatus;
      view_source: ViewSource;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row aliases. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type DealRow = Tables<"deals">;
export type BusinessRow = Tables<"businesses">;
export type LocationRow = Tables<"locations">;

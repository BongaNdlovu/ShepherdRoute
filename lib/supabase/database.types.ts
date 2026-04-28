export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};
type GenericView =
  | {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: GenericRelationship[];
    }
  | {
      Row: Record<string, unknown>;
      Relationships: GenericRelationship[];
    };
type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

export type Database = {
  public: {
    Tables: {
      [key: string]: GenericTable;
      app_admins: {
        Row: { user_id: string; created_at: Timestamp; updated_at: Timestamp };
        Insert: { user_id: string; created_at?: Timestamp; updated_at?: Timestamp };
        Update: { user_id?: string; created_at?: Timestamp; updated_at?: Timestamp };
        Relationships: [];
      };
      churches: {
        Row: { id: string; name: string; timezone: string; created_at: Timestamp; updated_at: Timestamp };
        Insert: { id?: string; name: string; timezone?: string; created_at?: Timestamp; updated_at?: Timestamp };
        Update: { id?: string; name?: string; timezone?: string; created_at?: Timestamp; updated_at?: Timestamp };
        Relationships: [];
      };
      church_memberships: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["team_role"];
          status: Database["public"]["Enums"]["membership_status"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["team_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: string;
          church_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["team_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          church_id: string;
          event_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          area: string | null;
          language: string | null;
          best_time_to_contact: string | null;
          status: Database["public"]["Enums"]["follow_up_status"];
          urgency: Database["public"]["Enums"]["urgency_level"];
          assigned_to: string | null;
          consent_given: boolean;
          consent_at: Timestamp | null;
          source: string;
          classification_payload: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          event_id?: string | null;
          full_name: string;
          phone: string;
          email?: string | null;
          area?: string | null;
          language?: string | null;
          best_time_to_contact?: string | null;
          status?: Database["public"]["Enums"]["follow_up_status"];
          urgency?: Database["public"]["Enums"]["urgency_level"];
          assigned_to?: string | null;
          consent_given?: boolean;
          consent_at?: Timestamp | null;
          source?: string;
          classification_payload?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      contact_interests: {
        Row: {
          id: string;
          church_id: string;
          contact_id: string;
          interest: Database["public"]["Enums"]["interest_tag"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          contact_id: string;
          interest: Database["public"]["Enums"]["interest_tag"];
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["contact_interests"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          event_type: Database["public"]["Enums"]["event_type"];
          starts_on: string | null;
          location: string | null;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          name: string;
          event_type?: Database["public"]["Enums"]["event_type"];
          starts_on?: string | null;
          location?: string | null;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          church_id: string;
          contact_id: string;
          assigned_to: string | null;
          author_id: string | null;
          channel: Database["public"]["Enums"]["follow_up_channel"];
          status: Database["public"]["Enums"]["follow_up_status"];
          notes: string | null;
          next_action: string | null;
          due_at: Timestamp | null;
          completed_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          contact_id: string;
          assigned_to?: string | null;
          author_id?: string | null;
          channel?: Database["public"]["Enums"]["follow_up_channel"];
          status?: Database["public"]["Enums"]["follow_up_status"];
          notes?: string | null;
          next_action?: string | null;
          due_at?: Timestamp | null;
          completed_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Insert"]>;
        Relationships: [];
      };
      generated_messages: {
        Row: {
          id: string;
          church_id: string;
          contact_id: string;
          generated_by: string | null;
          channel: Database["public"]["Enums"]["message_channel"];
          message_text: string;
          wa_link: string | null;
          prompt_version: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          contact_id: string;
          generated_by?: string | null;
          channel?: Database["public"]["Enums"]["message_channel"];
          message_text: string;
          wa_link?: string | null;
          prompt_version?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["generated_messages"]["Insert"]>;
        Relationships: [];
      };
      prayer_requests: {
        Row: {
          id: string;
          church_id: string;
          contact_id: string;
          request_text: string;
          visibility: Database["public"]["Enums"]["prayer_visibility"];
          created_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          contact_id: string;
          request_text: string;
          visibility?: Database["public"]["Enums"]["prayer_visibility"];
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["prayer_requests"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          avatar_url: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          church_id: string;
          membership_id: string | null;
          display_name: string;
          role: Database["public"]["Enums"]["team_role"];
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          membership_id?: string | null;
          display_name: string;
          role?: Database["public"]["Enums"]["team_role"];
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: GenericView;
      public_events: {
        Row: {
          id: string;
          name: string;
          event_type: Database["public"]["Enums"]["event_type"];
          starts_on: string | null;
          location: string | null;
          slug: string;
          church_name: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      [key: string]: GenericFunction;
      owner_church_summaries: {
        Args: never;
        Returns: Array<{
          church_id: string;
          church_name: string;
          created_at: Timestamp;
          team_count: number;
          event_count: number;
          contact_count: number;
          new_contact_count: number;
        }>;
      };
      search_contacts: {
        Args: {
          p_church_id: string;
          p_q?: string | null;
          p_status?: Database["public"]["Enums"]["follow_up_status"] | null;
          p_event_id?: string | null;
          p_interest?: Database["public"]["Enums"]["interest_tag"] | null;
          p_assigned_to?: string | null;
          p_unassigned?: boolean;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          id: string;
          full_name: string;
          phone: string;
          area: string | null;
          language: string | null;
          best_time_to_contact: string | null;
          status: Database["public"]["Enums"]["follow_up_status"];
          urgency: Database["public"]["Enums"]["urgency_level"];
          assigned_to: string | null;
          created_at: Timestamp;
          event_id: string | null;
          event_name: string | null;
          assigned_name: string | null;
          interests: Database["public"]["Enums"]["interest_tag"][];
          total_count: number;
        }>;
      };
      submit_event_registration: {
        Args: {
          p_slug: string;
          p_full_name: string;
          p_phone: string;
          p_area: string | null;
          p_language: string | null;
          p_best_time_to_contact: string | null;
          p_interests: Database["public"]["Enums"]["interest_tag"][];
          p_message: string | null;
          p_consent_given: boolean;
        };
        Returns: string;
      };
    };
    Enums: {
      event_type:
        | "church_service"
        | "health_expo"
        | "prophecy_seminar"
        | "bible_study"
        | "visitor_sabbath"
        | "youth_event"
        | "cooking_class"
        | "community_outreach"
        | "other";
      follow_up_channel: "call" | "whatsapp" | "sms" | "email" | "visit" | "note";
      follow_up_status:
        | "new"
        | "assigned"
        | "contacted"
        | "waiting"
        | "interested"
        | "bible_study_started"
        | "attended_church"
        | "baptism_interest"
        | "closed";
      interest_tag: "prayer" | "bible_study" | "health" | "baptism" | "pastoral_visit" | "youth" | "cooking_class";
      membership_status: "active" | "invited" | "disabled";
      message_channel: "whatsapp" | "sms" | "email";
      prayer_visibility: "pastoral_prayer" | "pastors_only";
      team_role: "admin" | "pastor" | "elder" | "bible_worker" | "health_leader" | "prayer_team" | "youth_leader" | "viewer";
      urgency_level: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

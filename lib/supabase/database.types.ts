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
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["app_admin_role"];
          is_protected_owner: boolean;
          created_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          user_id: string;
          role?: Database["public"]["Enums"]["app_admin_role"];
          is_protected_owner?: boolean;
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["app_admin_role"];
          is_protected_owner?: boolean;
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          church_id: string | null;
          actor_user_id: string | null;
          target_type: string;
          target_id: string | null;
          action: string;
          metadata: Json;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id?: string | null;
          actor_user_id?: string | null;
          target_type: string;
          target_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: Timestamp;
        };
        Update: {
          id?: string;
          church_id?: string | null;
          actor_user_id?: string | null;
          target_type?: string;
          target_id?: string | null;
          action?: string;
          metadata?: Json;
          created_at?: Timestamp;
        };
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
          person_id: string | null;
          event_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          whatsapp_number: string | null;
          normalized_name: string | null;
          normalized_phone: string | null;
          normalized_whatsapp: string | null;
          normalized_email: string | null;
          normalized_area: string | null;
          area: string | null;
          language: string | null;
          best_time_to_contact: string | null;
          status: Database["public"]["Enums"]["follow_up_status"];
          urgency: Database["public"]["Enums"]["urgency_level"];
          assigned_to: string | null;
          consent_given: boolean;
          consent_at: Timestamp | null;
          consent_source: string | null;
          consent_scope: string[];
          do_not_contact: boolean;
          do_not_contact_at: Timestamp | null;
          archived_at: Timestamp | null;
          deleted_at: Timestamp | null;
          duplicate_of_contact_id: string | null;
          duplicate_match_confidence: number | null;
          duplicate_match_reason: string | null;
          source: string;
          classification_payload: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id?: string | null;
          event_id?: string | null;
          full_name: string;
          phone: string;
          email?: string | null;
          whatsapp_number?: string | null;
          normalized_name?: string | null;
          normalized_phone?: string | null;
          normalized_whatsapp?: string | null;
          normalized_email?: string | null;
          normalized_area?: string | null;
          area?: string | null;
          language?: string | null;
          best_time_to_contact?: string | null;
          status?: Database["public"]["Enums"]["follow_up_status"];
          urgency?: Database["public"]["Enums"]["urgency_level"];
          assigned_to?: string | null;
          consent_given?: boolean;
          consent_at?: Timestamp | null;
          consent_source?: string | null;
          consent_scope?: string[];
          do_not_contact?: boolean;
          do_not_contact_at?: Timestamp | null;
          archived_at?: Timestamp | null;
          deleted_at?: Timestamp | null;
          duplicate_of_contact_id?: string | null;
          duplicate_match_confidence?: number | null;
          duplicate_match_reason?: string | null;
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
      contact_journey_events: {
        Row: {
          id: string;
          church_id: string;
          person_id: string;
          contact_id: string | null;
          event_id: string | null;
          event_type: Database["public"]["Enums"]["event_type"] | null;
          title: string;
          summary: string | null;
          selected_interests: Database["public"]["Enums"]["interest_tag"][];
          classification_payload: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          person_id: string;
          contact_id?: string | null;
          event_id?: string | null;
          event_type?: Database["public"]["Enums"]["event_type"] | null;
          title: string;
          summary?: string | null;
          selected_interests?: Database["public"]["Enums"]["interest_tag"][];
          classification_payload?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["contact_journey_events"]["Insert"]>;
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
      people: {
        Row: {
          id: string;
          church_id: string;
          full_name: string;
          normalized_name: string | null;
          phone: string | null;
          normalized_phone: string | null;
          whatsapp_number: string | null;
          normalized_whatsapp: string | null;
          email: string | null;
          normalized_email: string | null;
          area: string | null;
          normalized_area: string | null;
          do_not_contact: boolean;
          do_not_contact_at: Timestamp | null;
          archived_at: Timestamp | null;
          deleted_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          full_name: string;
          normalized_name?: string | null;
          phone?: string | null;
          normalized_phone?: string | null;
          whatsapp_number?: string | null;
          normalized_whatsapp?: string | null;
          email?: string | null;
          normalized_email?: string | null;
          area?: string | null;
          normalized_area?: string | null;
          do_not_contact?: boolean;
          do_not_contact_at?: Timestamp | null;
          archived_at?: Timestamp | null;
          deleted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
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
          purpose: string;
          approved_at: Timestamp | null;
          opened_at: Timestamp | null;
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
          purpose?: string;
          approved_at?: Timestamp | null;
          opened_at?: Timestamp | null;
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
      team_invitations: {
        Row: {
          id: string;
          church_id: string;
          team_member_id: string | null;
          email: string;
          normalized_email: string;
          display_name: string;
          role: Database["public"]["Enums"]["team_role"];
          token_hash: string;
          status: Database["public"]["Enums"]["team_invitation_status"];
          invited_by: string | null;
          accepted_by: string | null;
          expires_at: Timestamp;
          accepted_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          church_id: string;
          team_member_id?: string | null;
          email: string;
          normalized_email: string;
          display_name: string;
          role?: Database["public"]["Enums"]["team_role"];
          token_hash: string;
          status?: Database["public"]["Enums"]["team_invitation_status"];
          invited_by?: string | null;
          accepted_by?: string | null;
          expires_at?: Timestamp;
          accepted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["team_invitations"]["Insert"]>;
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
      accept_team_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
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
      owner_account_rows: {
        Args: never;
        Returns: Array<{
          church_id: string;
          church_name: string;
          church_created_at: Timestamp;
          membership_id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["team_role"];
          status: Database["public"]["Enums"]["membership_status"];
          membership_created_at: Timestamp;
          team_member_id: string | null;
          team_member_name: string | null;
          team_member_active: boolean;
          app_admin_role: Database["public"]["Enums"]["app_admin_role"] | null;
          is_protected_owner: boolean;
          event_count: number;
          contact_count: number;
        }>;
      };
      owner_update_membership_status: {
        Args: {
          p_membership_id: string;
          p_status: Database["public"]["Enums"]["membership_status"];
        };
        Returns: void;
      };
      owner_update_membership_role: {
        Args: {
          p_membership_id: string;
          p_role: Database["public"]["Enums"]["team_role"];
        };
        Returns: void;
      };
      owner_invitation_rows: {
        Args: never;
        Returns: Array<{
          church_id: string;
          church_name: string;
          invitation_id: string;
          team_member_id: string | null;
          display_name: string;
          email: string;
          role: Database["public"]["Enums"]["team_role"];
          status: Database["public"]["Enums"]["team_invitation_status"];
          invited_by_name: string | null;
          accepted_by_name: string | null;
          expires_at: Timestamp;
          accepted_at: Timestamp | null;
          created_at: Timestamp;
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
          person_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          area: string | null;
          language: string | null;
          best_time_to_contact: string | null;
          status: Database["public"]["Enums"]["follow_up_status"];
          urgency: Database["public"]["Enums"]["urgency_level"];
          assigned_to: string | null;
          do_not_contact: boolean;
          duplicate_of_contact_id: string | null;
          duplicate_match_confidence: number | null;
          duplicate_match_reason: string | null;
          created_at: Timestamp;
          event_id: string | null;
          event_name: string | null;
          assigned_name: string | null;
          interests: Database["public"]["Enums"]["interest_tag"][];
          total_count: number;
        }>;
      };
      search_follow_ups: {
        Args: {
          p_church_id: string;
          p_q?: string | null;
          p_status?: Database["public"]["Enums"]["follow_up_status"] | null;
          p_assigned_to?: string | null;
          p_unassigned?: boolean;
          p_due_state?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Array<{
          id: string;
          contact_id: string;
          assigned_to: string | null;
          status: Database["public"]["Enums"]["follow_up_status"];
          channel: Database["public"]["Enums"]["follow_up_channel"];
          next_action: string | null;
          notes: string | null;
          due_at: Timestamp | null;
          completed_at: Timestamp | null;
          created_at: Timestamp;
          contact_full_name: string;
          contact_phone: string;
          contact_email: string | null;
          contact_area: string | null;
          contact_status: Database["public"]["Enums"]["follow_up_status"];
          contact_urgency: Database["public"]["Enums"]["urgency_level"];
          contact_do_not_contact: boolean;
          event_id: string | null;
          event_name: string | null;
          assigned_name: string | null;
          interests: Database["public"]["Enums"]["interest_tag"][];
          suggested_message_id: string | null;
          suggested_message_text: string | null;
          suggested_wa_link: string | null;
          suggested_opened_at: Timestamp | null;
          total_count: number;
        }>;
      };
      team_invitation_preview: {
        Args: { p_token: string };
        Returns: Array<{
          church_name: string;
          display_name: string;
          email: string;
          role: Database["public"]["Enums"]["team_role"];
          status: Database["public"]["Enums"]["team_invitation_status"];
          expires_at: Timestamp;
        }>;
      };
      submit_event_registration: {
        Args: {
          p_slug: string;
          p_full_name: string;
          p_phone: string;
          p_email: string | null;
          p_area: string | null;
          p_language: string | null;
          p_best_time_to_contact: string | null;
          p_interests: Database["public"]["Enums"]["interest_tag"][];
          p_message: string | null;
          p_urgency: Database["public"]["Enums"]["urgency_level"];
          p_classification_payload: Json;
          p_prayer_visibility: Database["public"]["Enums"]["prayer_visibility"];
          p_consent_scope: string[];
          p_consent_source: string;
          p_consent_given: boolean;
        };
        Returns: string;
      };
      outreach_report_summary: {
        Args: { p_church_id: string };
        Returns: Array<{
          total_contacts: number;
          followed_up_count: number;
          bible_study_count: number;
          prayer_count: number;
          health_count: number;
          baptism_count: number;
          high_priority_count: number;
          unassigned_count: number;
          due_today_count: number;
          overdue_count: number;
          waiting_reply_count: number;
          no_consent_count: number;
          do_not_contact_count: number;
          events: Json;
        }>;
      };
      event_report_summary: {
        Args: {
          p_church_id: string;
          p_event_id: string;
        };
        Returns: Array<{
          total_contacts: number;
          followed_up_count: number;
          bible_study_count: number;
          prayer_count: number;
          baptism_count: number;
          high_priority_count: number;
          follow_up_count: number;
          status_counts: Json;
          interest_counts: Json;
        }>;
      };
    };
    Enums: {
      app_admin_role: "owner" | "support_admin" | "billing_admin";
      event_type:
        | "sabbath_visitor"
        | "church_service"
        | "health_expo"
        | "evangelistic_campaign"
        | "prophecy_seminar"
        | "bible_study"
        | "visitor_sabbath"
        | "youth_event"
        | "cooking_class"
        | "prayer_campaign"
        | "regular_member"
        | "baptized_member"
        | "health_seminar"
        | "custom"
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
      prayer_visibility:
        | "pastoral_prayer"
        | "pastors_only"
        | "general_prayer"
        | "pastor_only"
        | "private_contact"
        | "family_support"
        | "sensitive"
        | "health_related";
      team_role: "admin" | "pastor" | "elder" | "bible_worker" | "health_leader" | "prayer_team" | "youth_leader" | "viewer";
      team_invitation_status: "pending" | "accepted" | "revoked" | "expired";
      urgency_level: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

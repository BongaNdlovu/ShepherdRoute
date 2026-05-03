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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_admins: {
        Row: {
          created_at: string
          created_by: string | null
          is_protected_owner: boolean
          role: Database["public"]["Enums"]["app_admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_protected_owner?: boolean
          role?: Database["public"]["Enums"]["app_admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_protected_owner?: boolean
          role?: Database["public"]["Enums"]["app_admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          church_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          church_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          church_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      church_memberships: {
        Row: {
          church_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_memberships_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          created_at: string
          id: string
          name: string
          onboarding_dismissed_at: string | null
          status_change_reason: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          timezone: string
          updated_at: string
          workspace_status: string
          workspace_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          onboarding_dismissed_at?: string | null
          status_change_reason?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          timezone?: string
          updated_at?: string
          workspace_status?: string
          workspace_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          onboarding_dismissed_at?: string | null
          status_change_reason?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          timezone?: string
          updated_at?: string
          workspace_status?: string
          workspace_type?: string
        }
        Relationships: []
      }
      contact_interests: {
        Row: {
          church_id: string
          contact_id: string
          created_at: string
          id: string
          interest: Database["public"]["Enums"]["interest_tag"]
          updated_at: string
        }
        Insert: {
          church_id: string
          contact_id: string
          created_at?: string
          id?: string
          interest: Database["public"]["Enums"]["interest_tag"]
          updated_at?: string
        }
        Update: {
          church_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          interest?: Database["public"]["Enums"]["interest_tag"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_interests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_journey_events: {
        Row: {
          church_id: string
          classification_payload: Json
          contact_id: string | null
          created_at: string
          event_id: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          person_id: string
          selected_interests: Database["public"]["Enums"]["interest_tag"][]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          church_id: string
          classification_payload?: Json
          contact_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          person_id: string
          selected_interests?: Database["public"]["Enums"]["interest_tag"][]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          classification_payload?: Json
          contact_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          person_id?: string
          selected_interests?: Database["public"]["Enums"]["interest_tag"][]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_journey_events_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_journey_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_journey_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_journey_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_journey_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          area: string | null
          assigned_handling_role: string | null
          assigned_to: string | null
          best_time_to_contact: string | null
          church_id: string
          classification_payload: Json
          consent_at: string | null
          consent_given: boolean
          consent_scope: string[]
          consent_source: string | null
          created_at: string
          deleted_at: string | null
          do_not_contact: boolean
          do_not_contact_at: string | null
          duplicate_match_confidence: number | null
          duplicate_match_reason: string | null
          duplicate_of_contact_id: string | null
          email: string | null
          event_id: string | null
          full_name: string
          id: string
          language: string | null
          normalized_area: string | null
          normalized_email: string | null
          normalized_name: string | null
          normalized_phone: string | null
          normalized_whatsapp: string | null
          person_id: string | null
          phone: string
          preferred_contact_methods: string[]
          recommended_assigned_role: string | null
          source: string
          status: Database["public"]["Enums"]["follow_up_status"]
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          whatsapp_number: string | null
        }
        Insert: {
          archived_at?: string | null
          area?: string | null
          assigned_handling_role?: string | null
          assigned_to?: string | null
          best_time_to_contact?: string | null
          church_id: string
          classification_payload?: Json
          consent_at?: string | null
          consent_given?: boolean
          consent_scope?: string[]
          consent_source?: string | null
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean
          do_not_contact_at?: string | null
          duplicate_match_confidence?: number | null
          duplicate_match_reason?: string | null
          duplicate_of_contact_id?: string | null
          email?: string | null
          event_id?: string | null
          full_name: string
          id?: string
          language?: string | null
          normalized_area?: string | null
          normalized_email?: string | null
          normalized_name?: string | null
          normalized_phone?: string | null
          normalized_whatsapp?: string | null
          person_id?: string | null
          phone: string
          preferred_contact_methods?: string[]
          recommended_assigned_role?: string | null
          source?: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          whatsapp_number?: string | null
        }
        Update: {
          archived_at?: string | null
          area?: string | null
          assigned_handling_role?: string | null
          assigned_to?: string | null
          best_time_to_contact?: string | null
          church_id?: string
          classification_payload?: Json
          consent_at?: string | null
          consent_given?: boolean
          consent_scope?: string[]
          consent_source?: string | null
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean
          do_not_contact_at?: string | null
          duplicate_match_confidence?: number | null
          duplicate_match_reason?: string | null
          duplicate_of_contact_id?: string | null
          email?: string | null
          event_id?: string | null
          full_name?: string
          id?: string
          language?: string | null
          normalized_area?: string | null
          normalized_email?: string | null
          normalized_name?: string | null
          normalized_phone?: string | null
          normalized_whatsapp?: string | null
          person_id?: string | null
          phone?: string
          preferred_contact_methods?: string[]
          recommended_assigned_role?: string | null
          source?: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_duplicate_of_contact_id_fkey"
            columns: ["duplicate_of_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          archived_at: string | null
          branding_config: Json
          church_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          form_config: Json
          id: string
          is_active: boolean
          location: string | null
          name: string
          public_info: Json
          slug: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          branding_config?: Json
          church_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          form_config?: Json
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          public_info?: Json
          slug: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          branding_config?: Json
          church_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          form_config?: Json
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          public_info?: Json
          slug?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_handling_role: string | null
          assigned_to: string | null
          author_id: string | null
          channel: Database["public"]["Enums"]["follow_up_channel"]
          church_id: string
          completed_at: string | null
          contact_id: string
          created_at: string
          due_at: string | null
          id: string
          next_action: string | null
          notes: string | null
          status: Database["public"]["Enums"]["follow_up_status"]
          updated_at: string
        }
        Insert: {
          assigned_handling_role?: string | null
          assigned_to?: string | null
          author_id?: string | null
          channel?: Database["public"]["Enums"]["follow_up_channel"]
          church_id: string
          completed_at?: string | null
          contact_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
        }
        Update: {
          assigned_handling_role?: string | null
          assigned_to?: string | null
          author_id?: string | null
          channel?: Database["public"]["Enums"]["follow_up_channel"]
          church_id?: string
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          next_action?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_messages: {
        Row: {
          approved_at: string | null
          channel: Database["public"]["Enums"]["message_channel"]
          church_id: string
          contact_id: string
          created_at: string
          generated_by: string | null
          id: string
          message_text: string
          opened_at: string | null
          prompt_version: string
          purpose: string
          updated_at: string
          wa_link: string | null
        }
        Insert: {
          approved_at?: string | null
          channel?: Database["public"]["Enums"]["message_channel"]
          church_id: string
          contact_id: string
          created_at?: string
          generated_by?: string | null
          id?: string
          message_text: string
          opened_at?: string | null
          prompt_version?: string
          purpose?: string
          updated_at?: string
          wa_link?: string | null
        }
        Update: {
          approved_at?: string | null
          channel?: Database["public"]["Enums"]["message_channel"]
          church_id?: string
          contact_id?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          message_text?: string
          opened_at?: string | null
          prompt_version?: string
          purpose?: string
          updated_at?: string
          wa_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_messages_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_messages_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          archived_at: string | null
          area: string | null
          church_id: string
          created_at: string
          deleted_at: string | null
          do_not_contact: boolean
          do_not_contact_at: string | null
          email: string | null
          full_name: string
          id: string
          normalized_area: string | null
          normalized_email: string | null
          normalized_name: string | null
          normalized_phone: string | null
          normalized_whatsapp: string | null
          phone: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          archived_at?: string | null
          area?: string | null
          church_id: string
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean
          do_not_contact_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          normalized_area?: string | null
          normalized_email?: string | null
          normalized_name?: string | null
          normalized_phone?: string | null
          normalized_whatsapp?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          archived_at?: string | null
          area?: string | null
          church_id?: string
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean
          do_not_contact_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          normalized_area?: string | null
          normalized_email?: string | null
          normalized_name?: string | null
          normalized_phone?: string | null
          normalized_whatsapp?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          church_id: string
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          request_text: string
          updated_at: string
          visibility: Database["public"]["Enums"]["prayer_visibility"]
        }
        Insert: {
          church_id: string
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          request_text: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["prayer_visibility"]
        }
        Update: {
          church_id?: string
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          request_text?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["prayer_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          church_id: string
          created_at: string
          display_name: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          normalized_email: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["team_invitation_status"]
          team_member_id: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          church_id: string
          created_at?: string
          display_name: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          normalized_email: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["team_invitation_status"]
          team_member_id?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          church_id?: string
          created_at?: string
          display_name?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          normalized_email?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["team_invitation_status"]
          team_member_id?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          app_role: string | null
          church_id: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_active: boolean
          membership_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
        }
        Insert: {
          app_role?: string | null
          church_id: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean
          membership_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Update: {
          app_role?: string | null
          church_id?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean
          membership_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "church_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_events: {
        Row: {
          branding_config: Json | null
          church_name: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          form_config: Json | null
          id: string | null
          location: string | null
          name: string | null
          public_info: Json | null
          slug: string | null
          starts_on: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invitation: { Args: { p_token: string }; Returns: string }
      dismiss_onboarding_guide: {
        Args: { p_church_id: string }
        Returns: undefined
      }
      event_report_summary: {
        Args: { p_church_id: string; p_event_id: string }
        Returns: {
          baptism_count: number
          bible_study_count: number
          follow_up_count: number
          followed_up_count: number
          high_priority_count: number
          interest_counts: Json
          prayer_count: number
          status_counts: Json
          total_contacts: number
        }[]
      }
      export_contacts: {
        Args: {
          p_assigned_to?: string
          p_church_id: string
          p_event_id?: string
          p_interest?: Database["public"]["Enums"]["interest_tag"]
          p_q?: string
          p_status?: Database["public"]["Enums"]["follow_up_status"]
          p_unassigned?: boolean
        }
        Returns: {
          area: string
          assigned_handling_role: string
          assigned_name: string
          assigned_to: string
          best_time_to_contact: string
          created_at: string
          do_not_contact: boolean
          duplicate_match_confidence: number
          duplicate_match_reason: string
          duplicate_of_contact_id: string
          email: string
          event_id: string
          event_name: string
          full_name: string
          id: string
          interests: Database["public"]["Enums"]["interest_tag"][]
          language: string
          person_id: string
          phone: string
          recommended_assigned_role: string
          status: Database["public"]["Enums"]["follow_up_status"]
          total_count: number
          urgency: Database["public"]["Enums"]["urgency_level"]
        }[]
      }
      outreach_report_summary: {
        Args: { p_church_id: string }
        Returns: {
          baptism_count: number
          bible_study_count: number
          do_not_contact_count: number
          due_today_count: number
          events: Json
          followed_up_count: number
          health_count: number
          high_priority_count: number
          no_consent_count: number
          overdue_count: number
          prayer_count: number
          total_contacts: number
          unassigned_count: number
          waiting_reply_count: number
        }[]
      }
      owner_account_rows: {
        Args: never
        Returns: {
          app_admin_role: Database["public"]["Enums"]["app_admin_role"]
          church_created_at: string
          church_id: string
          church_name: string
          contact_count: number
          email: string
          event_count: number
          full_name: string
          is_protected_owner: boolean
          membership_created_at: string
          membership_id: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["membership_status"]
          team_member_active: boolean
          team_member_id: string
          team_member_name: string
          user_id: string
        }[]
      }
      owner_church_events_page: {
        Args: {
          p_church_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          archived_at: string
          contact_count: number
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          location: string
          name: string
          slug: string
          starts_on: string
          total_count: number
        }[]
      }
      owner_church_profiles_page: {
        Args: {
          p_church_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          app_admin_role: string
          email: string
          full_name: string
          is_protected_owner: boolean
          membership_created_at: string
          membership_id: string
          phone: string
          role: string
          status: string
          total_count: number
          user_id: string
        }[]
      }
      owner_church_summaries: {
        Args: never
        Returns: {
          church_id: string
          church_name: string
          contact_count: number
          created_at: string
          event_count: number
          new_contact_count: number
          team_count: number
        }[]
      }
      owner_invitation_rows: {
        Args: never
        Returns: {
          accepted_at: string
          accepted_by_name: string
          church_id: string
          church_name: string
          created_at: string
          display_name: string
          email: string
          expires_at: string
          invitation_id: string
          invited_by_name: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["team_invitation_status"]
          team_member_id: string
        }[]
      }
      owner_update_membership_role: {
        Args: {
          p_membership_id: string
          p_role: Database["public"]["Enums"]["team_role"]
        }
        Returns: undefined
      }
      owner_update_membership_status: {
        Args: {
          p_membership_id: string
          p_status: Database["public"]["Enums"]["membership_status"]
        }
        Returns: undefined
      }
      reset_church_contact_data: {
        Args: { p_church_id: string }
        Returns: undefined
      }
      search_contacts: {
        Args: {
          p_assigned_to?: string
          p_church_id: string
          p_event_id?: string
          p_interest?: Database["public"]["Enums"]["interest_tag"]
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: Database["public"]["Enums"]["follow_up_status"]
          p_unassigned?: boolean
        }
        Returns: {
          area: string
          assigned_handling_role: string
          assigned_name: string
          assigned_to: string
          best_time_to_contact: string
          created_at: string
          do_not_contact: boolean
          duplicate_match_confidence: number
          duplicate_match_reason: string
          duplicate_of_contact_id: string
          email: string
          event_id: string
          event_name: string
          full_name: string
          id: string
          interests: Database["public"]["Enums"]["interest_tag"][]
          language: string
          person_id: string
          phone: string
          recommended_assigned_role: string
          status: Database["public"]["Enums"]["follow_up_status"]
          total_count: number
          urgency: Database["public"]["Enums"]["urgency_level"]
        }[]
      }
      search_follow_ups: {
        Args: {
          p_assigned_to?: string
          p_church_id: string
          p_due_state?: string
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_status?: Database["public"]["Enums"]["follow_up_status"]
          p_unassigned?: boolean
        }
        Returns: {
          assigned_name: string
          assigned_to: string
          channel: Database["public"]["Enums"]["follow_up_channel"]
          completed_at: string
          contact_area: string
          contact_do_not_contact: boolean
          contact_email: string
          contact_full_name: string
          contact_id: string
          contact_phone: string
          contact_status: Database["public"]["Enums"]["follow_up_status"]
          contact_urgency: Database["public"]["Enums"]["urgency_level"]
          created_at: string
          due_at: string
          event_id: string
          event_name: string
          id: string
          interests: Database["public"]["Enums"]["interest_tag"][]
          next_action: string
          notes: string
          status: Database["public"]["Enums"]["follow_up_status"]
          suggested_message_id: string
          suggested_message_text: string
          suggested_opened_at: string
          suggested_wa_link: string
          total_count: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_event_registration: {
        Args: {
          p_area: string
          p_best_time_to_contact: string
          p_classification_payload: Json
          p_consent_given: boolean
          p_consent_recorded_by: string
          p_consent_scope: string[]
          p_consent_source: string
          p_consent_status: string
          p_consent_text_snapshot: string
          p_email: string
          p_form_answers: Json
          p_full_name: string
          p_interests: Database["public"]["Enums"]["interest_tag"][]
          p_language: string
          p_message: string
          p_phone: string
          p_prayer_visibility: Database["public"]["Enums"]["prayer_visibility"]
          p_preferred_contact_methods: string[]
          p_privacy_policy_version: string
          p_recommended_assigned_role: string
          p_slug: string
          p_urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Returns: string
      }
      team_invitation_preview: {
        Args: { p_token: string }
        Returns: {
          church_name: string
          display_name: string
          email: string
          expires_at: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["team_invitation_status"]
        }[]
      }
    }
    Enums: {
      app_admin_role: "owner" | "support_admin" | "billing_admin"
      event_type:
        | "church_service"
        | "health_expo"
        | "prophecy_seminar"
        | "bible_study"
        | "visitor_sabbath"
        | "youth_event"
        | "cooking_class"
        | "community_outreach"
        | "other"
        | "sabbath_visitor"
        | "evangelistic_campaign"
        | "prayer_campaign"
        | "regular_member"
        | "baptized_member"
        | "health_seminar"
        | "custom"
      follow_up_channel:
        | "call"
        | "whatsapp"
        | "sms"
        | "email"
        | "visit"
        | "note"
      follow_up_status:
        | "new"
        | "assigned"
        | "contacted"
        | "waiting"
        | "interested"
        | "bible_study_started"
        | "attended_church"
        | "baptism_interest"
        | "closed"
      interest_tag:
        | "prayer"
        | "bible_study"
        | "health"
        | "baptism"
        | "pastoral_visit"
        | "youth"
        | "cooking_class"
      membership_status: "active" | "invited" | "disabled"
      message_channel: "whatsapp" | "sms" | "email"
      prayer_visibility:
        | "prayer_team"
        | "pastors_only"
        | "general_prayer"
        | "pastor_only"
        | "private_contact"
        | "family_support"
        | "sensitive"
        | "health_related"
        | "pastoral_prayer"
      team_invitation_status: "pending" | "accepted" | "revoked" | "expired"
      team_role:
        | "owner"
        | "admin"
        | "pastor"
        | "elder"
        | "bible_worker"
        | "health_leader"
        | "prayer_team"
        | "youth_leader"
        | "viewer"
      urgency_level: "low" | "medium" | "high"
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
      app_admin_role: ["owner", "support_admin", "billing_admin"],
      event_type: [
        "church_service",
        "health_expo",
        "prophecy_seminar",
        "bible_study",
        "visitor_sabbath",
        "youth_event",
        "cooking_class",
        "community_outreach",
        "other",
        "sabbath_visitor",
        "evangelistic_campaign",
        "prayer_campaign",
        "regular_member",
        "baptized_member",
        "health_seminar",
        "custom",
      ],
      follow_up_channel: ["call", "whatsapp", "sms", "email", "visit", "note"],
      follow_up_status: [
        "new",
        "assigned",
        "contacted",
        "waiting",
        "interested",
        "bible_study_started",
        "attended_church",
        "baptism_interest",
        "closed",
      ],
      interest_tag: [
        "prayer",
        "bible_study",
        "health",
        "baptism",
        "pastoral_visit",
        "youth",
        "cooking_class",
      ],
      membership_status: ["active", "invited", "disabled"],
      message_channel: ["whatsapp", "sms", "email"],
      prayer_visibility: [
        "prayer_team",
        "pastors_only",
        "general_prayer",
        "pastor_only",
        "private_contact",
        "family_support",
        "sensitive",
        "health_related",
        "pastoral_prayer",
      ],
      team_invitation_status: ["pending", "accepted", "revoked", "expired"],
      team_role: [
        "owner",
        "admin",
        "pastor",
        "elder",
        "bible_worker",
        "health_leader",
        "prayer_team",
        "youth_leader",
        "viewer",
      ],
      urgency_level: ["low", "medium", "high"],
    },
  },
} as const

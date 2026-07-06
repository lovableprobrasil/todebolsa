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
      account_deletion_requests: {
        Row: {
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: number
          metadata: Json | null
          path: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: number
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: number
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_generated: boolean
          ai_warnings: string[]
          author: string | null
          category: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          image_alt: string | null
          image_credit: string | null
          is_featured: boolean
          is_published: boolean
          main_keyword: string | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          secondary_keywords: string[]
          share_count: number
          slug: string
          source_name: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["news_status"]
          subtitle: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_generated?: boolean
          ai_warnings?: string[]
          author?: string | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_credit?: string | null
          is_featured?: boolean
          is_published?: boolean
          main_keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          secondary_keywords?: string[]
          share_count?: number
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          subtitle?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_generated?: boolean
          ai_warnings?: string[]
          author?: string | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_alt?: string | null
          image_credit?: string | null
          is_featured?: boolean
          is_published?: boolean
          main_keyword?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          secondary_keywords?: string[]
          share_count?: number
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          subtitle?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      campaign_scholarships: {
        Row: {
          campaign_id: string
          scholarship_id: string
        }
        Insert: {
          campaign_id: string
          scholarship_id: string
        }
        Update: {
          campaign_id?: string
          scholarship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_scholarships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_scholarships_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          end_at: string | null
          id: string
          is_active: boolean
          name: string
          start_at: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_at?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checkout_acceptances: {
        Row: {
          accepted_at: string
          checkout_session_id: string | null
          id: string
          ip_address: unknown
          lead_cpf: string | null
          lead_email: string | null
          lead_name: string | null
          term_kind: string
          term_version: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          checkout_session_id?: string | null
          id?: string
          ip_address?: unknown
          lead_cpf?: string | null
          lead_email?: string | null
          lead_name?: string | null
          term_kind: string
          term_version?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          checkout_session_id?: string | null
          id?: string
          ip_address?: unknown
          lead_cpf?: string | null
          lead_email?: string | null
          lead_name?: string | null
          term_kind?: string
          term_version?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_acceptances_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_events: {
        Row: {
          checkout_session_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          checkout_session_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          checkout_session_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "checkout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          abandonment_email_sent_at: string | null
          address_data: Json
          amount_charged: number | null
          created_at: string
          current_step: Database["public"]["Enums"]["checkout_step"]
          expires_at: string
          id: string
          installments: number | null
          ip_address: unknown
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          personal_data: Json
          pricing_rule_id: string | null
          reservation_id: string | null
          scholarship_id: string
          session_token: string
          status: Database["public"]["Enums"]["checkout_status"]
          updated_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          abandonment_email_sent_at?: string | null
          address_data?: Json
          amount_charged?: number | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["checkout_step"]
          expires_at?: string
          id?: string
          installments?: number | null
          ip_address?: unknown
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          personal_data?: Json
          pricing_rule_id?: string | null
          reservation_id?: string | null
          scholarship_id: string
          session_token?: string
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          abandonment_email_sent_at?: string | null
          address_data?: Json
          amount_charged?: number | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["checkout_step"]
          expires_at?: string
          id?: string
          installments?: number | null
          ip_address?: unknown
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          personal_data?: Json
          pricing_rule_id?: string | null
          reservation_id?: string | null
          scholarship_id?: string
          session_token?: string
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_log: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: number
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: number
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: number
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      course_offerings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          institution_unit_id: string
          status: Database["public"]["Enums"]["offering_status"]
          updated_at: string
          vacancies_available: number
          vacancies_cancelled: number
          vacancies_reserved: number
          vacancies_sold: number
          vacancies_total: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          institution_unit_id: string
          status?: Database["public"]["Enums"]["offering_status"]
          updated_at?: string
          vacancies_available?: number
          vacancies_cancelled?: number
          vacancies_reserved?: number
          vacancies_sold?: number
          vacancies_total?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          institution_unit_id?: string
          status?: Database["public"]["Enums"]["offering_status"]
          updated_at?: string
          vacancies_available?: number
          vacancies_cancelled?: number
          vacancies_reserved?: number
          vacancies_sold?: number
          vacancies_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_offerings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_institution_unit_id_fkey"
            columns: ["institution_unit_id"]
            isOneToOne: false
            referencedRelation: "institution_units"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          area: string | null
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          institution_id: string
          is_active: boolean
          level: Database["public"]["Enums"]["course_level"]
          modality: Database["public"]["Enums"]["course_modality"]
          name: string
          original_price: number
          prerequisites: string | null
          promotional_price: number | null
          shift: Database["public"]["Enums"]["course_shift"]
          slug: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          institution_id: string
          is_active?: boolean
          level: Database["public"]["Enums"]["course_level"]
          modality: Database["public"]["Enums"]["course_modality"]
          name: string
          original_price: number
          prerequisites?: string | null
          promotional_price?: number | null
          shift?: Database["public"]["Enums"]["course_shift"]
          slug: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          institution_id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          modality?: Database["public"]["Enums"]["course_modality"]
          name?: string
          original_price?: number
          prerequisites?: string | null
          promotional_price?: number | null
          shift?: Database["public"]["Enums"]["course_shift"]
          slug?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          id: string
          payload: Json | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          payload?: Json | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          payload?: Json | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enrollment_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["enrollment_doc_type"]
          enrollment_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          rejection_reason: string | null
          reservation_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["enrollment_doc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["enrollment_doc_type"]
          enrollment_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          reservation_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["enrollment_doc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["enrollment_doc_type"]
          enrollment_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          reservation_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["enrollment_doc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_documents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          notes: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          uge_card_eligible: boolean
          uge_card_issued_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          notes?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          uge_card_eligible?: boolean
          uge_card_issued_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          notes?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          uge_card_eligible?: boolean
          uge_card_issued_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          scholarship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scholarship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scholarship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "institution_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_application_messages: {
        Row: {
          application_id: string
          author_id: string
          author_role: string
          created_at: string
          id: string
          message: string
        }
        Insert: {
          application_id: string
          author_id: string
          author_role: string
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          application_id?: string
          author_id?: string
          author_role?: string
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "institution_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_applications: {
        Row: {
          accepted_at: string | null
          accepted_privacy: boolean
          accepted_representation: boolean
          accepted_terms: boolean
          accepted_truthfulness: boolean
          address: string | null
          assigned_sales_id: string | null
          authorization_declared: boolean
          avg_discount_pct: number | null
          city: string | null
          cnpj: string | null
          complement: string | null
          courses_offered: string[]
          created_at: string
          email: string | null
          has_idle_vacancies: boolean | null
          high_potential: boolean
          id: string
          instagram: string | null
          institution_id: string | null
          institution_type: string | null
          internal_notes: string | null
          legal_name: string | null
          levels: string[]
          modalities: string[]
          monthly_vacancies: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          rejection_reason: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_role: string | null
          responsible_whatsapp: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_mode:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state: string | null
          status: Database["public"]["Enums"]["institution_application_status"]
          submitted_at: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_privacy?: boolean
          accepted_representation?: boolean
          accepted_terms?: boolean
          accepted_truthfulness?: boolean
          address?: string | null
          assigned_sales_id?: string | null
          authorization_declared?: boolean
          avg_discount_pct?: number | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          courses_offered?: string[]
          created_at?: string
          email?: string | null
          has_idle_vacancies?: boolean | null
          high_potential?: boolean
          id?: string
          instagram?: string | null
          institution_id?: string | null
          institution_type?: string | null
          internal_notes?: string | null
          legal_name?: string | null
          levels?: string[]
          modalities?: string[]
          monthly_vacancies?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          rejection_reason?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_role?: string | null
          responsible_whatsapp?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_mode?:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state?: string | null
          status?: Database["public"]["Enums"]["institution_application_status"]
          submitted_at?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_privacy?: boolean
          accepted_representation?: boolean
          accepted_terms?: boolean
          accepted_truthfulness?: boolean
          address?: string | null
          assigned_sales_id?: string | null
          authorization_declared?: boolean
          avg_discount_pct?: number | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          courses_offered?: string[]
          created_at?: string
          email?: string | null
          has_idle_vacancies?: boolean | null
          high_potential?: boolean
          id?: string
          instagram?: string | null
          institution_id?: string | null
          institution_type?: string | null
          internal_notes?: string | null
          legal_name?: string | null
          levels?: string[]
          modalities?: string[]
          monthly_vacancies?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          rejection_reason?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_role?: string | null
          responsible_whatsapp?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_mode?:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state?: string | null
          status?: Database["public"]["Enums"]["institution_application_status"]
          submitted_at?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_onboarding_checklist: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          institution_id: string
          step_code: string
          step_order: number
          step_title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          institution_id: string
          step_code: string
          step_order: number
          step_title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          step_code?: string
          step_order?: number
          step_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_onboarding_checklist_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_prospects: {
        Row: {
          city: string | null
          cnpj: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_institution_id: string | null
          created_at: string
          estimated_courses: number | null
          estimated_students: number | null
          id: string
          legal_name: string | null
          next_action_at: string | null
          notes: string | null
          owner_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          trade_name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_institution_id?: string | null
          created_at?: string
          estimated_courses?: number | null
          estimated_students?: number | null
          id?: string
          legal_name?: string | null
          next_action_at?: string | null
          notes?: string | null
          owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          trade_name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_institution_id?: string | null
          created_at?: string
          estimated_courses?: number | null
          estimated_students?: number | null
          id?: string
          legal_name?: string | null
          next_action_at?: string | null
          notes?: string | null
          owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          trade_name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_prospects_converted_institution_id_fkey"
            columns: ["converted_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          institution_id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          rating: number
          reservation_id: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          institution_id: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          rating: number
          reservation_id: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          institution_id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          rating?: number
          reservation_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_reviews_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_reviews_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_units: {
        Row: {
          address: string | null
          city: string
          created_at: string
          id: string
          institution_id: string
          is_main: boolean
          name: string
          neighborhood: string | null
          phone: string | null
          state: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city: string
          created_at?: string
          id?: string
          institution_id: string
          is_main?: boolean
          name: string
          neighborhood?: string | null
          phone?: string | null
          state: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          id?: string
          institution_id?: string
          is_main?: boolean
          name?: string
          neighborhood?: string | null
          phone?: string | null
          state?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_units_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          cnpj: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_featured: boolean
          legal_name: string | null
          logo_url: string | null
          mec_code: string | null
          phone: string | null
          rating: number | null
          rating_avg: number
          rating_count: number
          slug: string
          status: Database["public"]["Enums"]["institution_status"]
          trade_name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          legal_name?: string | null
          logo_url?: string | null
          mec_code?: string | null
          phone?: string | null
          rating?: number | null
          rating_avg?: number
          rating_count?: number
          slug: string
          status?: Database["public"]["Enums"]["institution_status"]
          trade_name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          legal_name?: string | null
          logo_url?: string | null
          mec_code?: string | null
          phone?: string | null
          rating?: number | null
          rating_avg?: number
          rating_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["institution_status"]
          trade_name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          done_at: string | null
          due_at: string | null
          id: string
          lead_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          course_interest: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      letter_validation_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          institution_user_id: string | null
          letter_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          institution_user_id?: string | null
          letter_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          institution_user_id?: string | null
          letter_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letter_validation_events_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "scholarship_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_pricing_rules: {
        Row: {
          allow_boleto: boolean
          allow_card: boolean
          allow_pix: boolean
          boleto_due_days: number
          created_at: string
          currency: string
          fee_description: string | null
          fee_display_name: string
          fixed_amount: number | null
          id: string
          interest_rate_pct: number
          is_active: boolean
          letter_validity_days: number
          max_installments: number
          maximum_amount: number | null
          min_installment_amount: number
          minimum_amount: number | null
          percentage_rate: number | null
          pix_expiration_minutes: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          reservation_ttl_minutes: number
          reserve_before_payment: boolean
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["pricing_scope_type"]
          updated_at: string
        }
        Insert: {
          allow_boleto?: boolean
          allow_card?: boolean
          allow_pix?: boolean
          boleto_due_days?: number
          created_at?: string
          currency?: string
          fee_description?: string | null
          fee_display_name?: string
          fixed_amount?: number | null
          id?: string
          interest_rate_pct?: number
          is_active?: boolean
          letter_validity_days?: number
          max_installments?: number
          maximum_amount?: number | null
          min_installment_amount?: number
          minimum_amount?: number | null
          percentage_rate?: number | null
          pix_expiration_minutes?: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          reservation_ttl_minutes?: number
          reserve_before_payment?: boolean
          scope_id?: string | null
          scope_type: Database["public"]["Enums"]["pricing_scope_type"]
          updated_at?: string
        }
        Update: {
          allow_boleto?: boolean
          allow_card?: boolean
          allow_pix?: boolean
          boleto_due_days?: number
          created_at?: string
          currency?: string
          fee_description?: string | null
          fee_display_name?: string
          fixed_amount?: number | null
          id?: string
          interest_rate_pct?: number
          is_active?: boolean
          letter_validity_days?: number
          max_installments?: number
          maximum_amount?: number | null
          min_installment_amount?: number
          minimum_amount?: number | null
          percentage_rate?: number | null
          pix_expiration_minutes?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          reservation_ttl_minutes?: number
          reserve_before_payment?: boolean
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["pricing_scope_type"]
          updated_at?: string
        }
        Relationships: []
      }
      news_ai_generations: {
        Row: {
          article_id: string | null
          created_at: string
          generation_type: string
          id: string
          input_payload: Json | null
          model_provider: string | null
          output_payload: Json | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          generation_type: string
          id?: string
          input_payload?: Json | null
          model_provider?: string | null
          output_payload?: Json | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          generation_type?: string
          id?: string
          input_payload?: Json | null
          model_provider?: string | null
          output_payload?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_ai_generations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      news_images: {
        Row: {
          alt_text: string | null
          article_id: string | null
          aspect_ratio: string | null
          created_at: string
          created_by: string | null
          id: string
          image_type: string
          image_url: string
          prompt: string | null
          selected: boolean
          style: string | null
        }
        Insert: {
          alt_text?: string | null
          article_id?: string | null
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_type?: string
          image_url: string
          prompt?: string | null
          selected?: boolean
          style?: string | null
        }
        Update: {
          alt_text?: string | null
          article_id?: string | null
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_type?: string
          image_url?: string
          prompt?: string | null
          selected?: boolean
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_images_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_post_versions: {
        Row: {
          change_reason: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          post_id: string
          snapshot: Json
          status: string | null
          subtitle: string | null
          title: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id: string
          snapshot: Json
          status?: string | null
          subtitle?: string | null
          title: string
          version_number: number
        }
        Update: {
          change_reason?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id?: string
          snapshot?: Json
          status?: string | null
          subtitle?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_post_versions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number
          created_at: string
          gateway_ref: string | null
          id: string
          method: string
          paid_at: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          gateway_ref?: string | null
          id?: string
          method: string
          paid_at?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          gateway_ref?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          institution_id: string | null
          name: string
          phone: string | null
          referral_code: string | null
          referred_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          institution_id?: string | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          institution_id?: string | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospect_activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          done_at: string | null
          due_at: string | null
          id: string
          prospect_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          prospect_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          done_at?: string | null
          due_at?: string | null
          id?: string
          prospect_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "institution_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_credits: {
        Row: {
          amount: number
          created_at: string
          id: string
          referred_user_id: string | null
          reservation_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          referred_user_id?: string | null
          reservation_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referred_user_id?: string | null
          reservation_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_payouts: {
        Row: {
          amount: number
          id: string
          notes: string | null
          pix_key: string
          pix_key_type: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          notes?: string | null
          pix_key: string
          pix_key_type: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          notes?: string | null
          pix_key?: string
          pix_key_type?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_attempt_id: string | null
          processed_at: string
          processed_by: string | null
          reason: string | null
          requested_by: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_attempt_id?: string | null
          processed_at?: string
          processed_by?: string | null
          reason?: string | null
          requested_by?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_attempt_id?: string | null
          processed_at?: string
          processed_by?: string | null
          reason?: string | null
          requested_by?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_attempt_id_fkey"
            columns: ["payment_attempt_id"]
            isOneToOne: false
            referencedRelation: "payment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          amount_paid: number | null
          checkout_session_id: string | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          installments: number | null
          institution_id: string
          letter_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id: string | null
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount_paid?: number | null
          checkout_session_id?: string | null
          course_offering_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          installments?: number | null
          institution_id: string
          letter_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id?: string | null
          reservation_code: string
          reserved_at?: string
          scholarship_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount_paid?: number | null
          checkout_session_id?: string | null
          course_offering_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          installments?: number | null
          institution_id?: string
          letter_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id?: string | null
          reservation_code?: string
          reserved_at?: string
          scholarship_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "scholarship_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_pricing_rule_id_fkey"
            columns: ["pricing_rule_id"]
            isOneToOne: false
            referencedRelation: "marketplace_pricing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_imports: {
        Row: {
          created_at: string
          errors: Json
          failed_count: number
          file_name: string | null
          id: string
          imported_count: number
          institution_id: string
          status: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          errors?: Json
          failed_count?: number
          file_name?: string | null
          id?: string
          imported_count?: number
          institution_id: string
          status?: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          errors?: Json
          failed_count?: number
          file_name?: string | null
          id?: string
          imported_count?: number
          institution_id?: string
          status?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_imports_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_letters: {
        Row: {
          amount_charged: number
          created_at: string
          email_sent_at: string | null
          expires_at: string
          id: string
          institution_id: string
          issued_at: string
          pricing_snapshot: Json | null
          reservation_id: string
          scholarship_id: string
          status: Database["public"]["Enums"]["scholarship_letter_status"]
          unique_code: string
          updated_at: string
          used_at: string | null
          user_id: string
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          amount_charged: number
          created_at?: string
          email_sent_at?: string | null
          expires_at: string
          id?: string
          institution_id: string
          issued_at?: string
          pricing_snapshot?: Json | null
          reservation_id: string
          scholarship_id: string
          status?: Database["public"]["Enums"]["scholarship_letter_status"]
          unique_code: string
          updated_at?: string
          used_at?: string | null
          user_id: string
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          amount_charged?: number
          created_at?: string
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          institution_id?: string
          issued_at?: string
          pricing_snapshot?: Json | null
          reservation_id?: string
          scholarship_id?: string
          status?: Database["public"]["Enums"]["scholarship_letter_status"]
          unique_code?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_letters_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_letters_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_letters_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          course_offering_id: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          max_uses: number | null
          price_with_scholarship: number
          required_documents: string[] | null
          rules: string | null
          start_at: string
          title: string
          updated_at: string
          used_count: number
        }
        Insert: {
          course_offering_id: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_uses?: number | null
          price_with_scholarship: number
          required_documents?: string[] | null
          rules?: string | null
          start_at?: string
          title: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          course_offering_id?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_uses?: number | null
          price_with_scholarship?: number
          required_documents?: string[] | null
          rules?: string | null
          start_at?: string
          title?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          institution_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string | null
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
      admin_list_institution_applications: {
        Args: never
        Returns: {
          city: string
          cnpj: string
          created_at: string
          high_potential: boolean
          id: string
          legal_name: string
          responsible_email: string
          responsible_name: string
          state: string
          status: Database["public"]["Enums"]["institution_application_status"]
          submitted_at: string
          trade_name: string
        }[]
      }
      admin_list_users: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      approve_institution_application: {
        Args: { p_id: string }
        Returns: string
      }
      assign_application_sales: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      assign_lead: {
        Args: { p_lead_id: string; p_owner_id: string }
        Returns: undefined
      }
      assign_user_role: {
        Args: {
          p_institution_id?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      bulk_import_scholarships: {
        Args: { p_file_name: string; p_institution_id: string; p_rows: Json }
        Returns: Json
      }
      calculate_reservation_fee: {
        Args: { p_scholarship_id: string }
        Returns: {
          amount: number
          rule_id: string
          validity_days: number
        }[]
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          amount_paid: number | null
          checkout_session_id: string | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          installments: number | null
          institution_id: string
          letter_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id: string | null
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      checkout_check_existing_account: {
        Args: { p_cpf?: string; p_email?: string }
        Returns: Json
      }
      checkout_finalize: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: string
      }
      checkout_record_acceptances: {
        Args: { p_session_token: string; p_terms: string[] }
        Returns: undefined
      }
      checkout_save_step: {
        Args: {
          p_address?: Json
          p_installments?: number
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_personal?: Json
          p_session_token: string
          p_step: Database["public"]["Enums"]["checkout_step"]
        }
        Returns: Json
      }
      checkout_start: {
        Args: { p_scholarship_id: string; p_session_token?: string }
        Returns: Json
      }
      claim_first_admin: { Args: never; Returns: undefined }
      claim_institution: {
        Args: {
          p_city: string
          p_cnpj: string
          p_description: string
          p_email: string
          p_legal_name: string
          p_phone: string
          p_state: string
          p_trade_name: string
          p_unit_name: string
          p_website: string
        }
        Returns: string
      }
      complete_refund: {
        Args: {
          p_reason: string
          p_reservation_id: string
          p_stripe_refund_id?: string
        }
        Returns: {
          amount: number
          created_at: string
          id: string
          payment_attempt_id: string | null
          processed_at: string
          processed_by: string | null
          reason: string | null
          requested_by: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_enrollment: {
        Args: { p_approve: boolean; p_notes?: string; p_reservation_id: string }
        Returns: {
          amount_paid: number | null
          checkout_session_id: string | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          installments: number | null
          institution_id: string
          letter_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id: string | null
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_reservation: {
        Args: { p_scholarship_id: string }
        Returns: {
          amount_paid: number | null
          checkout_session_id: string | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          installments: number | null
          institution_id: string
          letter_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id: string | null
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_overview: { Args: never; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_reservations: { Args: never; Returns: number }
      expire_scholarship_letters: { Args: never; Returns: number }
      export_my_data: { Args: never; Returns: Json }
      finalize_enrollment: {
        Args: { p_approved: boolean; p_notes: string; p_reservation_id: string }
        Returns: {
          created_at: string
          id: string
          institution_id: string
          notes: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          uge_card_eligible: boolean
          uge_card_issued_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finance_overview: { Args: never; Returns: Json }
      finance_revenue_by_institution: {
        Args: never
        Returns: {
          gross: number
          institution_id: string
          net: number
          payments_count: number
          refunds: number
          trade_name: string
        }[]
      }
      funnel_overview: { Args: { p_days?: number }; Returns: Json }
      gen_letter_code: { Args: never; Returns: string }
      gen_reservation_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_letter_by_code: {
        Args: { p_code: string }
        Returns: {
          course_name: string
          discount_percent: number
          expires_at: string
          institution_trade_name: string
          issued_at: string
          monthly_original: number
          monthly_with_scholarship: number
          scholarship_title: string
          status: Database["public"]["Enums"]["scholarship_letter_status"]
          student_first_name: string
          unique_code: string
          unit_city: string
          unit_name: string
          unit_state: string
          used_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_news_share: { Args: { _slug: string }; Returns: undefined }
      increment_news_view: { Args: { _slug: string }; Returns: undefined }
      institution_finance_overview: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      institution_paid_leads_report: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      is_institution_admin: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _uid?: string }; Returns: boolean }
      is_platform_sales: { Args: never; Returns: boolean }
      issue_scholarship_letter: {
        Args: { p_reservation_id: string }
        Returns: {
          amount_charged: number
          created_at: string
          email_sent_at: string | null
          expires_at: string
          id: string
          institution_id: string
          issued_at: string
          pricing_snapshot: Json | null
          reservation_id: string
          scholarship_id: string
          status: Database["public"]["Enums"]["scholarship_letter_status"]
          unique_code: string
          updated_at: string
          used_at: string | null
          user_id: string
          validated_by: string | null
          validation_notes: string | null
        }
        SetofOptions: {
          from: "*"
          to: "scholarship_letters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      moderate_review: {
        Args: { p_approve: boolean; p_notes?: string; p_review_id: string }
        Returns: {
          comment: string | null
          created_at: string
          id: string
          institution_id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          rating: number
          reservation_id: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "institution_reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      news_top_posts: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          category: string
          cover_url: string
          id: string
          published_at: string
          slug: string
          title: string
          view_count: number
        }[]
      }
      pay_reservation: {
        Args: { p_method: string; p_reservation_id: string }
        Returns: {
          amount_paid: number | null
          checkout_session_id: string | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          installments: number | null
          institution_id: string
          letter_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pricing_rule_id: string | null
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      post_application_message: {
        Args: { p_id: string; p_message: string }
        Returns: {
          application_id: string
          author_id: string
          author_role: string
          created_at: string
          id: string
          message: string
        }
        SetofOptions: {
          from: "*"
          to: "institution_application_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_scheduled_news: {
        Args: never
        Returns: {
          published_id: string
          published_slug: string
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalc_institution_rating: {
        Args: { p_institution_id: string }
        Returns: undefined
      }
      referral_leaderboard: { Args: { p_limit?: number }; Returns: Json }
      referral_summary: { Args: never; Returns: Json }
      request_account_deletion: {
        Args: { p_reason: string }
        Returns: {
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          scheduled_for: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "account_deletion_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_referral_payout: {
        Args: { p_amount: number; p_pix_key: string; p_pix_type: string }
        Returns: {
          amount: number
          id: string
          notes: string | null
          pix_key: string
          pix_key_type: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "referral_payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_refund: {
        Args: { p_reason: string; p_reservation_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          payment_attempt_id: string | null
          processed_at: string
          processed_by: string | null
          reason: string | null
          requested_by: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_enrollment_document: {
        Args: { p_approved: boolean; p_document_id: string; p_reason: string }
        Returns: {
          created_at: string
          doc_type: Database["public"]["Enums"]["enrollment_doc_type"]
          enrollment_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          rejection_reason: string | null
          reservation_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["enrollment_doc_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "enrollment_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_user_role: {
        Args: {
          p_institution_id?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      save_institution_application: {
        Args: { p_id: string; p_payload: Json }
        Returns: {
          accepted_at: string | null
          accepted_privacy: boolean
          accepted_representation: boolean
          accepted_terms: boolean
          accepted_truthfulness: boolean
          address: string | null
          assigned_sales_id: string | null
          authorization_declared: boolean
          avg_discount_pct: number | null
          city: string | null
          cnpj: string | null
          complement: string | null
          courses_offered: string[]
          created_at: string
          email: string | null
          has_idle_vacancies: boolean | null
          high_potential: boolean
          id: string
          instagram: string | null
          institution_id: string | null
          institution_type: string | null
          internal_notes: string | null
          legal_name: string | null
          levels: string[]
          modalities: string[]
          monthly_vacancies: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          rejection_reason: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_role: string | null
          responsible_whatsapp: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_mode:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state: string | null
          status: Database["public"]["Enums"]["institution_application_status"]
          submitted_at: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        SetofOptions: {
          from: "*"
          to: "institution_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_application_internal_notes: {
        Args: { p_id: string; p_notes: string }
        Returns: undefined
      }
      set_application_status: {
        Args: {
          p_id: string
          p_message?: string
          p_status: Database["public"]["Enums"]["institution_application_status"]
        }
        Returns: {
          accepted_at: string | null
          accepted_privacy: boolean
          accepted_representation: boolean
          accepted_terms: boolean
          accepted_truthfulness: boolean
          address: string | null
          assigned_sales_id: string | null
          authorization_declared: boolean
          avg_discount_pct: number | null
          city: string | null
          cnpj: string | null
          complement: string | null
          courses_offered: string[]
          created_at: string
          email: string | null
          has_idle_vacancies: boolean | null
          high_potential: boolean
          id: string
          instagram: string | null
          institution_id: string | null
          institution_type: string | null
          internal_notes: string | null
          legal_name: string | null
          levels: string[]
          modalities: string[]
          monthly_vacancies: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          rejection_reason: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_role: string | null
          responsible_whatsapp: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_mode:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state: string | null
          status: Database["public"]["Enums"]["institution_application_status"]
          submitted_at: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        SetofOptions: {
          from: "*"
          to: "institution_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_institution_status: {
        Args: {
          p_institution_id: string
          p_status: Database["public"]["Enums"]["institution_status"]
        }
        Returns: {
          cnpj: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_featured: boolean
          legal_name: string | null
          logo_url: string | null
          mec_code: string | null
          phone: string | null
          rating: number | null
          rating_avg: number
          rating_count: number
          slug: string
          status: Database["public"]["Enums"]["institution_status"]
          trade_name: string
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "institutions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_referrer: { Args: { p_code: string }; Returns: undefined }
      start_institution_application: { Args: never; Returns: string }
      student_request_refund: {
        Args: { p_reason: string; p_reservation_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          payment_attempt_id: string | null
          processed_at: string
          processed_by: string | null
          reason: string | null
          requested_by: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_enrollment_document: {
        Args: {
          p_doc_type: Database["public"]["Enums"]["enrollment_doc_type"]
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_mime_type: string
          p_reservation_id: string
        }
        Returns: {
          created_at: string
          doc_type: Database["public"]["Enums"]["enrollment_doc_type"]
          enrollment_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          rejection_reason: string | null
          reservation_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["enrollment_doc_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "enrollment_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_institution_application: {
        Args: { p_id: string }
        Returns: {
          accepted_at: string | null
          accepted_privacy: boolean
          accepted_representation: boolean
          accepted_terms: boolean
          accepted_truthfulness: boolean
          address: string | null
          assigned_sales_id: string | null
          authorization_declared: boolean
          avg_discount_pct: number | null
          city: string | null
          cnpj: string | null
          complement: string | null
          courses_offered: string[]
          created_at: string
          email: string | null
          has_idle_vacancies: boolean | null
          high_potential: boolean
          id: string
          instagram: string | null
          institution_id: string | null
          institution_type: string | null
          internal_notes: string | null
          legal_name: string | null
          levels: string[]
          modalities: string[]
          monthly_vacancies: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          rejection_reason: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_role: string | null
          responsible_whatsapp: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_mode:
            | Database["public"]["Enums"]["institution_service_mode"]
            | null
          state: string | null
          status: Database["public"]["Enums"]["institution_application_status"]
          submitted_at: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        SetofOptions: {
          from: "*"
          to: "institution_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      toggle_application_high_potential: {
        Args: { p_flag: boolean; p_id: string }
        Returns: undefined
      }
      toggle_institution_feature: {
        Args: { p_featured: boolean; p_institution_id: string }
        Returns: undefined
      }
      toggle_onboarding_step: {
        Args: { p_done: boolean; p_id: string }
        Returns: undefined
      }
      toggle_scholarship_feature: {
        Args: { p_featured: boolean; p_scholarship_id: string }
        Returns: undefined
      }
      track_event: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_event_type: string
          p_metadata: Json
          p_path: string
          p_referrer: string
          p_session_id: string
        }
        Returns: undefined
      }
      unaccent_safe: { Args: { p: string }; Returns: string }
      update_lead_status: {
        Args: {
          p_lead_id: string
          p_status: Database["public"]["Enums"]["lead_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "STUDENT"
        | "GUARDIAN"
        | "INSTITUTION_USER"
        | "INSTITUTION_ADMIN"
        | "PLATFORM_SALES"
        | "PLATFORM_ADMIN"
        | "INSTITUTION_APPLICANT"
      checkout_status: "ACTIVE" | "ABANDONED" | "CONVERTED" | "EXPIRED"
      checkout_step: "DATA" | "SCHOLARSHIP" | "REVIEW" | "PAYMENT" | "DONE"
      course_level:
        | "FUNDAMENTAL"
        | "MEDIO"
        | "TECNICO"
        | "IDIOMAS"
        | "PROFISSIONALIZANTE"
        | "CURSO_LIVRE"
        | "PREPARATORIO"
        | "EJA"
        | "PRE_VESTIBULAR"
        | "GRADUACAO"
        | "POS_GRADUACAO"
        | "MBA"
        | "MESTRADO"
      course_modality: "PRESENCIAL" | "SEMIPRESENCIAL" | "EAD"
      course_shift: "MANHA" | "TARDE" | "NOITE" | "INTEGRAL" | "FLEXIVEL"
      discount_type: "PERCENT" | "FIXED" | "FINAL_PRICE"
      enrollment_doc_status: "PENDING" | "APPROVED" | "REJECTED"
      enrollment_doc_type:
        | "RG"
        | "CPF"
        | "PROOF_OF_ADDRESS"
        | "INCOME_PROOF"
        | "PREVIOUS_DIPLOMA"
        | "ENROLLMENT_DECLARATION"
        | "PHOTO"
        | "OTHER"
      institution_application_status:
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "NEEDS_INFO"
        | "APPROVED"
        | "REJECTED"
        | "SUSPENDED"
      institution_service_mode: "PRESENCIAL" | "EAD" | "HIBRIDO" | "POLOS"
      institution_status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED"
      lead_status:
        | "NEW"
        | "CONTACTED"
        | "WAITING"
        | "INTERESTED"
        | "RESERVATION_STARTED"
        | "RESERVATION_DONE"
        | "ENROLLMENT_IN_PROGRESS"
        | "ENROLLMENT_DONE"
        | "LOST"
      news_status:
        | "DRAFT"
        | "IN_REVIEW"
        | "SCHEDULED"
        | "PUBLISHED"
        | "ARCHIVED"
      offering_status: "ACTIVE" | "PAUSED" | "SOLD_OUT" | "ARCHIVED"
      payment_method: "PIX" | "BOLETO" | "CARD"
      payment_status:
        | "PENDING"
        | "PAID"
        | "REFUSED"
        | "REFUNDED"
        | "CHARGEBACK"
        | "CANCELLED"
      pricing_scope_type: "GLOBAL" | "INSTITUTION" | "COURSE" | "SCHOLARSHIP"
      pricing_type:
        | "FIXED_AMOUNT"
        | "PERCENTAGE_OF_COURSE_VALUE"
        | "FIRST_MONTHLY_PAYMENT"
      prospect_status:
        | "NEW"
        | "CONTACTED"
        | "MEETING_SCHEDULED"
        | "PROPOSAL_SENT"
        | "NEGOTIATION"
        | "WON"
        | "LOST"
      refund_status: "REQUESTED" | "PROCESSED" | "FAILED"
      reservation_status:
        | "RESERVED"
        | "PAYMENT_PENDING"
        | "CONFIRMED"
        | "UNDER_REVIEW"
        | "AWAITING_ENROLLMENT"
        | "ENROLLMENT_APPROVED"
        | "ENROLLMENT_REJECTED"
        | "EXPIRED"
        | "CANCELLED"
      review_status: "PENDING" | "APPROVED" | "REJECTED"
      scholarship_letter_status: "ISSUED" | "USED" | "EXPIRED" | "CANCELLED"
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
      app_role: [
        "STUDENT",
        "GUARDIAN",
        "INSTITUTION_USER",
        "INSTITUTION_ADMIN",
        "PLATFORM_SALES",
        "PLATFORM_ADMIN",
        "INSTITUTION_APPLICANT",
      ],
      checkout_status: ["ACTIVE", "ABANDONED", "CONVERTED", "EXPIRED"],
      checkout_step: ["DATA", "SCHOLARSHIP", "REVIEW", "PAYMENT", "DONE"],
      course_level: [
        "FUNDAMENTAL",
        "MEDIO",
        "TECNICO",
        "IDIOMAS",
        "PROFISSIONALIZANTE",
        "CURSO_LIVRE",
        "PREPARATORIO",
        "EJA",
        "PRE_VESTIBULAR",
        "GRADUACAO",
        "POS_GRADUACAO",
        "MBA",
        "MESTRADO",
      ],
      course_modality: ["PRESENCIAL", "SEMIPRESENCIAL", "EAD"],
      course_shift: ["MANHA", "TARDE", "NOITE", "INTEGRAL", "FLEXIVEL"],
      discount_type: ["PERCENT", "FIXED", "FINAL_PRICE"],
      enrollment_doc_status: ["PENDING", "APPROVED", "REJECTED"],
      enrollment_doc_type: [
        "RG",
        "CPF",
        "PROOF_OF_ADDRESS",
        "INCOME_PROOF",
        "PREVIOUS_DIPLOMA",
        "ENROLLMENT_DECLARATION",
        "PHOTO",
        "OTHER",
      ],
      institution_application_status: [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "NEEDS_INFO",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
      ],
      institution_service_mode: ["PRESENCIAL", "EAD", "HIBRIDO", "POLOS"],
      institution_status: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"],
      lead_status: [
        "NEW",
        "CONTACTED",
        "WAITING",
        "INTERESTED",
        "RESERVATION_STARTED",
        "RESERVATION_DONE",
        "ENROLLMENT_IN_PROGRESS",
        "ENROLLMENT_DONE",
        "LOST",
      ],
      news_status: ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
      offering_status: ["ACTIVE", "PAUSED", "SOLD_OUT", "ARCHIVED"],
      payment_method: ["PIX", "BOLETO", "CARD"],
      payment_status: [
        "PENDING",
        "PAID",
        "REFUSED",
        "REFUNDED",
        "CHARGEBACK",
        "CANCELLED",
      ],
      pricing_scope_type: ["GLOBAL", "INSTITUTION", "COURSE", "SCHOLARSHIP"],
      pricing_type: [
        "FIXED_AMOUNT",
        "PERCENTAGE_OF_COURSE_VALUE",
        "FIRST_MONTHLY_PAYMENT",
      ],
      prospect_status: [
        "NEW",
        "CONTACTED",
        "MEETING_SCHEDULED",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "WON",
        "LOST",
      ],
      refund_status: ["REQUESTED", "PROCESSED", "FAILED"],
      reservation_status: [
        "RESERVED",
        "PAYMENT_PENDING",
        "CONFIRMED",
        "UNDER_REVIEW",
        "AWAITING_ENROLLMENT",
        "ENROLLMENT_APPROVED",
        "ENROLLMENT_REJECTED",
        "EXPIRED",
        "CANCELLED",
      ],
      review_status: ["PENDING", "APPROVED", "REJECTED"],
      scholarship_letter_status: ["ISSUED", "USED", "EXPIRED", "CANCELLED"],
    },
  },
} as const

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
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
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
          slug?: string
          status?: Database["public"]["Enums"]["institution_status"]
          trade_name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          amount_paid: number | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          course_offering_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          institution_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reservation_code: string
          reserved_at?: string
          scholarship_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          course_offering_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          institution_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reservation_code?: string
          reserved_at?: string
          scholarship_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
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
            foreignKeyName: "reservations_scholarship_id_fkey"
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
      assign_user_role: {
        Args: {
          p_institution_id?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          amount_paid: number | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
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
      create_reservation: {
        Args: { p_scholarship_id: string }
        Returns: {
          amount_paid: number | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_reservations: { Args: never; Returns: number }
      gen_reservation_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_institution_admin: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _uid?: string }; Returns: boolean }
      pay_reservation: {
        Args: { p_method: string; p_reservation_id: string }
        Returns: {
          amount_paid: number | null
          course_offering_id: string
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          reservation_code: string
          reserved_at: string
          scholarship_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
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
      toggle_institution_feature: {
        Args: { p_featured: boolean; p_institution_id: string }
        Returns: undefined
      }
      toggle_scholarship_feature: {
        Args: { p_featured: boolean; p_scholarship_id: string }
        Returns: undefined
      }
      unaccent_safe: { Args: { p: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "STUDENT"
        | "GUARDIAN"
        | "INSTITUTION_USER"
        | "INSTITUTION_ADMIN"
        | "PLATFORM_SALES"
        | "PLATFORM_ADMIN"
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
      offering_status: "ACTIVE" | "PAUSED" | "SOLD_OUT" | "ARCHIVED"
      payment_status:
        | "PENDING"
        | "PAID"
        | "REFUSED"
        | "REFUNDED"
        | "CHARGEBACK"
        | "CANCELLED"
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
      ],
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
      offering_status: ["ACTIVE", "PAUSED", "SOLD_OUT", "ARCHIVED"],
      payment_status: [
        "PENDING",
        "PAID",
        "REFUSED",
        "REFUNDED",
        "CHARGEBACK",
        "CANCELLED",
      ],
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
    },
  },
} as const

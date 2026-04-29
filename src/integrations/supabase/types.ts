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
      admin_messages: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean
          is_read: boolean
          message: string
          recipient_user_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          message: string
          recipient_user_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          message?: string
          recipient_user_id?: string | null
          subject?: string
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content_image_url: string | null
          content_link: string | null
          content_text: string | null
          content_type: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          metadata: Json | null
          page_name: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content_image_url?: string | null
          content_link?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          metadata?: Json | null
          page_name: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content_image_url?: string | null
          content_link?: string | null
          content_text?: string | null
          content_type?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          metadata?: Json | null
          page_name?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hr_announcements: {
        Row: {
          audience: string
          created_at: string
          created_by: string
          id: string
          message: string
          organization_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          created_at?: string
          created_by: string
          id?: string
          message: string
          organization_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          organization_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          organization_user_id: string
          recipient_user_id: string | null
          sender_user_id: string
          staff_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          organization_user_id: string
          recipient_user_id?: string | null
          sender_user_id: string
          staff_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          organization_user_id?: string
          recipient_user_id?: string | null
          sender_user_id?: string
          staff_id?: string | null
          subject?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: string
          organization_user_id: string
          reason: string | null
          requester_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          organization_user_id: string
          reason?: string | null
          requester_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          organization_user_id?: string
          reason?: string | null
          requester_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_roles: {
        Row: {
          created_at: string
          department: string | null
          id: string
          is_active: boolean
          organization_user_id: string
          platform_mode: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          organization_user_id: string
          platform_mode?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          organization_user_id?: string
          platform_mode?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_creators: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          business_name: string
          business_name_locked: boolean
          bvn: string | null
          bvn_verified: boolean | null
          created_at: string
          first_name: string
          flutterwave_customer_id: string | null
          id: string
          last_name: string
          onboarding_completed: boolean
          phone: string | null
          platform_mode: string
          updated_at: string
          user_id: string
          virtual_account_bank: string | null
          virtual_account_number: string | null
          virtual_account_ref: string | null
          wallet_balance: number | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          business_name: string
          business_name_locked?: boolean
          bvn?: string | null
          bvn_verified?: boolean | null
          created_at?: string
          first_name: string
          flutterwave_customer_id?: string | null
          id?: string
          last_name: string
          onboarding_completed?: boolean
          phone?: string | null
          platform_mode?: string
          updated_at?: string
          user_id: string
          virtual_account_bank?: string | null
          virtual_account_number?: string | null
          virtual_account_ref?: string | null
          wallet_balance?: number | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          business_name?: string
          business_name_locked?: boolean
          bvn?: string | null
          bvn_verified?: boolean | null
          created_at?: string
          first_name?: string
          flutterwave_customer_id?: string | null
          id?: string
          last_name?: string
          onboarding_completed?: boolean
          phone?: string | null
          platform_mode?: string
          updated_at?: string
          user_id?: string
          virtual_account_bank?: string | null
          virtual_account_number?: string | null
          virtual_account_ref?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          account_number: string
          amount: number
          bank_name: string
          created_at: string
          currency: string
          failure_reason: string | null
          fee: number
          flutterwave_ref: string | null
          id: string
          processed_at: string | null
          recipient_name: string
          reference: string | null
          scheduled_date: string
          staff_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          amount: number
          bank_name: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          fee?: number
          flutterwave_ref?: string | null
          id?: string
          processed_at?: string | null
          recipient_name: string
          reference?: string | null
          scheduled_date: string
          staff_id?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          amount?: number
          bank_name?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          fee?: number
          flutterwave_ref?: string | null
          id?: string
          processed_at?: string | null
          recipient_name?: string
          reference?: string | null
          scheduled_date?: string
          staff_id?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      school_classes: {
        Row: {
          class_name: string
          created_at: string
          id: string
          level: string | null
          organization_user_id: string
          teacher_name: string | null
          teacher_user_id: string | null
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          level?: string | null
          organization_user_id: string
          teacher_name?: string | null
          teacher_user_id?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          level?: string | null
          organization_user_id?: string
          teacher_name?: string | null
          teacher_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          account_number: string
          bank_name: string
          created_at: string
          department: string | null
          email: string | null
          employment_status: string
          full_name: string
          id: string
          is_active: boolean | null
          job_title: string | null
          notes: string | null
          onboarding_status: string
          pay_day: number
          phone: string | null
          salary: number
          staff_role: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          bank_name: string
          created_at?: string
          department?: string | null
          email?: string | null
          employment_status?: string
          full_name: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          onboarding_status?: string
          pay_day?: number
          phone?: string | null
          salary?: number
          staff_role?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          bank_name?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employment_status?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          onboarding_status?: string
          pay_day?: number
          phone?: string | null
          salary?: number
          staff_role?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_queries: {
        Row: {
          created_at: string
          details: string
          id: string
          issued_by: string
          organization_user_id: string
          response: string | null
          severity: string
          staff_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details: string
          id?: string
          issued_by: string
          organization_user_id: string
          response?: string | null
          severity?: string
          staff_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          issued_by?: string
          organization_user_id?: string
          response?: string | null
          severity?: string
          staff_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_fee_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          organization_user_id: string
          paid_at: string
          payment_method: string | null
          payment_status: string
          recorded_by: string
          session_year: string | null
          student_id: string
          term: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_user_id: string
          paid_at?: string
          payment_method?: string | null
          payment_status?: string
          recorded_by: string
          session_year?: string | null
          student_id: string
          term?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_user_id?: string
          paid_at?: string
          payment_method?: string | null
          payment_status?: string
          recorded_by?: string
          session_year?: string | null
          student_id?: string
          term?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          admission_number: string | null
          class_id: string | null
          created_at: string
          fee_status: string
          first_name: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_name: string
          organization_user_id: string
          outstanding_balance: number
          status: string
          updated_at: string
        }
        Insert: {
          admission_number?: string | null
          class_id?: string | null
          created_at?: string
          fee_status?: string
          first_name: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name: string
          organization_user_id: string
          outstanding_balance?: number
          status?: string
          updated_at?: string
        }
        Update: {
          admission_number?: string | null
          class_id?: string | null
          created_at?: string
          fee_status?: string
          first_name?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string
          organization_user_id?: string
          outstanding_balance?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tokenized_cards: {
        Row: {
          brand: string
          created_at: string
          expiry: string
          flutterwave_token: string | null
          id: string
          is_default: boolean | null
          last4: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          expiry: string
          flutterwave_token?: string | null
          id?: string
          is_default?: boolean | null
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          expiry?: string
          flutterwave_token?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          business_address: string | null
          business_name: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          receipt_generated_at: string | null
          receipt_id: string | null
          receipt_image_url: string | null
          receipt_pdf_url: string | null
          receipt_status: string
          receiver_account: string | null
          receiver_bank: string | null
          receiver_name: string | null
          reference: string | null
          sender_account: string | null
          sender_bank: string | null
          sender_name: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          business_address?: string | null
          business_name?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_generated_at?: string | null
          receipt_id?: string | null
          receipt_image_url?: string | null
          receipt_pdf_url?: string | null
          receipt_status?: string
          receiver_account?: string | null
          receiver_bank?: string | null
          receiver_name?: string | null
          reference?: string | null
          sender_account?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          business_address?: string | null
          business_name?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_generated_at?: string | null
          receipt_id?: string | null
          receipt_image_url?: string | null
          receipt_pdf_url?: string | null
          receipt_status?: string
          receiver_account?: string | null
          receiver_bank?: string | null
          receiver_name?: string | null
          reference?: string | null
          sender_account?: string | null
          sender_bank?: string | null
          sender_name?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      virtual_cards: {
        Row: {
          amount: number | null
          card_id: string
          card_pan: string | null
          card_type: string | null
          created_at: string
          currency: string | null
          cvv: string | null
          expiration: string | null
          flutterwave_ref: string | null
          id: string
          masked_pan: string | null
          name_on_card: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          card_id: string
          card_pan?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string | null
          cvv?: string | null
          expiration?: string | null
          flutterwave_ref?: string | null
          id?: string
          masked_pan?: string | null
          name_on_card?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          card_id?: string
          card_pan?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string | null
          cvv?: string | null
          expiration?: string | null
          flutterwave_ref?: string | null
          id?: string
          masked_pan?: string | null
          name_on_card?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_user_onboarding_profile: {
        Args: never
        Returns: {
          account_type: string
          avatar_url: string | null
          business_name: string
          business_name_locked: boolean
          bvn: string | null
          bvn_verified: boolean | null
          created_at: string
          first_name: string
          flutterwave_customer_id: string | null
          id: string
          last_name: string
          onboarding_completed: boolean
          phone: string | null
          platform_mode: string
          updated_at: string
          user_id: string
          virtual_account_bank: string | null
          virtual_account_number: string | null
          virtual_account_ref: string | null
          wallet_balance: number | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_org_role: {
        Args: {
          _organization_user_id: string
          _roles: string[]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_creator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

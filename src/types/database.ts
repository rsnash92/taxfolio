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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          provider_item_id: string
          access_token_blob: string
          institution_name: string | null
          institution_id: string | null
          status: string
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_item_id: string
          access_token_blob: string
          institution_name?: string | null
          institution_id?: string | null
          status?: string
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_item_id?: string
          access_token_blob?: string
          institution_name?: string | null
          institution_id?: string | null
          status?: string
          last_synced_at?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          bank_connection_id: string
          external_account_id: string
          name: string | null
          official_name: string | null
          type: string | null
          subtype: string | null
          mask: string | null
          is_business_account: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_connection_id: string
          external_account_id: string
          name?: string | null
          official_name?: string | null
          type?: string | null
          subtype?: string | null
          mask?: string | null
          is_business_account?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_connection_id?: string
          external_account_id?: string
          name?: string | null
          official_name?: string | null
          type?: string | null
          subtype?: string | null
          mask?: string | null
          is_business_account?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          external_transaction_id: string | null
          date: string
          description: string
          amount: number
          currency: string
          merchant_name: string | null
          category_id: string | null
          ai_suggested_category_id: string | null
          ai_confidence: number | null
          review_status: string
          notes: string | null
          tax_year: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          external_transaction_id?: string | null
          date: string
          description: string
          amount: number
          currency?: string
          merchant_name?: string | null
          category_id?: string | null
          ai_suggested_category_id?: string | null
          ai_confidence?: number | null
          review_status?: string
          notes?: string | null
          tax_year?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          external_transaction_id?: string | null
          date?: string
          description?: string
          amount?: number
          currency?: string
          merchant_name?: string | null
          category_id?: string | null
          ai_suggested_category_id?: string | null
          ai_confidence?: number | null
          review_status?: string
          notes?: string | null
          tax_year?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          code: string
          name: string
          type: string
          hmrc_box: string | null
          description: string | null
          keywords: string[] | null
          display_order: number | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          type: string
          hmrc_box?: string | null
          description?: string | null
          keywords?: string[] | null
          display_order?: number | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          type?: string
          hmrc_box?: string | null
          description?: string | null
          keywords?: string[] | null
          display_order?: number | null
        }
      }
      tax_years: {
        Row: {
          id: string
          user_id: string
          year: string
          total_income: number
          total_expenses: number
          net_profit: number
          estimated_tax: number
          estimated_ni: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: string
          total_income?: number
          total_expenses?: number
          net_profit?: number
          estimated_tax?: number
          estimated_ni?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: string
          total_income?: number
          total_expenses?: number
          net_profit?: number
          estimated_tax?: number
          estimated_ni?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for convenience
export type User = Database['public']['Tables']['users']['Row']
export type BankConnection = Database['public']['Tables']['bank_connections']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type TaxYear = Database['public']['Tables']['tax_years']['Row']

export type TransactionWithCategory = Transaction & {
  category: Category | null
  ai_suggested_category: Category | null
  account: Account | null
}

// Mileage types
export type VehicleType = 'car' | 'motorcycle' | 'bicycle'

export interface MileageTrip {
  id: string
  user_id: string
  tax_year: string
  trip_date: string
  description: string
  from_location: string | null
  to_location: string | null
  miles: number
  is_return_journey: boolean
  vehicle_type: VehicleType
  calculated_allowance: number | null
  created_at: string
  updated_at: string
}

export interface MileageSummary {
  totalMiles: number
  totalAllowance: number
  tripCount: number
  byVehicle: {
    car: { miles: number; allowance: number }
    motorcycle: { miles: number; allowance: number }
    bicycle: { miles: number; allowance: number }
  }
}

// Property types (SA105)
export type PropertyType = 'residential' | 'commercial' | 'fhl'

export interface Property {
  id: string
  user_id: string
  name: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postcode: string | null
  country: string
  property_type: PropertyType
  ownership_percentage: number
  ownership_start_date: string | null
  ownership_end_date: string | null
  has_mortgage: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PropertyFinanceCosts {
  id: string
  user_id: string
  property_id: string
  tax_year: string
  mortgage_interest: number
  other_finance_costs: number
  created_at: string
  updated_at: string
}

export interface PropertyBreakdown {
  propertyId: string
  propertyName: string
  income: number
  expenses: number
  financeCosts: number
  profit: number
}

export interface PropertyTaxSummary {
  totalRentalIncome: number
  totalAllowableExpenses: number
  expensesByCategory: Record<string, number>
  profitBeforeFinanceCosts: number
  totalFinanceCosts: number
  financeCostTaxCredit: number
  propertyAllowance: number
  usePropertyAllowance: boolean
  taxableProfit: number
  properties: PropertyBreakdown[]
}

export interface SA105Data {
  totalPropertyIncome: number
  totalPropertyExpenses: number
  taxableProfit: number
  financeCostsCurrentYear: number
  financeCostsBroughtForward: number
  totalFinanceCosts: number
  financeCostTaxCredit: number
  numberOfProperties: number
  usePropertyAllowance: boolean
}

// Use of Home types
export type HomeOfficeMethod = 'simplified' | 'actual' | 'none'

export interface UseOfHome {
  id: string
  user_id: string
  tax_year: string
  calculation_method: HomeOfficeMethod
  hours_per_week: number | null
  weeks_per_year: number
  total_rooms: number | null
  business_rooms: number
  cost_electricity: number
  cost_gas: number
  cost_water: number
  cost_council_tax: number
  cost_mortgage_interest: number
  cost_rent: number
  cost_insurance: number
  cost_broadband: number
  cost_repairs: number
  cost_other: number
  simplified_amount: number | null
  actual_amount: number | null
  recommended_method: string | null
  final_amount: number | null
  created_at: string
  updated_at: string
}

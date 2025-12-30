// Auth types
export interface TrueLayerTokens {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope?: string
}

export interface StoredConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string
  provider_id: string | null
  bank_name: string | null
  bank_id: string | null
  status: 'active' | 'expired' | 'revoked' | 'error'
  last_synced_at: string | null
  consent_expires_at: string | null
  scopes: string[]
  created_at: string
  updated_at: string
}

// Account types
export interface TrueLayerAccount {
  account_id: string
  account_type: 'TRANSACTION' | 'SAVINGS' | 'BUSINESS_TRANSACTION' | 'BUSINESS_SAVINGS'
  display_name: string
  currency: string
  account_number: {
    iban?: string
    swift_bic?: string
    number?: string
    sort_code?: string
  }
  provider: {
    provider_id: string
    display_name: string
    logo_uri?: string
  }
  update_timestamp: string
}

export interface TrueLayerBalance {
  currency: string
  available: number
  current: number
  overdraft?: number
  update_timestamp: string
}

// Transaction types
export interface TrueLayerTransaction {
  transaction_id: string
  timestamp: string
  description: string
  transaction_type: 'DEBIT' | 'CREDIT'
  transaction_category: string
  transaction_classification: string[]
  amount: number
  currency: string
  merchant_name?: string
  running_balance?: {
    currency: string
    amount: number
  }
  meta?: {
    provider_transaction_id?: string
    provider_category?: string
  }
}

// API Response types
export interface TrueLayerApiResponse<T> {
  results: T[]
  status: string
}

export interface TrueLayerError {
  error: string
  error_description?: string
  error_details?: {
    reason?: string
    [key: string]: unknown
  }
}

// Provider types (for bank selection)
export interface TrueLayerProvider {
  provider_id: string
  display_name: string
  logo_uri: string
  country: string
  scopes: string[]
}

// Database types
export interface BankAccount {
  id: string
  connection_id: string
  user_id: string
  account_id: string
  account_type: string | null
  display_name: string | null
  account_number_last4: string | null
  sort_code: string | null
  currency: string
  current_balance: number | null
  available_balance: number | null
  balance_updated_at: string | null
  last_transaction_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  connection?: {
    bank_name: string | null
    status: string
  }
}

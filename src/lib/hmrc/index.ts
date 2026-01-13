// HMRC API Module - Main Export
// Provides a unified interface for HMRC MTD API interactions
//
// This will be used for MTD ITSA quarterly submissions (mandatory from April 2026)
// For traditional SA100 annual filing, see the assessment app

// Re-export all HMRC modules
export * from './types'
export * from './client'
export * from './auth'
export * from './fraud-headers'
export * from './self-employment'
export * from './property'
export * from './calculations'
export * from './obligations'
export * from './test-users'

export const REFERRAL_CONFIG = {
  // Reward amounts
  rewards: {
    self_assessment: {
      label: 'Self Assessment',
      price: 89,
      referrerReward: 15,
      referredDiscount: 10,
    },
    premium_support: {
      label: 'Premium Support',
      price: 29,
      referrerReward: 5,
      referredDiscount: 0,
    },
  },

  // Payout settings
  payout: {
    minimumAmount: 20,
    processingDays: 5,
  },

  // Share messages
  shareMessages: {
    default:
      "I've been using TaxFolio for my Self Assessment - it's so much easier than doing it yourself! Use my code {CODE} to get £10 off.",
    twitter:
      'Filing my Self Assessment was painless with @TaxFolio! Use code {CODE} for £10 off',
    email: {
      subject: '£10 off your Self Assessment with TaxFolio',
      body: "Hey!\n\nI've been using TaxFolio to file my Self Assessment and it's been really easy. Thought you might find it useful too.\n\nUse my referral code {CODE} to get £10 off: {LINK}\n\nCheers!",
    },
  },

  // URLs
  urls: {
    referralLanding: 'https://taxfolio.io/ref',
    termsAndConditions: 'https://taxfolio.io/referral-terms',
  },
} as const

export type ProductType = keyof typeof REFERRAL_CONFIG.rewards

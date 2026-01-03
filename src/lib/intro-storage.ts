// Intro wizard storage utilities
// Manages session ID and data persistence across domains

const SESSION_KEY = 'taxfolio_intro_session';
const DATA_KEY = 'taxfolio_intro_data';

export interface IntroWizardData {
  sessionId: string;
  intent?: string;
  incomeSource?: string;
  filingExperience?: string;
  situation?: string;
  email?: string;
  marketingConsent?: boolean;
  startedAt?: string;
  completedAt?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  referrer?: string;
}

/**
 * Get or create session ID for intro wizard
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get stored intro wizard data
 */
export function getIntroData(): IntroWizardData | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(DATA_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save intro wizard data to localStorage
 */
export function saveIntroData(data: Partial<IntroWizardData>): IntroWizardData {
  if (typeof window === 'undefined') {
    return { sessionId: '' };
  }

  const existing = getIntroData() || { sessionId: getSessionId() };
  const updated: IntroWizardData = {
    ...existing,
    ...data,
    sessionId: existing.sessionId || getSessionId(),
  };

  localStorage.setItem(DATA_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Clear intro wizard data (after successful conversion)
 */
export function clearIntroData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(DATA_KEY);
  // Keep session ID for potential re-linking
}

/**
 * Build signup URL with session ID and optional email
 */
export function buildSignupUrl(email?: string): string {
  const sessionId = getSessionId();
  const params = new URLSearchParams({ intro_session: sessionId });

  if (email) {
    params.set('email', email);
  }

  // Use app.taxfolio.io for production, fallback to relative URL for dev
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/signup?${params.toString()}`;
}

/**
 * Build Google OAuth URL with session ID
 */
export function buildGoogleOAuthUrl(email?: string): string {
  const sessionId = getSessionId();
  const params = new URLSearchParams({ intro_session: sessionId });

  if (email) {
    params.set('email', email);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/api/auth/google?${params.toString()}`;
}

/**
 * Capture UTM parameters from URL
 */
export function captureUtmParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

/**
 * Income source to assessment categories mapping
 */
export const INCOME_SOURCE_MAPPING: Record<string, string[]> = {
  'self-employed': ['self-employment'],
  'landlord': ['rental'],
  'employed-side-income': ['employment', 'self-employment'],
  'director': ['employment', 'dividends'],
  'investor': ['dividends', 'interest', 'capital-gains'],
  'multiple': [], // User will need to select their own
};

/**
 * Experience level mapping
 */
export const EXPERIENCE_MAPPING: Record<string, 'beginner' | 'intermediate' | 'expert'> = {
  'first-time': 'beginner',
  'been-a-while': 'beginner',
  'every-year': 'intermediate',
  'use-accountant': 'intermediate',
};

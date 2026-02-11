import type { ClientDeviceInfo, FraudPreventionHeaders } from '@/types/mtd';

const TAXFOLIO_VERSION = '1.0.0';

/**
 * Generate a unique device ID (stored in localStorage for consistency)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const storageKey = 'taxfolio_device_id';
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    // Generate a UUID v4
    deviceId = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

/**
 * Collect device information from the browser
 * This is required by HMRC for fraud prevention
 */
export function collectDeviceInfo(): ClientDeviceInfo {
  if (typeof window === 'undefined') {
    // Return default values for server-side
    return {
      windowWidth: 0,
      windowHeight: 0,
      screenWidth: 0,
      screenHeight: 0,
      screenScalingFactor: 1,
      screenColourDepth: 24,
      timezone: 'UTC+00:00',
      userAgent: 'TaxFolio Server',
      plugins: [],
      deviceId: 'server-side',
    };
  }

  // Get browser plugins
  const plugins: string[] = [];
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (plugin.name) {
        plugins.push(plugin.name);
      }
    }
  }

  // Get timezone offset in HMRC format (e.g., "UTC+00:00" or "UTC-05:00")
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (absOffset % 60).toString().padStart(2, '0');
  const sign = offset <= 0 ? '+' : '-';
  const timezone = `UTC${sign}${hours}:${minutes}`;

  return {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenScalingFactor: window.devicePixelRatio || 1,
    screenColourDepth: window.screen.colorDepth,
    timezone,
    userAgent: navigator.userAgent,
    plugins,
    deviceId: getOrCreateDeviceId(),
  };
}

/**
 * Build HMRC fraud prevention headers from device info (client-side portion).
 * For WEB_APP_VIA_SERVER, Gov-Client-User-Agent is NOT used.
 * Instead, Gov-Client-Browser-JS-User-Agent carries the browser's navigator.userAgent.
 */
export function buildFraudPreventionHeaders(
  deviceInfo: ClientDeviceInfo,
  userId?: string
): Partial<FraudPreventionHeaders> {
  // Format plugins for HMRC (URL encoded, comma separated)
  const pluginsFormatted = deviceInfo.plugins
    .map((p) => encodeURIComponent(p))
    .join(',');

  // Build screen info string
  const screenInfo = `width=${deviceInfo.screenWidth}&height=${deviceInfo.screenHeight}&scaling-factor=${deviceInfo.screenScalingFactor}&colour-depth=${deviceInfo.screenColourDepth}`;

  // Build window size string
  const windowSize = `width=${deviceInfo.windowWidth}&height=${deviceInfo.windowHeight}`;

  const headers: Partial<FraudPreventionHeaders> = {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Device-ID': deviceInfo.deviceId || 'unknown',
    'Gov-Client-User-IDs': userId
      ? `taxfolio=${encodeURIComponent(userId)}`
      : '',
    'Gov-Client-Timezone': deviceInfo.timezone,
    'Gov-Client-Window-Size': windowSize,
    'Gov-Client-Browser-Plugins': pluginsFormatted || '',
    'Gov-Client-Screens': screenInfo,
    'Gov-Client-Browser-JS-User-Agent': encodeURIComponent(deviceInfo.userAgent),
    'Gov-Vendor-Version': `TaxFolio=${TAXFOLIO_VERSION}`,
    'Gov-Vendor-Product-Name': 'TaxFolio',
  };

  return headers;
}

/**
 * Add server-side fraud prevention headers that require request context.
 * These include client public IP (from X-Forwarded-For), timestamps,
 * and vendor (server) IP information.
 *
 * Call this in API routes and merge with client-sent headers before forwarding to HMRC.
 */
export function addServerSideFraudHeaders(
  headers: Headers,
  existingFraudHeaders: Partial<FraudPreventionHeaders>
): FraudPreventionHeaders {
  const result = { ...existingFraudHeaders };

  // Client public IP — extracted from proxy headers (Vercel sets X-Forwarded-For)
  const forwardedFor = headers.get('x-forwarded-for');
  const clientIp = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : headers.get('x-real-ip') || '';

  if (clientIp) {
    result['Gov-Client-Public-IP'] = clientIp;
    result['Gov-Client-Public-IP-Timestamp'] = new Date().toISOString();
  }

  // Client public port — Vercel doesn't expose this, but we can try
  // X-Forwarded-Port or leave empty (HMRC allows omission for private networks)
  const clientPort = headers.get('x-forwarded-port') || '';
  if (clientPort) {
    result['Gov-Client-Public-Port'] = clientPort;
  }

  // Vendor (server) public IP — use env var set in Vercel deployment
  const serverIp = process.env.VENDOR_PUBLIC_IP || '';
  if (serverIp) {
    result['Gov-Vendor-Public-IP'] = serverIp;
  }

  // Gov-Vendor-Forwarded — describes the network hops (by=server, for=client)
  if (clientIp) {
    const byPart = serverIp ? `by=${serverIp}` : '';
    const forPart = `for=${clientIp}`;
    result['Gov-Vendor-Forwarded'] = [byPart, forPart].filter(Boolean).join('&');
  }

  // Ensure Gov-Client-User-IDs is populated (use Supabase user ID if not set from client)
  // This is handled at the route level — just ensure it's not empty here

  return result as FraudPreventionHeaders;
}

/**
 * Validate that all required fraud prevention headers are present
 * Returns array of missing header names
 */
export function validateFraudHeaders(
  headers: Partial<FraudPreventionHeaders>
): string[] {
  const requiredHeaders: (keyof FraudPreventionHeaders)[] = [
    'Gov-Client-Connection-Method',
    'Gov-Client-Device-ID',
    'Gov-Client-Timezone',
    'Gov-Client-Window-Size',
    'Gov-Client-Screens',
    'Gov-Client-Browser-JS-User-Agent',
    'Gov-Vendor-Version',
    'Gov-Vendor-Product-Name',
    'Gov-Client-User-IDs',
  ];

  const missing: string[] = [];

  for (const header of requiredHeaders) {
    if (!headers[header]) {
      missing.push(header);
    }
  }

  return missing;
}

/**
 * Client-side hook to collect and store device info
 * Call this on page load to gather fraud prevention data
 */
export function useDeviceInfo(): {
  deviceInfo: ClientDeviceInfo | null;
  isLoading: boolean;
} {
  // This would be implemented as a React hook in the actual component
  // Here we just provide the utility functions

  if (typeof window === 'undefined') {
    return { deviceInfo: null, isLoading: true };
  }

  return { deviceInfo: collectDeviceInfo(), isLoading: false };
}

/**
 * Serialize device info to be stored in session/cookie
 */
export function serializeDeviceInfo(info: ClientDeviceInfo): string {
  return Buffer.from(JSON.stringify(info)).toString('base64');
}

/**
 * Deserialize device info from session/cookie
 */
export function deserializeDeviceInfo(serialized: string): ClientDeviceInfo {
  return JSON.parse(Buffer.from(serialized, 'base64').toString('utf-8'));
}

/**
 * Extract fraud headers from request for API route forwarding.
 * Reads all Gov-Client-* and Gov-Vendor-* headers sent by the client.
 */
export function extractFraudHeadersFromRequest(
  headers: Headers
): Partial<FraudPreventionHeaders> | undefined {
  const headerKeys: (keyof FraudPreventionHeaders)[] = [
    'Gov-Client-Connection-Method',
    'Gov-Client-Device-ID',
    'Gov-Client-User-IDs',
    'Gov-Client-Timezone',
    'Gov-Client-Window-Size',
    'Gov-Client-Browser-Plugins',
    'Gov-Client-Screens',
    'Gov-Client-Browser-JS-User-Agent',
    'Gov-Vendor-Version',
    'Gov-Vendor-Product-Name',
    'Gov-Vendor-License-IDs',
    'Gov-Client-Local-IPs',
    'Gov-Client-Local-IPs-Timestamp',
  ];

  const result: Partial<FraudPreventionHeaders> = {};
  let hasAny = false;

  for (const key of headerKeys) {
    const value = headers.get(key);
    if (value) {
      result[key] = value;
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
}

/**
 * Build headers object for fetch requests from client
 */
export function buildClientRequestHeaders(userId?: string): Record<string, string> {
  const deviceInfo = collectDeviceInfo();
  const fraudHeaders = buildFraudPreventionHeaders(deviceInfo, userId);

  return fraudHeaders as unknown as Record<string, string>;
}

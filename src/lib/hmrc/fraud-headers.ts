export interface ClientInfo {
  deviceId?: string
  screenWidth?: number
  screenHeight?: number
  windowWidth?: number
  windowHeight?: number
  timezone?: string
  userAgent?: string
  plugins?: string[]
  doNotTrack?: boolean
  localIPs?: string[]
}

/**
 * Generate fraud prevention headers for HMRC API calls
 * These are required by HMRC to detect fraud
 */
export function generateFraudHeaders(
  userId: string,
  clientInfo?: ClientInfo
): Record<string, string> {
  // Encode values as per HMRC spec
  const encode = (value: string) => encodeURIComponent(value)

  // Default client info for server-side calls
  const device = clientInfo?.deviceId || `taxfolio-${userId.slice(0, 8)}`
  const timezone = clientInfo?.timezone || 'UTC+00:00'
  const screenWidth = clientInfo?.screenWidth || 1920
  const screenHeight = clientInfo?.screenHeight || 1080
  const windowWidth = clientInfo?.windowWidth || 1920
  const windowHeight = clientInfo?.windowHeight || 900
  const userAgent = clientInfo?.userAgent || 'TaxFolio/1.0'

  return {
    'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
    'Gov-Client-Device-ID': device,
    'Gov-Client-User-IDs': `taxfolio=${encode(userId)}`,
    'Gov-Client-Timezone': timezone,
    'Gov-Client-Window-Size': `width=${windowWidth}&height=${windowHeight}`,
    'Gov-Client-Screens': `width=${screenWidth}&height=${screenHeight}&colour-depth=24`,
    'Gov-Client-User-Agent': encode(userAgent),
    'Gov-Vendor-Version': 'TaxFolio=1.0.0',
    'Gov-Vendor-License-IDs': 'TaxFolio=free',
    'Gov-Client-Browser-JS-User-Agent': encode(userAgent),
    'Gov-Client-Browser-Plugins': clientInfo?.plugins?.join(',') || '',
    'Gov-Client-Browser-Do-Not-Track': clientInfo?.doNotTrack ? 'true' : 'false',
    'Gov-Client-Local-IPs': clientInfo?.localIPs?.join(',') || '',
  }
}

/**
 * Collect client-side fraud prevention data
 * Call this on the client and pass to API routes
 */
export function collectClientInfo(): ClientInfo {
  if (typeof window === 'undefined') return {}

  // Generate or retrieve device ID
  let deviceId = localStorage.getItem('taxfolio-device-id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('taxfolio-device-id', deviceId)
  }

  return {
    deviceId,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name),
    doNotTrack: navigator.doNotTrack === '1',
  }
}

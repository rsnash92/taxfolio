import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.PRACTICE_ENCRYPTION_KEY
  if (!key) {
    throw new Error('PRACTICE_ENCRYPTION_KEY environment variable is required')
  }
  // Key must be 32 bytes (256 bits) — accept hex-encoded or base64
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  const buf = Buffer.from(key, 'base64')
  if (buf.length !== 32) {
    throw new Error('PRACTICE_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars)')
  }
  return buf
}

/**
 * Encrypt a NINO using AES-256-GCM.
 * Returns a string: base64(iv + ciphertext + authTag)
 */
export function encryptNINO(nino: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(nino, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, encrypted, tag]).toString('base64')
}

/**
 * Decrypt a NINO from the encrypted format.
 */
export function decryptNINO(encryptedBase64: string): string {
  const key = getEncryptionKey()
  const data = Buffer.from(encryptedBase64, 'base64')
  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(data.length - TAG_LENGTH)
  const ciphertext = data.subarray(IV_LENGTH, data.length - TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(ciphertext) + decipher.final('utf8')
}

/**
 * Mask a NINO for display: "AB123456C" → "AB****56C"
 */
export function maskNINO(nino: string): string {
  if (nino.length < 9) return '****'
  return nino.slice(0, 2) + '****' + nino.slice(6)
}

/**
 * Extract the last 4 characters of a NINO for storage as nino_last4.
 * Used for partial display without decryption: "456C" from "AB123456C"
 */
export function ninoLast4(nino: string): string {
  return nino.slice(-4)
}

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

function getMasterKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey || hexKey.length < 64) {
    throw new Error(
      'ENCRYPTION_KEY belum dikonfigurasi atau panjangnya kurang dari 32 bytes hex string (64 hex characters).'
    );
  }
  return Buffer.from(hexKey, 'hex');
}

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

/**
 * Authenticated Encryption using AES-256-GCM
 */
export function encryptSecret(plainText: string): EncryptedData {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Authenticated Decryption using AES-256-GCM
 */
export function decryptSecret(encrypted: EncryptedData): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask secret for safe display in Admin UI (e.g. sk-...abcd)
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return 'Belum dikonfigurasi';
  if (secret.length <= 8) return '••••••••';
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

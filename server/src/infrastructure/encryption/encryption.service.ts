import crypto from 'crypto';

// ─── Encryption Configuration ─────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Encryption Security Module
 *
 * Provides encryption at rest for sensitive student data fields (PII).
 * Uses AES-256-GCM for authenticated encryption.
 */
export class EncryptionService {
  private key: Buffer;

  constructor(encryptionKey?: string) {
    const keySource = encryptionKey || process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-key-change-in-production';
    // Derive a consistent 32-byte key from the source
    this.key = crypto.scryptSync(keySource, 'atlas-salt', KEY_LENGTH);
  }

  /**
   * Encrypt a plaintext string.
   * Returns a base64-encoded string containing IV + auth tag + ciphertext.
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Combine: IV (16) + AuthTag (16) + Ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypt a base64-encoded encrypted string.
   */
  decrypt(encryptedBase64: string): string {
    const combined = Buffer.from(encryptedBase64, 'base64');

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * Hash a value for indexing (deterministic, one-way).
   */
  hash(value: string): string {
    return crypto.createHmac('sha256', this.key).update(value).digest('hex');
  }

  /**
   * Generate a cryptographically secure random token.
   */
  static generateToken(length: number = SALT_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

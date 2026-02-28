/**
 * Module 21: Encryption Security Module
 *
 * Provides encryption at rest and in transit, key management, and cryptographic
 * audit logging for FERPA-protected student data.
 *
 * Cross-References:
 *   - Student Information Management System (supporting operational requirements)
 *   - Staff Scheduling Coordinator (design of operational requirements)
 *   - Real-time Alert System (implementation of operational requirements)
 *   - Mobile Support Module (operational concerns)
 *
 * Functional Themes: operational, security, scalability, reliability, core, integration
 */

import crypto from 'crypto';
import {
  EncryptionAlgorithm,
  EncryptionConfig,
  EncryptedPayload,
  KeyMetadata,
  EncryptionAuditEntry,
} from './types';

// ─── Encryption Security Service ──────────────────────────────────────

export class EncryptionSecurityService {
  private readonly config: EncryptionConfig;
  private keys = new Map<string, { key: Buffer; metadata: KeyMetadata }>();
  private activeKeyId: string;
  private auditLog: EncryptionAuditEntry[] = [];
  private readonly maxAuditEntries: number;

  constructor() {
    this.config = {
      algorithm: (process.env.ENCRYPTION_ALGORITHM as EncryptionAlgorithm) || 'aes-256-gcm',
      keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS || '90', 10),
      transitEncryption: true,
      atRestEncryption: true,
    };
    this.maxAuditEntries = parseInt(process.env.ENCRYPTION_AUDIT_MAX || '10000', 10);
    this.activeKeyId = this.generateKey();
  }

  /**
   * Encrypt data using the active encryption key.
   * All PII and FERPA-protected data must pass through this method before storage.
   */
  encrypt(plaintext: string, entityType: string, entityId: string, performedBy: string): EncryptedPayload {
    const keyEntry = this.keys.get(this.activeKeyId);
    if (!keyEntry) {
      throw new Error('No active encryption key available');
    }

    const iv = crypto.randomBytes(16);
    let ciphertext: string;
    let authTag: string;

    if (this.config.algorithm === 'aes-256-gcm') {
      const cipher = crypto.createCipheriv('aes-256-gcm', keyEntry.key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      ciphertext = encrypted.toString('base64');
      authTag = cipher.getAuthTag().toString('base64');
    } else {
      // AES-256-CBC fallback
      const cipher = crypto.createCipheriv('aes-256-cbc', keyEntry.key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      ciphertext = encrypted.toString('base64');
      authTag = '';
    }

    keyEntry.metadata.usageCount++;

    this.recordAudit('encrypt', this.activeKeyId, entityType, entityId, true, performedBy);

    return {
      ciphertext,
      iv: iv.toString('base64'),
      authTag,
      algorithm: this.config.algorithm,
      keyId: this.activeKeyId,
    };
  }

  /**
   * Decrypt an encrypted payload.
   */
  decrypt(payload: EncryptedPayload, entityType: string, entityId: string, performedBy: string): string {
    const keyEntry = this.keys.get(payload.keyId);
    if (!keyEntry) {
      this.recordAudit('decrypt', payload.keyId, entityType, entityId, false, performedBy);
      throw new Error(`Encryption key ${payload.keyId} not found`);
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const ciphertextBuf = Buffer.from(payload.ciphertext, 'base64');

    let plaintext: string;

    try {
      if (payload.algorithm === 'aes-256-gcm') {
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyEntry.key, iv);
        decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
        plaintext = decipher.update(ciphertextBuf).toString('utf8') + decipher.final('utf8');
      } else {
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyEntry.key, iv);
        plaintext = decipher.update(ciphertextBuf).toString('utf8') + decipher.final('utf8');
      }
    } catch (error) {
      this.recordAudit('decrypt', payload.keyId, entityType, entityId, false, performedBy);
      throw new Error('Decryption failed: data may be tampered with');
    }

    this.recordAudit('decrypt', payload.keyId, entityType, entityId, true, performedBy);
    return plaintext;
  }

  /**
   * Generate a cryptographic hash of sensitive data for comparison without decryption.
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate an HMAC for data integrity verification.
   */
  hmac(data: string, purpose: string): string {
    const keyEntry = this.keys.get(this.activeKeyId);
    if (!keyEntry) {
      throw new Error('No active encryption key available');
    }

    return crypto
      .createHmac('sha256', keyEntry.key)
      .update(`${purpose}:${data}`)
      .digest('hex');
  }

  /**
   * Rotate encryption keys. Old keys are retained for decryption of existing data.
   */
  rotateKeys(performedBy: string): { oldKeyId: string; newKeyId: string } {
    const oldKeyId = this.activeKeyId;
    const oldKeyEntry = this.keys.get(oldKeyId);

    if (oldKeyEntry) {
      oldKeyEntry.metadata.status = 'rotating';
    }

    const newKeyId = this.generateKey();
    this.activeKeyId = newKeyId;

    if (oldKeyEntry) {
      oldKeyEntry.metadata.status = 'expired';
    }

    this.recordAudit('key_rotation', newKeyId, 'system', 'key_rotation', true, performedBy);

    console.log(`[Encryption] Key rotated: ${oldKeyId} -> ${newKeyId}`);

    return { oldKeyId, newKeyId };
  }

  /**
   * Get metadata for all managed keys.
   */
  getKeyMetadata(): KeyMetadata[] {
    return Array.from(this.keys.values()).map((entry) => ({ ...entry.metadata }));
  }

  /**
   * Get current encryption configuration.
   */
  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  /**
   * Get the encryption audit log.
   */
  getAuditLog(limit = 100): EncryptionAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Check if a key rotation is needed based on the configured rotation period.
   */
  isKeyRotationNeeded(): boolean {
    const keyEntry = this.keys.get(this.activeKeyId);
    if (!keyEntry) return true;

    const expiresAt = new Date(keyEntry.metadata.expiresAt).getTime();
    return Date.now() >= expiresAt;
  }

  /**
   * Generate a secure random token (for CSRF, session tokens, etc.).
   */
  generateSecureToken(lengthBytes = 32): string {
    return crypto.randomBytes(lengthBytes).toString('hex');
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private generateKey(): string {
    const keyId = `key-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const key = process.env.ENCRYPTION_MASTER_KEY
      ? crypto.scryptSync(process.env.ENCRYPTION_MASTER_KEY, keyId, 32)
      : crypto.randomBytes(32);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.config.keyRotationDays);

    const metadata: KeyMetadata = {
      id: keyId,
      algorithm: this.config.algorithm,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      usageCount: 0,
    };

    this.keys.set(keyId, { key, metadata });
    this.recordAudit('key_generation', keyId, 'system', 'key_generation', true, 'system');

    return keyId;
  }

  private recordAudit(
    operation: EncryptionAuditEntry['operation'],
    keyId: string,
    entityType: string,
    entityId: string,
    success: boolean,
    performedBy: string
  ): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      operation,
      keyId,
      entityType,
      entityId,
      success,
      performedBy,
    });

    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const encryptionService = new EncryptionSecurityService();

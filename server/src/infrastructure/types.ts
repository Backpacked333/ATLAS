/**
 * ATLAS Infrastructure — Shared Types
 *
 * Type definitions used across Modules 19–25 (Infrastructure, Operations & Appendices).
 * Provides interfaces for performance, disaster recovery, encryption, multi-tenancy,
 * authentication/authorization, backup, and monitoring/alerting subsystems.
 */

// ─── Module 19: Performance Optimization ──────────────────────────────

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
  evictions: number;
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  rowCount: number;
  cached: boolean;
}

export interface PerformanceReport {
  timestamp: string;
  cache: CacheStats;
  queries: {
    totalExecuted: number;
    averageDuration: number;
    slowQueries: QueryMetrics[];
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  uptime: number;
}

// ─── Module 20: Disaster Recovery ─────────────────────────────────────

export type DRStatus = 'healthy' | 'degraded' | 'failover_active' | 'recovering';

export interface FailoverEvent {
  id: string;
  timestamp: string;
  fromNode: string;
  toNode: string;
  reason: string;
  durationMs: number;
  status: 'completed' | 'failed' | 'in_progress';
}

export interface DRHealthCheck {
  status: DRStatus;
  primaryNode: NodeHealth;
  replicaNodes: NodeHealth[];
  lastFailoverEvent: FailoverEvent | null;
  rpo: number; // Recovery Point Objective in seconds
  rto: number; // Recovery Time Objective in seconds
}

export interface NodeHealth {
  id: string;
  host: string;
  role: 'primary' | 'replica' | 'standby';
  status: 'online' | 'offline' | 'syncing';
  lastHeartbeat: string;
  replicationLag: number;
  connections: number;
  maxConnections: number;
}

export interface RecoveryPlan {
  id: string;
  name: string;
  steps: RecoveryStep[];
  estimatedRtoMinutes: number;
  lastTested: string | null;
  status: 'ready' | 'needs_review' | 'in_progress';
}

export interface RecoveryStep {
  order: number;
  action: string;
  description: string;
  automated: boolean;
  estimatedDurationSeconds: number;
  dependencies: number[];
}

// ─── Module 21: Encryption Security ──────────────────────────────────

export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';

export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm;
  keyRotationDays: number;
  transitEncryption: boolean;
  atRestEncryption: boolean;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: EncryptionAlgorithm;
  keyId: string;
}

export interface KeyMetadata {
  id: string;
  algorithm: EncryptionAlgorithm;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'rotating' | 'expired' | 'revoked';
  usageCount: number;
}

export interface EncryptionAuditEntry {
  timestamp: string;
  operation: 'encrypt' | 'decrypt' | 'key_rotation' | 'key_generation';
  keyId: string;
  entityType: string;
  entityId: string;
  success: boolean;
  performedBy: string;
}

// ─── Module 22: Multi-Tenancy Framework ──────────────────────────────

export interface TenantContext {
  tenantId: string;
  districtId: string;
  schoolId: string;
  tenantName: string;
  tier: TenantTier;
  config: TenantConfig;
}

export type TenantTier = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface TenantConfig {
  maxUsers: number;
  maxStudents: number;
  maxStorageGb: number;
  features: string[];
  customBranding: boolean;
  apiRateLimit: number;
  dataRetentionDays: number;
}

export interface TenantUsage {
  tenantId: string;
  activeUsers: number;
  totalStudents: number;
  storageUsedGb: number;
  apiCallsToday: number;
  lastActivity: string;
}

export interface TenantIsolationReport {
  tenantId: string;
  timestamp: string;
  queriesAudited: number;
  crossTenantViolations: number;
  isolationScore: number; // 0-100
  details: string[];
}

// ─── Module 23: Authentication & Authorization ───────────────────────

export type UserRole = 'teacher' | 'counselor' | 'admin' | 'district_admin' | 'system_admin';

export interface Permission {
  resource: string;
  actions: ('read' | 'create' | 'update' | 'delete')[];
  conditions?: Record<string, string>;
}

export interface RoleDefinition {
  role: UserRole;
  displayName: string;
  permissions: Permission[];
  inheritsFrom?: UserRole;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  role: UserRole;
  tenantId: string;
  issuedAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  mfaVerified: boolean;
}

export interface AuthAuditEntry {
  timestamp: string;
  userId: string;
  action: 'login' | 'logout' | 'token_refresh' | 'mfa_challenge' | 'password_reset' | 'permission_denied';
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: string;
}

// ─── Module 24: Backup Recovery ──────────────────────────────────────

export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'verified';

export interface BackupJob {
  id: string;
  type: BackupType;
  status: BackupStatus;
  startedAt: string;
  completedAt: string | null;
  sizeBytes: number;
  durationMs: number;
  location: string;
  encryptionKeyId: string;
  checksumSha256: string;
  tenantScope: string | null; // null = all tenants
}

export interface BackupSchedule {
  id: string;
  name: string;
  cronExpression: string;
  type: BackupType;
  retentionDays: number;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
}

export interface RestoreRequest {
  backupId: string;
  targetEnvironment: 'production' | 'staging' | 'development';
  scope: 'full' | 'tenant' | 'table';
  tenantId?: string;
  tables?: string[];
  dryRun: boolean;
}

export interface RestoreResult {
  requestId: string;
  backupId: string;
  status: 'completed' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string;
  recordsRestored: number;
  errors: string[];
  verificationPassed: boolean;
}

// ─── Module 25: Monitoring & Alerting ────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface SystemMetric {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'absent';
  threshold: number;
  durationSeconds: number;
  severity: AlertSeverity;
  enabled: boolean;
  notificationChannels: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  firedAt: string;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
  status: 'firing' | 'acknowledged' | 'resolved';
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  lastCheck: string;
  details: Record<string, unknown>;
}

export interface SystemHealthReport {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthStatus[];
  activeAlerts: Alert[];
  metrics: {
    requestsPerSecond: number;
    averageResponseMs: number;
    errorRate: number;
    activeConnections: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    diskUsagePercent: number;
  };
}

// ─── Appendices: Cross-Module References ─────────────────────────────

export interface ModuleDefinition {
  id: number;
  name: string;
  themes: string[];
  referencesTo: string[];
  referencedBy: string[];
  subsections: {
    name: string;
    referencedComponent: string;
    role: string;
  }[];
}

export interface AppendixEntry {
  id: string;
  title: string;
  description: string;
  applicableModules: number[];
  crossCuttingRequirements: string[];
}

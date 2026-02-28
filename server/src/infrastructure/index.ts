/**
 * ATLAS Infrastructure — Barrel Export
 *
 * Modules 19–25: Infrastructure, Operations & Appendices
 * Centralizes exports for all infrastructure services.
 */

// Module 19: Performance Optimization
export { performanceService, CacheManager, QueryPerformanceTracker, PerformanceOptimizationService } from './performance.service';

// Module 20: Disaster Recovery
export { disasterRecoveryService, DisasterRecoveryService } from './disaster-recovery.service';

// Module 21: Encryption Security
export { encryptionService, EncryptionSecurityService } from './encryption.service';

// Module 22: Multi-Tenancy Framework
export { multiTenancyService, MultiTenancyService, tenantIsolation } from './multi-tenancy.service';

// Module 23: Authentication & Authorization
export { authorizationService, AuthorizationService } from './authorization.service';

// Module 24: Backup Recovery
export { backupService, BackupRecoveryService } from './backup.service';

// Module 25: Monitoring & Alerting
export { monitoringService, MonitoringAlertingService, MetricCollector, AlertManager } from './monitoring.service';

// Shared Types
export type * from './types';

// Appendices
export { appendices, moduleRegistry, crossReferenceIndex } from './appendices';

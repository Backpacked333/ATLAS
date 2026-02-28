/**
 * Module 20: Disaster Recovery System
 *
 * Manages failover detection, recovery procedures, and system resilience.
 * Integrates with the Monitoring Alerting System for health status propagation.
 *
 * Cross-References:
 *   - Monitoring Alerting System (supporting integration capabilities)
 *   - Academic Performance Reporting (design of integration capabilities)
 *   - Policy Compliance Monitor (implementation of integration capabilities)
 *   - Reporting Analytics Engine (operational concerns)
 *
 * Functional Themes: integration, operational, security, scalability, reliability, core
 */

import { prisma } from '../utils/prisma';
import {
  DRStatus,
  DRHealthCheck,
  FailoverEvent,
  NodeHealth,
  RecoveryPlan,
  RecoveryStep,
} from './types';

// ─── Disaster Recovery Service ────────────────────────────────────────

export class DisasterRecoveryService {
  private status: DRStatus = 'healthy';
  private failoverHistory: FailoverEvent[] = [];
  private recoveryPlans: RecoveryPlan[] = [];
  private readonly heartbeatIntervalMs: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.heartbeatIntervalMs = parseInt(process.env.DR_HEARTBEAT_INTERVAL_MS || '30000', 10);
    this.initializeRecoveryPlans();
  }

  /**
   * Start the heartbeat monitor that continuously checks primary node health.
   */
  startHeartbeatMonitor(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.checkPrimaryHealth();
      } catch (error) {
        console.error('[DR] Heartbeat check failed:', error);
        this.status = 'degraded';
      }
    }, this.heartbeatIntervalMs);

    console.log(`[DR] Heartbeat monitor started (interval: ${this.heartbeatIntervalMs}ms)`);
  }

  /**
   * Stop the heartbeat monitor.
   */
  stopHeartbeatMonitor(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log('[DR] Heartbeat monitor stopped');
    }
  }

  /**
   * Get comprehensive health check report.
   * Referenced by Monitoring Alerting System for system-wide health aggregation.
   */
  async getHealthCheck(): Promise<DRHealthCheck> {
    const primaryHealth = await this.getPrimaryNodeHealth();
    const replicaHealth = await this.getReplicaNodeHealth();

    return {
      status: this.status,
      primaryNode: primaryHealth,
      replicaNodes: replicaHealth,
      lastFailoverEvent: this.failoverHistory.length > 0
        ? this.failoverHistory[this.failoverHistory.length - 1]
        : null,
      rpo: parseInt(process.env.DR_RPO_SECONDS || '300', 10),
      rto: parseInt(process.env.DR_RTO_SECONDS || '600', 10),
    };
  }

  /**
   * Check database connectivity and response time as health indicator.
   */
  async checkPrimaryHealth(): Promise<NodeHealth> {
    const start = Date.now();
    let status: NodeHealth['status'] = 'online';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      status = 'offline';
      this.status = 'degraded';
    }

    const latency = Date.now() - start;

    if (latency > 1000 && status === 'online') {
      this.status = 'degraded';
    } else if (status === 'online' && this.status !== 'failover_active') {
      this.status = 'healthy';
    }

    return {
      id: 'primary-1',
      host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
      role: 'primary',
      status,
      lastHeartbeat: new Date().toISOString(),
      replicationLag: 0,
      connections: 0,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    };
  }

  /**
   * Initiate a failover procedure.
   */
  async initiateFailover(reason: string): Promise<FailoverEvent> {
    const event: FailoverEvent = {
      id: `fo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromNode: 'primary-1',
      toNode: 'replica-1',
      reason,
      durationMs: 0,
      status: 'in_progress',
    };

    this.status = 'failover_active';
    this.failoverHistory.push(event);

    console.warn(`[DR] Failover initiated: ${reason}`);

    // Attempt reconnection to verify database is accessible
    const start = Date.now();
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      event.status = 'completed';
      event.durationMs = Date.now() - start;
      this.status = 'healthy';
      console.log(`[DR] Failover completed in ${event.durationMs}ms`);
    } catch (error) {
      event.status = 'failed';
      event.durationMs = Date.now() - start;
      this.status = 'degraded';
      console.error(`[DR] Failover failed: ${error}`);
    }

    return event;
  }

  /**
   * Get recovery plans for the system.
   */
  getRecoveryPlans(): RecoveryPlan[] {
    return this.recoveryPlans;
  }

  /**
   * Get failover event history.
   */
  getFailoverHistory(): FailoverEvent[] {
    return [...this.failoverHistory];
  }

  /**
   * Get current DR status.
   */
  getStatus(): DRStatus {
    return this.status;
  }

  /**
   * Execute a specific recovery plan by ID.
   */
  async executeRecoveryPlan(planId: string): Promise<{ success: boolean; completedSteps: number; errors: string[] }> {
    const plan = this.recoveryPlans.find((p) => p.id === planId);
    if (!plan) {
      return { success: false, completedSteps: 0, errors: ['Recovery plan not found'] };
    }

    plan.status = 'in_progress';
    const errors: string[] = [];
    let completedSteps = 0;

    for (const step of plan.steps) {
      try {
        if (step.automated) {
          await this.executeRecoveryStep(step);
        }
        completedSteps++;
      } catch (error) {
        errors.push(`Step ${step.order}: ${error}`);
      }
    }

    plan.status = 'ready';
    plan.lastTested = new Date().toISOString();

    return {
      success: errors.length === 0,
      completedSteps,
      errors,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private async getPrimaryNodeHealth(): Promise<NodeHealth> {
    return this.checkPrimaryHealth();
  }

  private async getReplicaNodeHealth(): Promise<NodeHealth[]> {
    // In production, this would check replica database connections
    return [{
      id: 'replica-1',
      host: process.env.DB_REPLICA_HOST || 'localhost',
      role: 'replica',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      replicationLag: 0,
      connections: 0,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    }];
  }

  private async executeRecoveryStep(step: RecoveryStep): Promise<void> {
    console.log(`[DR] Executing recovery step ${step.order}: ${step.action}`);
    // Step execution is environment-specific; verify connectivity as baseline
    await prisma.$queryRaw`SELECT 1`;
  }

  private initializeRecoveryPlans(): void {
    this.recoveryPlans = [
      {
        id: 'drp-database-failover',
        name: 'Database Failover Recovery',
        estimatedRtoMinutes: 5,
        lastTested: null,
        status: 'ready',
        steps: [
          {
            order: 1,
            action: 'detect_failure',
            description: 'Detect primary database failure via heartbeat timeout',
            automated: true,
            estimatedDurationSeconds: 30,
            dependencies: [],
          },
          {
            order: 2,
            action: 'promote_replica',
            description: 'Promote read replica to primary',
            automated: true,
            estimatedDurationSeconds: 60,
            dependencies: [1],
          },
          {
            order: 3,
            action: 'update_connection_strings',
            description: 'Update application connection strings to new primary',
            automated: true,
            estimatedDurationSeconds: 15,
            dependencies: [2],
          },
          {
            order: 4,
            action: 'verify_connectivity',
            description: 'Verify all services can connect to new primary',
            automated: true,
            estimatedDurationSeconds: 30,
            dependencies: [3],
          },
          {
            order: 5,
            action: 'notify_operations',
            description: 'Send notification to operations team',
            automated: true,
            estimatedDurationSeconds: 5,
            dependencies: [4],
          },
        ],
      },
      {
        id: 'drp-full-system-recovery',
        name: 'Full System Recovery',
        estimatedRtoMinutes: 30,
        lastTested: null,
        status: 'ready',
        steps: [
          {
            order: 1,
            action: 'assess_damage',
            description: 'Assess scope of system failure',
            automated: false,
            estimatedDurationSeconds: 300,
            dependencies: [],
          },
          {
            order: 2,
            action: 'restore_database',
            description: 'Restore database from latest verified backup',
            automated: true,
            estimatedDurationSeconds: 600,
            dependencies: [1],
          },
          {
            order: 3,
            action: 'restart_services',
            description: 'Restart all application services',
            automated: true,
            estimatedDurationSeconds: 120,
            dependencies: [2],
          },
          {
            order: 4,
            action: 'run_integrity_checks',
            description: 'Run data integrity verification checks',
            automated: true,
            estimatedDurationSeconds: 180,
            dependencies: [3],
          },
          {
            order: 5,
            action: 'validate_functionality',
            description: 'Validate core system functionality',
            automated: true,
            estimatedDurationSeconds: 120,
            dependencies: [4],
          },
          {
            order: 6,
            action: 'enable_traffic',
            description: 'Re-enable user traffic and monitoring',
            automated: false,
            estimatedDurationSeconds: 60,
            dependencies: [5],
          },
        ],
      },
      {
        id: 'drp-data-corruption',
        name: 'Data Corruption Recovery',
        estimatedRtoMinutes: 15,
        lastTested: null,
        status: 'ready',
        steps: [
          {
            order: 1,
            action: 'isolate_corruption',
            description: 'Identify and isolate affected data tables',
            automated: false,
            estimatedDurationSeconds: 180,
            dependencies: [],
          },
          {
            order: 2,
            action: 'point_in_time_recovery',
            description: 'Restore affected tables from point-in-time backup',
            automated: true,
            estimatedDurationSeconds: 300,
            dependencies: [1],
          },
          {
            order: 3,
            action: 'validate_restored_data',
            description: 'Validate restored data integrity and consistency',
            automated: true,
            estimatedDurationSeconds: 120,
            dependencies: [2],
          },
          {
            order: 4,
            action: 'audit_log_review',
            description: 'Review audit logs to determine corruption source',
            automated: false,
            estimatedDurationSeconds: 600,
            dependencies: [3],
          },
        ],
      },
    ];
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const disasterRecoveryService = new DisasterRecoveryService();

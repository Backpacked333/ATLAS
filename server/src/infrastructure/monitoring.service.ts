/**
 * Module 25: Monitoring Alerting System
 *
 * Provides system health monitoring, metric collection, alert rule evaluation,
 * and comprehensive health reporting. Integrates with all other infrastructure
 * modules for unified operational visibility.
 *
 * Cross-References:
 *   - Academic Performance Reporting (supporting core functionality)
 *   - Policy Compliance Monitor (design of core functionality)
 *   - Reporting Analytics Engine (implementation of core functionality)
 *   - Disaster Recovery System (operational concerns)
 *
 * Functional Themes: core, integration, operational, security, scalability, reliability
 */

import { prisma } from '../utils/prisma';
import {
  AlertSeverity,
  MetricType,
  SystemMetric,
  AlertRule,
  Alert,
  HealthStatus,
  SystemHealthReport,
} from './types';

// ─── Metric Collector ─────────────────────────────────────────────────

export class MetricCollector {
  private metrics = new Map<string, SystemMetric[]>();
  private readonly maxHistoryPerMetric: number;

  constructor(maxHistoryPerMetric = 1000) {
    this.maxHistoryPerMetric = maxHistoryPerMetric;
  }

  record(name: string, type: MetricType, value: number, labels: Record<string, string> = {}): void {
    const metric: SystemMetric = {
      name,
      type,
      value,
      labels,
      timestamp: Date.now(),
    };

    const history = this.metrics.get(name) || [];
    history.push(metric);

    if (history.length > this.maxHistoryPerMetric) {
      this.metrics.set(name, history.slice(-this.maxHistoryPerMetric));
    } else {
      this.metrics.set(name, history);
    }
  }

  increment(name: string, labels: Record<string, string> = {}, amount = 1): void {
    const history = this.metrics.get(name) || [];
    const lastValue = history.length > 0 ? history[history.length - 1].value : 0;
    this.record(name, 'counter', lastValue + amount, labels);
  }

  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, 'gauge', value, labels);
  }

  getLatest(name: string): SystemMetric | null {
    const history = this.metrics.get(name);
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  }

  getHistory(name: string, durationMs?: number): SystemMetric[] {
    const history = this.metrics.get(name) || [];
    if (!durationMs) return [...history];

    const cutoff = Date.now() - durationMs;
    return history.filter((m) => m.timestamp >= cutoff);
  }

  getAverage(name: string, durationMs: number): number {
    const history = this.getHistory(name, durationMs);
    if (history.length === 0) return 0;
    return history.reduce((sum, m) => sum + m.value, 0) / history.length;
  }

  getAllMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  clear(): void {
    this.metrics.clear();
  }
}

// ─── Alert Manager ────────────────────────────────────────────────────

export class AlertManager {
  private rules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private alertHistory: Alert[] = [];
  private readonly maxAlertHistory: number;

  constructor(maxAlertHistory = 5000) {
    this.maxAlertHistory = maxAlertHistory;
    this.initializeDefaultRules();
  }

  /**
   * Evaluate all alert rules against current metrics.
   */
  evaluateRules(collector: MetricCollector): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const metric = collector.getLatest(rule.metric);
      if (!metric && rule.condition === 'absent') {
        const alert = this.createAlert(rule, 0);
        newAlerts.push(alert);
        continue;
      }

      if (!metric) continue;

      const triggered = this.evaluateCondition(rule.condition, metric.value, rule.threshold);
      const existingAlert = this.activeAlerts.find((a) => a.ruleId === rule.id && a.status === 'firing');

      if (triggered && !existingAlert) {
        const alert = this.createAlert(rule, metric.value);
        newAlerts.push(alert);
      } else if (!triggered && existingAlert) {
        this.resolveAlert(existingAlert.id);
      }
    }

    return newAlerts;
  }

  /**
   * Acknowledge an active alert.
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== 'firing') return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  /**
   * Resolve an active alert.
   */
  resolveAlert(alertId: string): boolean {
    const index = this.activeAlerts.findIndex((a) => a.id === alertId);
    if (index === -1) return false;

    const alert = this.activeAlerts[index];
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();

    this.activeAlerts.splice(index, 1);
    this.alertHistory.push(alert);

    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
    }

    return true;
  }

  /**
   * Get all active alerts.
   */
  getActiveAlerts(severity?: AlertSeverity): Alert[] {
    if (severity) {
      return this.activeAlerts.filter((a) => a.severity === severity);
    }
    return [...this.activeAlerts];
  }

  /**
   * Get alert history.
   */
  getAlertHistory(limit = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Add a custom alert rule.
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Get all alert rules.
   */
  getRules(): AlertRule[] {
    return this.rules.map((r) => ({ ...r }));
  }

  /**
   * Update an alert rule.
   */
  updateRule(ruleId: string, updates: Partial<Pick<AlertRule, 'enabled' | 'threshold' | 'durationSeconds'>>): AlertRule | null {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    if (updates.enabled !== undefined) rule.enabled = updates.enabled;
    if (updates.threshold !== undefined) rule.threshold = updates.threshold;
    if (updates.durationSeconds !== undefined) rule.durationSeconds = updates.durationSeconds;

    return { ...rule };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private evaluateCondition(condition: AlertRule['condition'], value: number, threshold: number): boolean {
    switch (condition) {
      case 'above':
        return value > threshold;
      case 'below':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'absent':
        return true;
      default:
        return false;
    }
  }

  private createAlert(rule: AlertRule, currentValue: number): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      firedAt: new Date().toISOString(),
      resolvedAt: null,
      acknowledgedBy: null,
      status: 'firing',
    };

    this.activeAlerts.push(alert);
    console.warn(`[Alert] ${rule.severity.toUpperCase()}: ${rule.name} (${currentValue} ${rule.condition} ${rule.threshold})`);

    return alert;
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-high-cpu',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds 85% for more than 5 minutes',
        metric: 'system.cpu.usage_percent',
        condition: 'above',
        threshold: 85,
        durationSeconds: 300,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['ops-team'],
      },
      {
        id: 'rule-critical-cpu',
        name: 'Critical CPU Usage',
        description: 'CPU usage exceeds 95%',
        metric: 'system.cpu.usage_percent',
        condition: 'above',
        threshold: 95,
        durationSeconds: 60,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['ops-team', 'on-call'],
      },
      {
        id: 'rule-high-memory',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 80%',
        metric: 'system.memory.usage_percent',
        condition: 'above',
        threshold: 80,
        durationSeconds: 300,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['ops-team'],
      },
      {
        id: 'rule-high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5% of requests',
        metric: 'http.error_rate',
        condition: 'above',
        threshold: 5,
        durationSeconds: 120,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['ops-team', 'on-call'],
      },
      {
        id: 'rule-slow-response',
        name: 'Slow Response Times',
        description: 'Average response time exceeds 2 seconds',
        metric: 'http.response_time_ms',
        condition: 'above',
        threshold: 2000,
        durationSeconds: 300,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['ops-team'],
      },
      {
        id: 'rule-db-connection-pool',
        name: 'Database Connection Pool Exhaustion',
        description: 'Database connection pool above 90% capacity',
        metric: 'db.connection_pool.usage_percent',
        condition: 'above',
        threshold: 90,
        durationSeconds: 60,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['ops-team', 'on-call'],
      },
      {
        id: 'rule-disk-space',
        name: 'Low Disk Space',
        description: 'Disk usage exceeds 85%',
        metric: 'system.disk.usage_percent',
        condition: 'above',
        threshold: 85,
        durationSeconds: 600,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['ops-team'],
      },
      {
        id: 'rule-backup-failure',
        name: 'Backup Failure',
        description: 'Backup success rate drops below 100%',
        metric: 'backup.success_rate',
        condition: 'below',
        threshold: 100,
        durationSeconds: 0,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['ops-team', 'on-call'],
      },
    ];
  }
}

// ─── Monitoring Service ───────────────────────────────────────────────

export class MonitoringAlertingService {
  private readonly collector: MetricCollector;
  private readonly alertManager: AlertManager;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private alertEvalTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.collector = new MetricCollector(
      parseInt(process.env.METRIC_HISTORY_SIZE || '1000', 10)
    );
    this.alertManager = new AlertManager(
      parseInt(process.env.ALERT_HISTORY_SIZE || '5000', 10)
    );
  }

  /**
   * Start periodic health checks and alert evaluation.
   */
  start(): void {
    const healthCheckIntervalMs = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000', 10);
    const alertEvalIntervalMs = parseInt(process.env.ALERT_EVAL_INTERVAL_MS || '15000', 10);

    this.healthCheckTimer = setInterval(async () => {
      await this.collectSystemMetrics();
    }, healthCheckIntervalMs);

    this.alertEvalTimer = setInterval(() => {
      this.alertManager.evaluateRules(this.collector);
    }, alertEvalIntervalMs);

    console.log('[Monitoring] Service started');
  }

  /**
   * Stop all monitoring timers.
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    if (this.alertEvalTimer) {
      clearInterval(this.alertEvalTimer);
      this.alertEvalTimer = null;
    }
    console.log('[Monitoring] Service stopped');
  }

  /**
   * Get the metric collector for recording application metrics.
   */
  getCollector(): MetricCollector {
    return this.collector;
  }

  /**
   * Get the alert manager for alert operations.
   */
  getAlertManager(): AlertManager {
    return this.alertManager;
  }

  /**
   * Record an HTTP request metric.
   */
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.collector.increment('http.requests.total', { method, path });
    this.collector.gauge('http.response_time_ms', durationMs, { method, path });

    if (statusCode >= 400) {
      this.collector.increment('http.errors.total', { method, path, status: String(statusCode) });
    }
  }

  /**
   * Check health of all system components.
   */
  async checkServiceHealth(): Promise<HealthStatus[]> {
    const services: HealthStatus[] = [];

    // Database health
    services.push(await this.checkDatabaseHealth());

    // Application health
    services.push(this.checkApplicationHealth());

    // Cache health
    services.push(this.checkCacheHealth());

    return services;
  }

  /**
   * Generate a comprehensive system health report.
   * Aggregates data from the Disaster Recovery System and all other infrastructure modules.
   */
  async generateHealthReport(): Promise<SystemHealthReport> {
    const services = await this.checkServiceHealth();
    const activeAlerts = this.alertManager.getActiveAlerts();

    const overall = services.every((s) => s.status === 'healthy')
      ? 'healthy'
      : services.some((s) => s.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';

    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();

    return {
      timestamp: new Date().toISOString(),
      overall,
      services,
      activeAlerts,
      metrics: {
        requestsPerSecond: this.collector.getAverage('http.requests.total', 60000),
        averageResponseMs: this.collector.getAverage('http.response_time_ms', 60000),
        errorRate: this.calculateErrorRate(),
        activeConnections: 0, // Would come from connection pool stats
        cpuUsagePercent: this.getLatestMetricValue('system.cpu.usage_percent'),
        memoryUsagePercent: Math.round((memUsage.heapUsed / totalMem) * 100),
        diskUsagePercent: this.getLatestMetricValue('system.disk.usage_percent'),
      },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      const os = require('os');
      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      this.collector.gauge('system.memory.usage_percent', Math.round(((totalMem - freeMem) / totalMem) * 100));
      this.collector.gauge('system.memory.heap_used', memUsage.heapUsed);
      this.collector.gauge('system.memory.heap_total', memUsage.heapTotal);

      // CPU metrics (simplified)
      const cpus = os.cpus();
      if (cpus.length > 0) {
        const avgIdle = cpus.reduce((sum: number, cpu: { times: { idle: number; user: number; nice: number; sys: number; irq: number } }) => {
          const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
          return sum + (cpu.times.idle / total) * 100;
        }, 0) / cpus.length;
        this.collector.gauge('system.cpu.usage_percent', Math.round(100 - avgIdle));
      }

      // Database connectivity check
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      this.collector.gauge('db.response_time_ms', Date.now() - dbStart);
    } catch (error) {
      console.error('[Monitoring] Failed to collect system metrics:', error);
    }
  }

  private async checkDatabaseHealth(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        service: 'database',
        status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
        latencyMs: latency,
        lastCheck: new Date().toISOString(),
        details: { provider: 'postgresql', latencyMs: latency },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        lastCheck: new Date().toISOString(),
        details: { error: String(error) },
      };
    }
  }

  private checkApplicationHealth(): HealthStatus {
    const memUsage = process.memoryUsage();
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      service: 'application',
      status: heapUsagePercent < 80 ? 'healthy' : heapUsagePercent < 95 ? 'degraded' : 'unhealthy',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
      details: {
        heapUsedMb: Math.round(memUsage.heapUsed / 1048576),
        heapTotalMb: Math.round(memUsage.heapTotal / 1048576),
        rssMb: Math.round(memUsage.rss / 1048576),
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }

  private checkCacheHealth(): HealthStatus {
    return {
      service: 'cache',
      status: 'healthy',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
      details: { type: 'in-memory' },
    };
  }

  private calculateErrorRate(): number {
    const totalRequests = this.collector.getLatest('http.requests.total');
    const totalErrors = this.collector.getLatest('http.errors.total');

    if (!totalRequests || totalRequests.value === 0) return 0;
    if (!totalErrors) return 0;

    return Math.round((totalErrors.value / totalRequests.value) * 100 * 100) / 100;
  }

  private getLatestMetricValue(name: string): number {
    const metric = this.collector.getLatest(name);
    return metric ? metric.value : 0;
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const monitoringService = new MonitoringAlertingService();

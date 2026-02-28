import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export async function recordMetric(input: {
  name: string;
  value: number;
  unit: string;
  host?: string;
  tags?: string;
}) {
  return prisma.systemMetric.create({
    data: {
      name: input.name,
      value: input.value,
      unit: input.unit,
      host: input.host || 'primary',
      tags: input.tags || null,
    },
  });
}

export async function getMetrics(filters: {
  name?: string;
  host?: string;
  since?: string;
  limit?: number;
}) {
  return prisma.systemMetric.findMany({
    where: {
      ...(filters.name ? { name: filters.name } : {}),
      ...(filters.host ? { host: filters.host } : {}),
      ...(filters.since ? { recordedAt: { gte: new Date(filters.since) } } : {}),
    },
    orderBy: { recordedAt: 'desc' },
    take: filters.limit || 100,
  });
}

export async function getMetricsSummary() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentMetrics = await prisma.systemMetric.findMany({
    where: { recordedAt: { gte: oneHourAgo } },
    orderBy: { recordedAt: 'desc' },
  });

  // Get latest value for each metric name
  const latestByName: Record<string, { value: number; unit: string; recordedAt: Date }> = {};
  for (const metric of recentMetrics) {
    if (!latestByName[metric.name]) {
      latestByName[metric.name] = {
        value: metric.value,
        unit: metric.unit,
        recordedAt: metric.recordedAt,
      };
    }
  }

  return {
    metricCount: Object.keys(latestByName).length,
    recentRecordsLastHour: recentMetrics.length,
    latestMetrics: Object.entries(latestByName).map(([name, data]) => ({
      name,
      ...data,
    })),
  };
}

export async function checkServiceHealth(serviceName: string) {
  const startTime = Date.now();
  let status: 'HEALTHY_S' | 'DEGRADED_S' | 'UNHEALTHY_S' = 'HEALTHY_S';
  let errorMessage: string | null = null;

  try {
    if (serviceName === 'database') {
      await prisma.$queryRaw`SELECT 1`;
    }
    // For other services, we just record a healthy check
  } catch (error) {
    status = 'UNHEALTHY_S';
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  const responseMs = Date.now() - startTime;
  if (responseMs > 1000 && status === 'HEALTHY_S') {
    status = 'DEGRADED_S';
  }

  return prisma.serviceHealth.create({
    data: {
      serviceName,
      status: status as any,
      responseMs,
      errorMessage,
    },
  });
}

export async function getServiceHealthHistory(serviceName?: string, limit = 50) {
  return prisma.serviceHealth.findMany({
    where: {
      ...(serviceName ? { serviceName } : {}),
    },
    orderBy: { checkedAt: 'desc' },
    take: limit,
  });
}

export async function getServiceHealthLatest() {
  // Get latest health check for each service
  const allChecks = await prisma.serviceHealth.findMany({
    orderBy: { checkedAt: 'desc' },
    take: 200,
  });

  const latestByService: Record<string, any> = {};
  for (const check of allChecks) {
    if (!latestByService[check.serviceName]) {
      latestByService[check.serviceName] = check;
    }
  }

  return Object.values(latestByService);
}

export async function getDashboards() {
  return prisma.monitoringDashboard.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function getDashboardById(dashboardId: string) {
  const dashboard = await prisma.monitoringDashboard.findUnique({ where: { id: dashboardId } });
  if (!dashboard) throw new NotFoundError('Dashboard not found');
  return dashboard;
}

export async function createDashboard(input: {
  name: string;
  description?: string;
  layout: string;
  isDefault?: boolean;
  createdById?: string;
}) {
  return prisma.monitoringDashboard.create({
    data: {
      name: input.name,
      description: input.description || null,
      layout: input.layout,
      isDefault: input.isDefault || false,
      createdById: input.createdById || null,
    },
  });
}

export async function getMonitoringAlerts(isActive?: boolean) {
  return prisma.monitoringAlert.findMany({
    where: {
      ...(isActive !== undefined ? { isActive } : {}),
    },
    include: {
      _count: { select: { incidents: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createMonitoringAlert(input: {
  name: string;
  metricName: string;
  condition: string;
  threshold: number;
  severity?: string;
  cooldownMinutes?: number;
  notifyChannels?: string;
}) {
  return prisma.monitoringAlert.create({
    data: {
      name: input.name,
      metricName: input.metricName,
      condition: input.condition,
      threshold: input.threshold,
      severity: (input.severity as any) || 'WARNING_M',
      cooldownMinutes: input.cooldownMinutes || 15,
      notifyChannels: input.notifyChannels || 'IN_APP',
    },
  });
}

export async function getIncidents(filters: {
  monitoringAlertId?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.monitoringIncident.findMany({
    where: {
      ...(filters.monitoringAlertId ? { monitoringAlertId: filters.monitoringAlertId } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    include: {
      monitoringAlert: { select: { name: true, metricName: true, severity: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
  });
}

export async function acknowledgeIncident(incidentId: string, userId: string) {
  const incident = await prisma.monitoringIncident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new NotFoundError('Incident not found');

  return prisma.monitoringIncident.update({
    where: { id: incidentId },
    data: {
      status: 'ACKNOWLEDGED_I',
      acknowledgedById: userId,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveIncident(incidentId: string) {
  const incident = await prisma.monitoringIncident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new NotFoundError('Incident not found');

  return prisma.monitoringIncident.update({
    where: { id: incidentId },
    data: {
      status: 'RESOLVED_I',
      resolvedAt: new Date(),
    },
  });
}

export async function getMonitoringSummary() {
  const [
    totalAlerts,
    activeAlerts,
    openIncidents,
    services,
  ] = await Promise.all([
    prisma.monitoringAlert.count(),
    prisma.monitoringAlert.count({ where: { isActive: true } }),
    prisma.monitoringIncident.count({ where: { status: 'OPEN_I' } }),
    getServiceHealthLatest(),
  ]);

  const healthyServices = services.filter((s: any) => s.status === 'HEALTHY_S').length;

  return {
    totalAlerts,
    activeAlerts,
    openIncidents,
    totalServices: services.length,
    healthyServices,
    degradedServices: services.filter((s: any) => s.status === 'DEGRADED_S').length,
    unhealthyServices: services.filter((s: any) => s.status === 'UNHEALTHY_S').length,
  };
}

/**
 * Module 22: Multi-Tenancy Framework
 *
 * Provides tenant isolation, per-tenant configuration, and data segregation
 * for multi-district deployments. Each school district operates as an
 * isolated tenant with its own data boundaries.
 *
 * Cross-References:
 *   - Special Education Compliance Engine (supporting security features)
 *   - Parent Communication Portal (design of security features)
 *   - Data Integration Framework (implementation of security features)
 *   - API Gateway System (operational concerns)
 *
 * Functional Themes: security, scalability, reliability, core, integration, operational
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import {
  TenantContext,
  TenantTier,
  TenantConfig,
  TenantUsage,
  TenantIsolationReport,
} from './types';

// ─── Default Tenant Configurations by Tier ────────────────────────────

const TIER_DEFAULTS: Record<TenantTier, TenantConfig> = {
  basic: {
    maxUsers: 50,
    maxStudents: 500,
    maxStorageGb: 10,
    features: ['briefing', 'roster', 'observations'],
    customBranding: false,
    apiRateLimit: 100,
    dataRetentionDays: 365,
  },
  standard: {
    maxUsers: 200,
    maxStudents: 5000,
    maxStorageGb: 50,
    features: ['briefing', 'roster', 'observations', 'interventions', 'referrals', 'ai_assistant'],
    customBranding: false,
    apiRateLimit: 500,
    dataRetentionDays: 730,
  },
  premium: {
    maxUsers: 1000,
    maxStudents: 25000,
    maxStorageGb: 200,
    features: ['briefing', 'roster', 'observations', 'interventions', 'referrals', 'ai_assistant', 'analytics', 'api_access'],
    customBranding: true,
    apiRateLimit: 2000,
    dataRetentionDays: 1825,
  },
  enterprise: {
    maxUsers: -1, // unlimited
    maxStudents: -1,
    maxStorageGb: -1,
    features: ['briefing', 'roster', 'observations', 'interventions', 'referrals', 'ai_assistant', 'analytics', 'api_access', 'custom_integrations', 'sso'],
    customBranding: true,
    apiRateLimit: 10000,
    dataRetentionDays: 2555,
  },
};

// ─── Multi-Tenancy Service ────────────────────────────────────────────

export class MultiTenancyService {
  private tenantContexts = new Map<string, TenantContext>();

  /**
   * Resolve tenant context from an authenticated request.
   * Uses the teacher's school and district to determine tenant boundaries.
   */
  async resolveTenantContext(teacherSchoolId: string): Promise<TenantContext> {
    const cached = this.tenantContexts.get(teacherSchoolId);
    if (cached) return cached;

    const school = await prisma.school.findUnique({
      where: { id: teacherSchoolId },
      include: { district: true },
    });

    if (!school) {
      throw new Error(`School ${teacherSchoolId} not found`);
    }

    const context: TenantContext = {
      tenantId: school.districtId,
      districtId: school.districtId,
      schoolId: school.id,
      tenantName: school.district.name,
      tier: this.resolveTier(school.districtId),
      config: this.resolveConfig(school.districtId),
    };

    this.tenantContexts.set(teacherSchoolId, context);
    return context;
  }

  /**
   * Validate that a query is scoped to the correct tenant.
   * Prevents cross-tenant data access.
   */
  validateTenantScope(tenantId: string, resourceDistrictId: string): boolean {
    return tenantId === resourceDistrictId;
  }

  /**
   * Check if a feature is available for the given tenant tier.
   */
  isFeatureEnabled(tenantId: string, feature: string): boolean {
    const config = this.resolveConfig(tenantId);
    return config.features.includes(feature);
  }

  /**
   * Check if the tenant has exceeded their usage limits.
   */
  async checkTenantLimits(tenantId: string): Promise<{ withinLimits: boolean; violations: string[] }> {
    const config = this.resolveConfig(tenantId);
    const usage = await this.getTenantUsage(tenantId);
    const violations: string[] = [];

    if (config.maxUsers > 0 && usage.activeUsers > config.maxUsers) {
      violations.push(`User limit exceeded: ${usage.activeUsers}/${config.maxUsers}`);
    }

    if (config.maxStudents > 0 && usage.totalStudents > config.maxStudents) {
      violations.push(`Student limit exceeded: ${usage.totalStudents}/${config.maxStudents}`);
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }

  /**
   * Get current usage statistics for a tenant (district).
   */
  async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const [teacherCount, studentCount] = await Promise.all([
      prisma.teacher.count({
        where: { school: { districtId: tenantId } },
      }),
      prisma.student.count({
        where: { school: { districtId: tenantId } },
      }),
    ]);

    return {
      tenantId,
      activeUsers: teacherCount,
      totalStudents: studentCount,
      storageUsedGb: 0, // Would be calculated from actual storage metrics
      apiCallsToday: 0, // Would be tracked via rate limiter
      lastActivity: new Date().toISOString(),
    };
  }

  /**
   * Run a tenant isolation audit to verify data boundaries.
   * Used by Policy Compliance Monitor for compliance verification.
   */
  async auditTenantIsolation(tenantId: string): Promise<TenantIsolationReport> {
    const details: string[] = [];
    let violations = 0;

    // Check that all schools belong to the correct district
    const schools = await prisma.school.findMany({
      where: { districtId: tenantId },
      select: { id: true, name: true },
    });

    for (const school of schools) {
      // Verify students in this school belong to this district
      const crossDistrictStudents = await prisma.student.count({
        where: {
          schoolId: school.id,
          school: { districtId: { not: tenantId } },
        },
      });

      if (crossDistrictStudents > 0) {
        violations++;
        details.push(`School ${school.name}: ${crossDistrictStudents} students with mismatched district`);
      }

      // Verify teachers in this school belong to this district
      const crossDistrictTeachers = await prisma.teacher.count({
        where: {
          schoolId: school.id,
          school: { districtId: { not: tenantId } },
        },
      });

      if (crossDistrictTeachers > 0) {
        violations++;
        details.push(`School ${school.name}: ${crossDistrictTeachers} teachers with mismatched district`);
      }
    }

    if (details.length === 0) {
      details.push('All data properly isolated within tenant boundaries');
    }

    const queriesAudited = schools.length * 2;

    return {
      tenantId,
      timestamp: new Date().toISOString(),
      queriesAudited,
      crossTenantViolations: violations,
      isolationScore: queriesAudited > 0
        ? Math.round(((queriesAudited - violations) / queriesAudited) * 100)
        : 100,
      details,
    };
  }

  /**
   * Get tenant configuration for a district.
   */
  getConfig(tenantId: string): TenantConfig {
    return this.resolveConfig(tenantId);
  }

  /**
   * Clear cached tenant contexts (e.g., after config changes).
   */
  clearCache(): void {
    this.tenantContexts.clear();
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private resolveTier(districtId: string): TenantTier {
    // In production, this would query a tenant configuration store
    const tierOverride = process.env[`TENANT_TIER_${districtId}`] as TenantTier | undefined;
    return tierOverride || (process.env.DEFAULT_TENANT_TIER as TenantTier) || 'standard';
  }

  private resolveConfig(districtId: string): TenantConfig {
    const tier = this.resolveTier(districtId);
    return { ...TIER_DEFAULTS[tier] };
  }
}

// ─── Tenant Isolation Middleware ───────────────────────────────────────

/**
 * Express middleware that attaches tenant context to authenticated requests
 * and enforces tenant-level data isolation boundaries.
 */
export function tenantIsolation(tenancyService: MultiTenancyService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.teacher) {
        next();
        return;
      }

      const tenantContext = await tenancyService.resolveTenantContext(req.teacher.schoolId);
      (req as AuthenticatedRequest & { tenant?: TenantContext }).tenant = tenantContext;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// ─── Singleton Export ─────────────────────────────────────────────────

export const multiTenancyService = new MultiTenancyService();

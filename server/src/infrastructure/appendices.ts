/**
 * ATLAS Comprehensive Appendices (A–E) & Module Registry
 *
 * Appendix A: Technical Reference
 * Appendix B: Operational Procedures
 * Appendix C: Compliance Documentation
 * Appendix D: Configuration Guide
 * Appendix E: Troubleshooting Guide
 *
 * Also provides the complete 25-module registry with cross-reference index
 * mapping which modules reference which other modules across the system.
 */

import { ModuleDefinition, AppendixEntry } from './types';

// ─── Cross-Cutting Requirements ───────────────────────────────────────

const CROSS_CUTTING_REQUIREMENTS = [
  'High availability with automatic failover and recovery mechanisms',
  'Encryption at rest and in transit using industry-standard cryptographic algorithms',
  'Role-based access control (RBAC) ensuring legitimate data access only',
  'Comprehensive audit logging for all operations',
  'Seamless integration through well-defined APIs and event streams',
  'Performance optimization via database design, query optimization, caching, and horizontal scaling',
  'Thorough testing at unit, integration, and end-to-end levels',
  'Continuous production monitoring for rapid issue detection and resolution',
];

// ─── Complete 25-Module Registry ──────────────────────────────────────

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: 1,
    name: 'Student Information Management System',
    themes: ['core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability'],
    referencesTo: ['Special Education Compliance Engine', 'Attendance Tracking Module', 'Behavioral Management System', 'Academic Performance Reporting'],
    referencedBy: ['Encryption Security Module', 'Special Education Compliance Engine', 'Attendance Tracking Module'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Student Information Management System', role: 'core functionality' },
      { name: 'Context and Overview', referencedComponent: 'Special Education Compliance Engine', role: 'supporting core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Attendance Tracking Module', role: 'the design of core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Behavioral Management System', role: 'implementation of core functionality' },
      { name: 'Operational Aspects', referencedComponent: 'Academic Performance Reporting', role: 'operational concerns' },
    ],
  },
  {
    id: 2,
    name: 'Special Education Compliance Engine',
    themes: ['integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability', 'core functionality'],
    referencesTo: ['Attendance Tracking Module', 'Behavioral Management System', 'Academic Performance Reporting', 'Staff Scheduling Coordinator'],
    referencedBy: ['Multi-Tenancy Framework', 'Student Information Management System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Special Education Compliance Engine', role: 'integration capabilities' },
      { name: 'Context and Overview', referencedComponent: 'Attendance Tracking Module', role: 'supporting integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Behavioral Management System', role: 'the design of integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Academic Performance Reporting', role: 'implementation of integration capabilities' },
      { name: 'Operational Aspects', referencedComponent: 'Staff Scheduling Coordinator', role: 'operational concerns' },
    ],
  },
  {
    id: 3,
    name: 'Attendance Tracking Module',
    themes: ['operational requirements', 'security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities'],
    referencesTo: ['Behavioral Management System', 'Academic Performance Reporting', 'Staff Scheduling Coordinator', 'Parent Communication Portal'],
    referencedBy: ['Authentication Authorization System', 'Student Information Management System', 'Special Education Compliance Engine'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Attendance Tracking Module', role: 'operational requirements' },
      { name: 'Context and Overview', referencedComponent: 'Behavioral Management System', role: 'supporting operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Academic Performance Reporting', role: 'the design of operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Staff Scheduling Coordinator', role: 'implementation of operational requirements' },
      { name: 'Operational Aspects', referencedComponent: 'Parent Communication Portal', role: 'operational concerns' },
    ],
  },
  {
    id: 4,
    name: 'Behavioral Management System',
    themes: ['security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements'],
    referencesTo: ['Academic Performance Reporting', 'Staff Scheduling Coordinator', 'Parent Communication Portal', 'Case Management Engine'],
    referencedBy: ['Performance Optimization Module', 'Backup Recovery System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Behavioral Management System', role: 'security features' },
      { name: 'Context and Overview', referencedComponent: 'Academic Performance Reporting', role: 'supporting security features' },
      { name: 'Architecture and Design', referencedComponent: 'Staff Scheduling Coordinator', role: 'the design of security features' },
      { name: 'Architecture and Design', referencedComponent: 'Parent Communication Portal', role: 'implementation of security features' },
      { name: 'Operational Aspects', referencedComponent: 'Case Management Engine', role: 'operational concerns' },
    ],
  },
  {
    id: 5,
    name: 'Academic Performance Reporting',
    themes: ['scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features'],
    referencesTo: ['Staff Scheduling Coordinator', 'Parent Communication Portal', 'Case Management Engine', 'Task Assignment System'],
    referencedBy: ['Disaster Recovery System', 'Monitoring Alerting System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Academic Performance Reporting', role: 'scalability' },
      { name: 'Context and Overview', referencedComponent: 'Staff Scheduling Coordinator', role: 'supporting scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Parent Communication Portal', role: 'the design of scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Case Management Engine', role: 'implementation of scalability' },
      { name: 'Operational Aspects', referencedComponent: 'Task Assignment System', role: 'operational concerns' },
    ],
  },
  {
    id: 6,
    name: 'Staff Scheduling Coordinator',
    themes: ['reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability'],
    referencesTo: ['Parent Communication Portal', 'Case Management Engine', 'Task Assignment System', 'Policy Compliance Monitor'],
    referencedBy: ['Encryption Security Module', 'Attendance Tracking Module'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Staff Scheduling Coordinator', role: 'reliability' },
      { name: 'Context and Overview', referencedComponent: 'Parent Communication Portal', role: 'supporting reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Case Management Engine', role: 'the design of reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Task Assignment System', role: 'implementation of reliability' },
      { name: 'Operational Aspects', referencedComponent: 'Policy Compliance Monitor', role: 'operational concerns' },
    ],
  },
  {
    id: 7,
    name: 'Parent Communication Portal',
    themes: ['core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability'],
    referencesTo: ['Case Management Engine', 'Task Assignment System', 'Policy Compliance Monitor', 'Real-time Alert System'],
    referencedBy: ['Multi-Tenancy Framework', 'Behavioral Management System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Parent Communication Portal', role: 'core functionality' },
      { name: 'Context and Overview', referencedComponent: 'Case Management Engine', role: 'supporting core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Task Assignment System', role: 'the design of core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Policy Compliance Monitor', role: 'implementation of core functionality' },
      { name: 'Operational Aspects', referencedComponent: 'Real-time Alert System', role: 'operational concerns' },
    ],
  },
  {
    id: 8,
    name: 'Case Management Engine',
    themes: ['integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability', 'core functionality'],
    referencesTo: ['Task Assignment System', 'Policy Compliance Monitor', 'Real-time Alert System', 'Data Integration Framework'],
    referencedBy: ['Authentication Authorization System', 'Academic Performance Reporting'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Case Management Engine', role: 'integration capabilities' },
      { name: 'Context and Overview', referencedComponent: 'Task Assignment System', role: 'supporting integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Policy Compliance Monitor', role: 'the design of integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Real-time Alert System', role: 'implementation of integration capabilities' },
      { name: 'Operational Aspects', referencedComponent: 'Data Integration Framework', role: 'operational concerns' },
    ],
  },
  {
    id: 9,
    name: 'Task Assignment System',
    themes: ['operational requirements', 'security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities'],
    referencesTo: ['Policy Compliance Monitor', 'Real-time Alert System', 'Data Integration Framework', 'User Access Control System'],
    referencedBy: ['Performance Optimization Module', 'Backup Recovery System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Task Assignment System', role: 'operational requirements' },
      { name: 'Context and Overview', referencedComponent: 'Policy Compliance Monitor', role: 'supporting operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Real-time Alert System', role: 'the design of operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Data Integration Framework', role: 'implementation of operational requirements' },
      { name: 'Operational Aspects', referencedComponent: 'User Access Control System', role: 'operational concerns' },
    ],
  },
  {
    id: 10,
    name: 'Policy Compliance Monitor',
    themes: ['security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements'],
    referencesTo: ['Real-time Alert System', 'Data Integration Framework', 'User Access Control System', 'Audit Logging Module'],
    referencedBy: ['Disaster Recovery System', 'Monitoring Alerting System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Policy Compliance Monitor', role: 'security features' },
      { name: 'Context and Overview', referencedComponent: 'Real-time Alert System', role: 'supporting security features' },
      { name: 'Architecture and Design', referencedComponent: 'Data Integration Framework', role: 'the design of security features' },
      { name: 'Architecture and Design', referencedComponent: 'User Access Control System', role: 'implementation of security features' },
      { name: 'Operational Aspects', referencedComponent: 'Audit Logging Module', role: 'operational concerns' },
    ],
  },
  {
    id: 11,
    name: 'Real-time Alert System',
    themes: ['scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features'],
    referencesTo: ['Data Integration Framework', 'User Access Control System', 'Audit Logging Module', 'Reporting Analytics Engine'],
    referencedBy: ['Encryption Security Module', 'Case Management Engine'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Real-time Alert System', role: 'scalability' },
      { name: 'Context and Overview', referencedComponent: 'Data Integration Framework', role: 'supporting scalability' },
      { name: 'Architecture and Design', referencedComponent: 'User Access Control System', role: 'the design of scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Audit Logging Module', role: 'implementation of scalability' },
      { name: 'Operational Aspects', referencedComponent: 'Reporting Analytics Engine', role: 'operational concerns' },
    ],
  },
  {
    id: 12,
    name: 'Data Integration Framework',
    themes: ['reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability'],
    referencesTo: ['User Access Control System', 'Audit Logging Module', 'Reporting Analytics Engine', 'Mobile Support Module'],
    referencedBy: ['Multi-Tenancy Framework', 'Task Assignment System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Data Integration Framework', role: 'reliability' },
      { name: 'Context and Overview', referencedComponent: 'User Access Control System', role: 'supporting reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Audit Logging Module', role: 'the design of reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Reporting Analytics Engine', role: 'implementation of reliability' },
      { name: 'Operational Aspects', referencedComponent: 'Mobile Support Module', role: 'operational concerns' },
    ],
  },
  {
    id: 13,
    name: 'User Access Control System',
    themes: ['core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability'],
    referencesTo: ['Audit Logging Module', 'Reporting Analytics Engine', 'Mobile Support Module', 'API Gateway System'],
    referencedBy: ['Authentication Authorization System', 'Real-time Alert System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'User Access Control System', role: 'core functionality' },
      { name: 'Context and Overview', referencedComponent: 'Audit Logging Module', role: 'supporting core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Reporting Analytics Engine', role: 'the design of core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Mobile Support Module', role: 'implementation of core functionality' },
      { name: 'Operational Aspects', referencedComponent: 'API Gateway System', role: 'operational concerns' },
    ],
  },
  {
    id: 14,
    name: 'Audit Logging Module',
    themes: ['integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability', 'core functionality'],
    referencesTo: ['Reporting Analytics Engine', 'Mobile Support Module', 'API Gateway System', 'Database Architecture'],
    referencedBy: ['Performance Optimization Module', 'Backup Recovery System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Audit Logging Module', role: 'integration capabilities' },
      { name: 'Context and Overview', referencedComponent: 'Reporting Analytics Engine', role: 'supporting integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Mobile Support Module', role: 'the design of integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'API Gateway System', role: 'implementation of integration capabilities' },
      { name: 'Operational Aspects', referencedComponent: 'Database Architecture', role: 'operational concerns' },
    ],
  },
  {
    id: 15,
    name: 'Reporting Analytics Engine',
    themes: ['operational requirements', 'security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities'],
    referencesTo: ['Mobile Support Module', 'API Gateway System', 'Database Architecture', 'Performance Optimization Module'],
    referencedBy: ['Disaster Recovery System', 'Monitoring Alerting System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Reporting Analytics Engine', role: 'operational requirements' },
      { name: 'Context and Overview', referencedComponent: 'Mobile Support Module', role: 'supporting operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'API Gateway System', role: 'the design of operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Database Architecture', role: 'implementation of operational requirements' },
      { name: 'Operational Aspects', referencedComponent: 'Performance Optimization Module', role: 'operational concerns' },
    ],
  },
  {
    id: 16,
    name: 'Mobile Support Module',
    themes: ['security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements'],
    referencesTo: ['API Gateway System', 'Database Architecture', 'Performance Optimization Module', 'Disaster Recovery System'],
    referencedBy: ['Encryption Security Module', 'Data Integration Framework'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Mobile Support Module', role: 'security features' },
      { name: 'Context and Overview', referencedComponent: 'API Gateway System', role: 'supporting security features' },
      { name: 'Architecture and Design', referencedComponent: 'Database Architecture', role: 'the design of security features' },
      { name: 'Architecture and Design', referencedComponent: 'Performance Optimization Module', role: 'implementation of security features' },
      { name: 'Operational Aspects', referencedComponent: 'Disaster Recovery System', role: 'operational concerns' },
    ],
  },
  {
    id: 17,
    name: 'API Gateway System',
    themes: ['scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features'],
    referencesTo: ['Database Architecture', 'Performance Optimization Module', 'Disaster Recovery System', 'Encryption Security Module'],
    referencedBy: ['Multi-Tenancy Framework', 'User Access Control System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'API Gateway System', role: 'scalability' },
      { name: 'Context and Overview', referencedComponent: 'Database Architecture', role: 'supporting scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Performance Optimization Module', role: 'the design of scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Disaster Recovery System', role: 'implementation of scalability' },
      { name: 'Operational Aspects', referencedComponent: 'Encryption Security Module', role: 'operational concerns' },
    ],
  },
  {
    id: 18,
    name: 'Database Architecture',
    themes: ['reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability'],
    referencesTo: ['Performance Optimization Module', 'Disaster Recovery System', 'Encryption Security Module', 'Multi-Tenancy Framework'],
    referencedBy: ['Authentication Authorization System', 'API Gateway System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Database Architecture', role: 'reliability' },
      { name: 'Context and Overview', referencedComponent: 'Performance Optimization Module', role: 'supporting reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Disaster Recovery System', role: 'the design of reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Encryption Security Module', role: 'implementation of reliability' },
      { name: 'Operational Aspects', referencedComponent: 'Multi-Tenancy Framework', role: 'operational concerns' },
    ],
  },
  {
    id: 19,
    name: 'Performance Optimization Module',
    themes: ['core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability'],
    referencesTo: ['Backup Recovery System', 'Behavioral Management System', 'Task Assignment System', 'Audit Logging Module'],
    referencedBy: ['Behavioral Management System', 'Task Assignment System', 'Audit Logging Module', 'Backup Recovery System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Performance Optimization Module', role: 'core functionality' },
      { name: 'Context and Overview', referencedComponent: 'Backup Recovery System', role: 'supporting core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Behavioral Management System', role: 'the design of core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Task Assignment System', role: 'implementation of core functionality' },
      { name: 'Operational Aspects', referencedComponent: 'Audit Logging Module', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Performance Optimization Module', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Backup Recovery System', role: 'validation procedures' },
    ],
  },
  {
    id: 20,
    name: 'Disaster Recovery System',
    themes: ['integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability', 'core functionality'],
    referencesTo: ['Monitoring Alerting System', 'Academic Performance Reporting', 'Policy Compliance Monitor', 'Reporting Analytics Engine'],
    referencedBy: ['Academic Performance Reporting', 'Policy Compliance Monitor', 'Reporting Analytics Engine', 'Monitoring Alerting System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Disaster Recovery System', role: 'integration capabilities' },
      { name: 'Context and Overview', referencedComponent: 'Monitoring Alerting System', role: 'supporting integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Academic Performance Reporting', role: 'the design of integration capabilities' },
      { name: 'Architecture and Design', referencedComponent: 'Policy Compliance Monitor', role: 'implementation of integration capabilities' },
      { name: 'Operational Aspects', referencedComponent: 'Reporting Analytics Engine', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Disaster Recovery System', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Monitoring Alerting System', role: 'validation procedures' },
    ],
  },
  {
    id: 21,
    name: 'Encryption Security Module',
    themes: ['operational requirements', 'security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities'],
    referencesTo: ['Student Information Management System', 'Staff Scheduling Coordinator', 'Real-time Alert System', 'Mobile Support Module'],
    referencedBy: ['Student Information Management System', 'Staff Scheduling Coordinator', 'Real-time Alert System', 'Mobile Support Module'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Encryption Security Module', role: 'operational requirements' },
      { name: 'Context and Overview', referencedComponent: 'Student Information Management System', role: 'supporting operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Staff Scheduling Coordinator', role: 'the design of operational requirements' },
      { name: 'Architecture and Design', referencedComponent: 'Real-time Alert System', role: 'implementation of operational requirements' },
      { name: 'Operational Aspects', referencedComponent: 'Mobile Support Module', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Encryption Security Module', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Student Information Management System', role: 'validation procedures' },
    ],
  },
  {
    id: 22,
    name: 'Multi-Tenancy Framework',
    themes: ['security features', 'scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements'],
    referencesTo: ['Special Education Compliance Engine', 'Parent Communication Portal', 'Data Integration Framework', 'API Gateway System'],
    referencedBy: ['Special Education Compliance Engine', 'Parent Communication Portal', 'Data Integration Framework', 'API Gateway System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Multi-Tenancy Framework', role: 'security features' },
      { name: 'Context and Overview', referencedComponent: 'Special Education Compliance Engine', role: 'supporting security features' },
      { name: 'Architecture and Design', referencedComponent: 'Parent Communication Portal', role: 'the design of security features' },
      { name: 'Architecture and Design', referencedComponent: 'Data Integration Framework', role: 'implementation of security features' },
      { name: 'Operational Aspects', referencedComponent: 'API Gateway System', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Multi-Tenancy Framework', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Special Education Compliance Engine', role: 'validation procedures' },
    ],
  },
  {
    id: 23,
    name: 'Authentication Authorization System',
    themes: ['scalability', 'reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features'],
    referencesTo: ['Attendance Tracking Module', 'Case Management Engine', 'User Access Control System', 'Database Architecture'],
    referencedBy: ['Attendance Tracking Module', 'Case Management Engine', 'User Access Control System', 'Database Architecture'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Authentication Authorization System', role: 'scalability' },
      { name: 'Context and Overview', referencedComponent: 'Attendance Tracking Module', role: 'supporting scalability' },
      { name: 'Architecture and Design', referencedComponent: 'Case Management Engine', role: 'the design of scalability' },
      { name: 'Architecture and Design', referencedComponent: 'User Access Control System', role: 'implementation of scalability' },
      { name: 'Operational Aspects', referencedComponent: 'Database Architecture', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Authentication Authorization System', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Attendance Tracking Module', role: 'validation procedures' },
    ],
  },
  {
    id: 24,
    name: 'Backup Recovery System',
    themes: ['reliability', 'core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability'],
    referencesTo: ['Behavioral Management System', 'Task Assignment System', 'Audit Logging Module', 'Performance Optimization Module'],
    referencedBy: ['Behavioral Management System', 'Task Assignment System', 'Audit Logging Module', 'Performance Optimization Module'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Backup Recovery System', role: 'reliability' },
      { name: 'Context and Overview', referencedComponent: 'Behavioral Management System', role: 'supporting reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Task Assignment System', role: 'the design of reliability' },
      { name: 'Architecture and Design', referencedComponent: 'Audit Logging Module', role: 'implementation of reliability' },
      { name: 'Operational Aspects', referencedComponent: 'Performance Optimization Module', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Backup Recovery System', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Behavioral Management System', role: 'validation procedures' },
    ],
  },
  {
    id: 25,
    name: 'Monitoring Alerting System',
    themes: ['core functionality', 'integration capabilities', 'operational requirements', 'security features', 'scalability', 'reliability'],
    referencesTo: ['Academic Performance Reporting', 'Policy Compliance Monitor', 'Reporting Analytics Engine', 'Disaster Recovery System'],
    referencedBy: ['Academic Performance Reporting', 'Policy Compliance Monitor', 'Reporting Analytics Engine', 'Disaster Recovery System'],
    subsections: [
      { name: 'Context and Overview', referencedComponent: 'Monitoring Alerting System', role: 'core functionality' },
      { name: 'Context and Overview', referencedComponent: 'Academic Performance Reporting', role: 'supporting core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Policy Compliance Monitor', role: 'the design of core functionality' },
      { name: 'Architecture and Design', referencedComponent: 'Reporting Analytics Engine', role: 'implementation of core functionality' },
      { name: 'Operational Aspects', referencedComponent: 'Disaster Recovery System', role: 'operational concerns' },
      { name: 'Testing and Validation', referencedComponent: 'Monitoring Alerting System', role: 'testing strategies' },
      { name: 'Testing and Validation', referencedComponent: 'Academic Performance Reporting', role: 'validation procedures' },
    ],
  },
];

// ─── Cross-Reference Index (Part 4: Modules 19–25) ───────────────────

export const crossReferenceIndex: Record<string, { referencesTo: string[]; referencedBy: string[] }> = {};

for (const mod of moduleRegistry) {
  crossReferenceIndex[mod.name] = {
    referencesTo: mod.referencesTo,
    referencedBy: mod.referencedBy,
  };
}

// ─── Appendices A–E ───────────────────────────────────────────────────

export const appendices: AppendixEntry[] = [
  {
    id: 'appendix-a',
    title: 'A. Technical Reference',
    description: 'Technical reference documentation for all 25 system modules. Covers API specifications, data models, integration protocols, and system architecture details.',
    applicableModules: Array.from({ length: 25 }, (_, i) => i + 1),
    crossCuttingRequirements: CROSS_CUTTING_REQUIREMENTS,
  },
  {
    id: 'appendix-b',
    title: 'B. Operational Procedures',
    description: 'Operational procedures and guidelines for all 25 system modules. Includes deployment checklists, maintenance schedules, incident response procedures, and escalation paths.',
    applicableModules: Array.from({ length: 25 }, (_, i) => i + 1),
    crossCuttingRequirements: CROSS_CUTTING_REQUIREMENTS,
  },
  {
    id: 'appendix-c',
    title: 'C. Compliance Documentation',
    description: 'Compliance requirements and verification procedures for all 25 system modules. Covers FERPA compliance, COPPA requirements, Section 508 accessibility, state reporting mandates, and data privacy regulations.',
    applicableModules: Array.from({ length: 25 }, (_, i) => i + 1),
    crossCuttingRequirements: CROSS_CUTTING_REQUIREMENTS,
  },
  {
    id: 'appendix-d',
    title: 'D. Configuration Guide',
    description: 'Configuration options and parameters for all 25 system modules. Includes environment variables, feature flags, tenant-level configuration, integration settings, and performance tuning parameters.',
    applicableModules: Array.from({ length: 25 }, (_, i) => i + 1),
    crossCuttingRequirements: CROSS_CUTTING_REQUIREMENTS,
  },
  {
    id: 'appendix-e',
    title: 'E. Troubleshooting Guide',
    description: 'Common issues and troubleshooting procedures for all 25 system modules. Covers error codes, diagnostic procedures, recovery steps, and known limitations with workarounds.',
    applicableModules: Array.from({ length: 25 }, (_, i) => i + 1),
    crossCuttingRequirements: CROSS_CUTTING_REQUIREMENTS,
  },
];

import { prisma } from '../utils/prisma';
import {
  ActionItemView,
  CreateActionItemInput,
  CompleteActionItemInput,
  ReviewOutcomeInput,
  ActionItemDashboard,
} from '../types';

function toView(item: any): ActionItemView {
  return {
    id: item.id,
    studentId: item.studentId,
    firstName: item.student.firstName,
    lastName: item.student.lastName,
    photoUrl: item.student.photoUrl,
    triggerType: item.triggerType,
    triggerRef: item.triggerRef,
    title: item.title,
    suggestedAction: item.suggestedAction,
    status: item.status,
    completedAt: item.completedAt?.toISOString() || null,
    completionNotes: item.completionNotes,
    actionTaken: item.actionTaken,
    reviewAfterDays: item.reviewAfterDays,
    reviewDueAt: item.reviewDueAt?.toISOString() || null,
    outcomeStatus: item.outcomeStatus,
    outcomeNotes: item.outcomeNotes,
    outcomeReviewedAt: item.outcomeReviewedAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
  };
}

const studentInclude = {
  student: {
    select: { firstName: true, lastName: true, photoUrl: true },
  },
};

/**
 * Create a new action item from a briefing card trigger.
 */
export async function createActionItem(
  teacherId: string,
  input: CreateActionItemInput
): Promise<ActionItemView> {
  const item = await prisma.actionItem.create({
    data: {
      teacherId,
      studentId: input.studentId,
      triggerType: input.triggerType as any,
      triggerRef: input.triggerRef || null,
      title: input.title,
      suggestedAction: input.suggestedAction,
      reviewAfterDays: input.reviewAfterDays ?? 3,
    },
    include: studentInclude,
  });
  return toView(item);
}

/**
 * Mark an action item as completed, recording what was done.
 */
export async function completeActionItem(
  teacherId: string,
  actionItemId: string,
  input: CompleteActionItemInput
): Promise<ActionItemView> {
  const now = new Date();
  const item = await prisma.actionItem.findFirst({
    where: { id: actionItemId, teacherId },
  });
  if (!item) throw new Error('Action item not found');

  const reviewDueAt = new Date(now);
  reviewDueAt.setDate(reviewDueAt.getDate() + item.reviewAfterDays);

  const updated = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: {
      status: 'COMPLETED',
      completedAt: now,
      actionTaken: input.actionTaken,
      completionNotes: input.completionNotes,
      reviewDueAt,
    },
    include: studentInclude,
  });
  return toView(updated);
}

/**
 * Record the outcome of an action after the review period.
 */
export async function reviewOutcome(
  teacherId: string,
  actionItemId: string,
  input: ReviewOutcomeInput
): Promise<ActionItemView> {
  const item = await prisma.actionItem.findFirst({
    where: { id: actionItemId, teacherId, status: 'COMPLETED' },
  });
  if (!item) throw new Error('Action item not found or not completed');

  const updated = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: {
      outcomeStatus: input.outcomeStatus as any,
      outcomeNotes: input.outcomeNotes,
      outcomeReviewedAt: new Date(),
    },
    include: studentInclude,
  });
  return toView(updated);
}

/**
 * Dismiss an action item (teacher decides it's not needed).
 */
export async function dismissActionItem(
  teacherId: string,
  actionItemId: string
): Promise<ActionItemView> {
  const item = await prisma.actionItem.findFirst({
    where: { id: actionItemId, teacherId },
  });
  if (!item) throw new Error('Action item not found');

  const updated = await prisma.actionItem.update({
    where: { id: actionItemId },
    data: { status: 'DISMISSED', outcomeStatus: 'NOT_APPLICABLE' },
    include: studentInclude,
  });
  return toView(updated);
}

/**
 * Get the full action items dashboard for a teacher.
 */
export async function getActionItemDashboard(
  teacherId: string
): Promise<ActionItemDashboard> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Pending actions (not yet completed)
  const pendingActions = await prisma.actionItem.findMany({
    where: {
      teacherId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: studentInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Completed but pending outcome review (review period has elapsed)
  const pendingReviews = await prisma.actionItem.findMany({
    where: {
      teacherId,
      status: 'COMPLETED',
      outcomeStatus: 'PENDING',
      reviewDueAt: { lte: now },
    },
    include: studentInclude,
    orderBy: { reviewDueAt: 'asc' },
  });

  // Recently reviewed outcomes (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOutcomes = await prisma.actionItem.findMany({
    where: {
      teacherId,
      outcomeStatus: { not: 'PENDING' },
      outcomeReviewedAt: { gte: thirtyDaysAgo },
    },
    include: studentInclude,
    orderBy: { outcomeReviewedAt: 'desc' },
    take: 20,
  });

  // Stats
  const completedThisWeek = await prisma.actionItem.count({
    where: {
      teacherId,
      status: 'COMPLETED',
      completedAt: { gte: weekAgo },
    },
  });

  const allReviewed = await prisma.actionItem.findMany({
    where: {
      teacherId,
      outcomeStatus: { not: 'PENDING' },
      outcomeReviewedAt: { not: null },
    },
    select: { outcomeStatus: true },
  });

  const improvedCount = allReviewed.filter((r) => r.outcomeStatus === 'IMPROVED').length;
  const reviewableCount = allReviewed.filter((r) => r.outcomeStatus !== 'NOT_APPLICABLE').length;

  return {
    pendingActions: pendingActions.map(toView),
    pendingReviews: pendingReviews.map(toView),
    recentOutcomes: recentOutcomes.map(toView),
    stats: {
      totalOpen: pendingActions.length,
      completedThisWeek,
      pendingReviewCount: pendingReviews.length,
      improvedRate: reviewableCount > 0 ? improvedCount / reviewableCount : 0,
    },
  };
}

/**
 * Get action items for a specific student (used on briefing cards).
 */
export async function getStudentActionItems(
  teacherId: string,
  studentId: string
): Promise<ActionItemView[]> {
  const items = await prisma.actionItem.findMany({
    where: {
      teacherId,
      studentId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: studentInclude,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(toView);
}

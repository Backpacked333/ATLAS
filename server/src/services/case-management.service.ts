import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'ESCALATED', 'RESOLVED', 'CLOSED'];

export async function createCase(
  teacherId: string,
  schoolId: string,
  input: {
    studentId: string;
    type: string;
    priority?: string;
    title: string;
    description: string;
    assignedToId?: string;
  }
) {
  const newCase = await prisma.case.create({
    data: {
      schoolId,
      studentId: input.studentId,
      createdById: teacherId,
      assignedToId: input.assignedToId || teacherId,
      type: input.type as any,
      priority: (input.priority as any) || 'MEDIUM',
      title: input.title,
      description: input.description,
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  // Log the creation activity
  await prisma.caseActivity.create({
    data: {
      caseId: newCase.id,
      performedById: teacherId,
      action: 'CASE_CREATED',
      details: `Case created: ${input.title}`,
    },
  });

  return newCase;
}

export async function getCaseById(caseId: string, schoolId: string) {
  const found = await prisma.case.findFirst({
    where: { id: caseId, schoolId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, gradeLevel: true, photoUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      notes: {
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        include: { performedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!found) {
    throw new NotFoundError('Case not found');
  }

  return found;
}

export async function getSchoolCases(
  schoolId: string,
  filters: {
    status?: string;
    type?: string;
    priority?: string;
    assignedToId?: string;
    studentId?: string;
  }
) {
  return prisma.case.findMany({
    where: {
      schoolId,
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.type ? { type: filters.type as any } : {}),
      ...(filters.priority ? { priority: filters.priority as any } : {}),
      ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function getTeacherCases(teacherId: string) {
  return prisma.case.findMany({
    where: {
      OR: [
        { createdById: teacherId },
        { assignedToId: teacherId },
      ],
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function updateCaseStatus(
  caseId: string,
  schoolId: string,
  teacherId: string,
  status: string,
  resolution?: string
) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const existing = await prisma.case.findFirst({ where: { id: caseId, schoolId } });
  if (!existing) {
    throw new NotFoundError('Case not found');
  }

  const oldStatus = existing.status;

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: status as any,
      ...(status === 'RESOLVED' || status === 'CLOSED'
        ? { closedAt: new Date(), resolution: resolution || null }
        : {}),
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseId,
      performedById: teacherId,
      action: 'STATUS_CHANGED',
      details: `Status changed from ${oldStatus} to ${status}`,
    },
  });

  return updated;
}

export async function addCaseNote(
  caseId: string,
  schoolId: string,
  teacherId: string,
  content: string
) {
  const existing = await prisma.case.findFirst({ where: { id: caseId, schoolId } });
  if (!existing) {
    throw new NotFoundError('Case not found');
  }

  const note = await prisma.caseNote.create({
    data: {
      caseId,
      authorId: teacherId,
      content,
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseId,
      performedById: teacherId,
      action: 'NOTE_ADDED',
      details: `Note added: ${content.slice(0, 100)}`,
    },
  });

  return note;
}

export async function assignCase(
  caseId: string,
  schoolId: string,
  teacherId: string,
  assignedToId: string
) {
  const existing = await prisma.case.findFirst({ where: { id: caseId, schoolId } });
  if (!existing) {
    throw new NotFoundError('Case not found');
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { assignedToId },
    include: {
      student: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.caseActivity.create({
    data: {
      caseId,
      performedById: teacherId,
      action: 'ASSIGNED',
      details: `Case assigned to ${updated.assignedTo?.firstName} ${updated.assignedTo?.lastName}`,
    },
  });

  return updated;
}

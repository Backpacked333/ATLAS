import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../utils/errors';

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];

export async function createTask(
  teacherId: string,
  schoolId: string,
  input: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    assignedToId?: string;
    studentId?: string;
    caseId?: string;
    dueDate?: string;
  }
) {
  return prisma.task.create({
    data: {
      schoolId,
      createdById: teacherId,
      assignedToId: input.assignedToId || teacherId,
      studentId: input.studentId || null,
      caseId: input.caseId || null,
      title: input.title,
      description: input.description || null,
      category: input.category as any,
      priority: (input.priority as any) || 'MEDIUM',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getTeacherTasks(
  teacherId: string,
  filters: {
    status?: string;
    category?: string;
    priority?: string;
    overdueOnly?: boolean;
  }
) {
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { createdById: teacherId },
        { assignedToId: teacherId },
      ],
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.category ? { category: filters.category as any } : {}),
      ...(filters.priority ? { priority: filters.priority as any } : {}),
      ...(filters.overdueOnly
        ? { dueDate: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } }
        : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  });

  return tasks;
}

export async function getTaskById(taskId: string, teacherId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: teacherId },
        { assignedToId: teacherId },
      ],
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return task;
}

export async function updateTaskStatus(
  taskId: string,
  teacherId: string,
  status: string
) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: teacherId },
        { assignedToId: teacherId },
      ],
    },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: status as any,
      ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function updateTask(
  taskId: string,
  teacherId: string,
  input: {
    title?: string;
    description?: string;
    priority?: string;
    assignedToId?: string;
    dueDate?: string;
  }
) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: teacherId },
        { assignedToId: teacherId },
      ],
    },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority as any } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
      ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getTaskSummary(teacherId: string) {
  const now = new Date();

  const [pending, inProgress, overdue, completedThisWeek] = await Promise.all([
    prisma.task.count({
      where: { assignedToId: teacherId, status: 'PENDING' },
    }),
    prisma.task.count({
      where: { assignedToId: teacherId, status: 'IN_PROGRESS' },
    }),
    prisma.task.count({
      where: {
        assignedToId: teacherId,
        dueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    }),
    prisma.task.count({
      where: {
        assignedToId: teacherId,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
        },
      },
    }),
  ]);

  return { pending, inProgress, overdue, completedThisWeek };
}
